const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { sendEventCancelledEmail } = require('../utils/email');

// Security: Escape regex special characters to prevent ReDoS attacks
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.getEvents = async (req, res) => {
    try {
        const filters = {};
        if (req.query.category) filters.category = req.query.category;
        if (req.query.search) {
            // Security: Limit search length and escape regex chars
            const searchTerm = String(req.query.search).slice(0, 100);
            filters.title = { $regex: escapeRegex(searchTerm), $options: 'i' };
        }

        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit) || 6;
        let query = Event.find(filters).populate('createdBy', 'name email').sort({ date: 1 });

        if (page) {
            const skip = (page - 1) * limit;
            const events = await query.skip(skip).limit(limit);
            const totalCount = await Event.countDocuments(filters);
            return res.json({
                events,
                totalCount,
                hasMore: skip + events.length < totalCount
            });
        } else {
            const events = await query;
            return res.json(events);
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, location, category, totalSeats, ticketPrice, image } = req.body;

        // Security: Server-side input validation
        if (!title || !description || !date || !location || !category || !totalSeats) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }
        if (title.length > 200) {
            return res.status(400).json({ message: 'Title is too long (max 200 chars)' });
        }
        if (description.length > 5000) {
            return res.status(400).json({ message: 'Description is too long (max 5000 chars)' });
        }
        const seats = Number(totalSeats);
        const price = Number(ticketPrice) || 0;
        if (!Number.isInteger(seats) || seats < 1 || seats > 100000) {
            return res.status(400).json({ message: 'Total seats must be between 1 and 100,000' });
        }
        if (price < 0) {
            return res.status(400).json({ message: 'Ticket price cannot be negative' });
        }
        // Security: Prevent creating events in the past
        const eventDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isNaN(eventDate.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }
        if (eventDate < today) {
            return res.status(400).json({ message: 'Event date cannot be in the past' });
        }
        // Security: Validate image URL if provided
        if (image && !/^https?:\/\/.+/i.test(image)) {
            return res.status(400).json({ message: 'Image must be a valid HTTP/HTTPS URL' });
        }

        const event = await Event.create({
            title: title.trim(),
            description: description.trim(),
            date,
            location: location.trim(),
            category: category.trim(),
            totalSeats: seats,
            availableSeats: seats,
            ticketPrice: price,
            image: image || '',
            createdBy: req.user.id
        });
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const { title, description, date, location, category, totalSeats, ticketPrice, image } = req.body;

        // Apply same validations as create
        if (!title || !description || !date || !location || !category || !totalSeats) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }
        if (title.length > 200) return res.status(400).json({ message: 'Title is too long (max 200 chars)' });
        if (description.length > 5000) return res.status(400).json({ message: 'Description is too long (max 5000 chars)' });

        const seats = Number(totalSeats);
        const price = Number(ticketPrice) || 0;
        if (!Number.isInteger(seats) || seats < 1 || seats > 100000) {
            return res.status(400).json({ message: 'Total seats must be between 1 and 100,000' });
        }
        if (price < 0) return res.status(400).json({ message: 'Ticket price cannot be negative' });

        // Security: Prevent updating event to a past date
        const eventDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isNaN(eventDate.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }
        if (eventDate < today) {
            return res.status(400).json({ message: 'Event date cannot be in the past' });
        }
        if (image && !/^https?:\/\/.+/i.test(image)) {
            return res.status(400).json({ message: 'Image must be a valid HTTP/HTTPS URL' });
        }

        const existingEvent = await Event.findById(req.params.id);
        if (!existingEvent) return res.status(404).json({ message: 'Event not found' });

        // Calculate how many seats were added/removed vs the old totalSeats
        const seatDiff = seats - existingEvent.totalSeats;
        const newAvailableSeats = Math.max(0, existingEvent.availableSeats + seatDiff);

        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { title: title.trim(), description: description.trim(), date, location: location.trim(),
              category: category.trim(), totalSeats: seats, availableSeats: newAvailableSeats,
              ticketPrice: price, image: image || '' },
            { new: true }
        );
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Find all active (non-cancelled) bookings for this event
        const activeBookings = await Booking
            .find({ eventId: event._id, status: { $ne: 'cancelled' } })
            .populate('userId', 'name email');

        // Bulk-cancel them all at once
        if (activeBookings.length > 0) {
            await Booking.updateMany(
                { eventId: event._id, status: { $ne: 'cancelled' } },
                { $set: { status: 'cancelled' } }
            );

            // Notify each affected user by email (fire-and-forget — don't block the response)
            const emailPromises = activeBookings
                .filter(b => b.userId?.email)
                .map(b => sendEventCancelledEmail(b.userId.email, b.userId.name, event.title));
            Promise.allSettled(emailPromises); // intentionally not awaited
        }

        // Now delete the event
        await event.deleteOne();

        res.json({
            message: 'Event deleted successfully',
            cancelledBookings: activeBookings.length,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
