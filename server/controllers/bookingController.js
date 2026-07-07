const Booking = require('../models/Booking');
const Event = require('../models/Event');
const OTP = require('../models/OTP');
const { sendBookingEmail, sendOTPEmail } = require('../utils/email');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.sendBookingOTP = async (req, res) => {
    try {
        // Security: Only verified users can book events
        if (!req.user.isVerified && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Please verify your account before booking' });
        }

        const otp = generateOTP();
        await OTP.findOneAndDelete({ email: req.user.email, action: 'event_booking' });
        await OTP.create({ email: req.user.email, otp, action: 'event_booking' });
        await sendOTPEmail(req.user.email, otp, 'event_booking');
        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

exports.bookEvent = async (req, res) => {
    try {
        const { eventId, otp } = req.body;

        // Security: Input validation
        if (!eventId || !otp) {
            return res.status(400).json({ message: 'Event ID and OTP are required' });
        }
        // Security: OTP must be exactly 6 digits
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({ message: 'Invalid OTP format' });
        }
        // Security: Validate eventId is a valid MongoDB ObjectId format
        if (!/^[a-fA-F0-9]{24}$/.test(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }
        // Security: Only verified users can book events
        if (!req.user.isVerified && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Please verify your account before booking' });
        }

        // Verify OTP with brute-force protection (mirrors auth OTP logic)
        const otpRecord = await OTP.findOne({ email: req.user.email, action: 'event_booking' });
        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP for booking' });
        }
        const MAX_ATTEMPTS = 3;
        if (otpRecord.attempts >= MAX_ATTEMPTS) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ message: 'Too many incorrect attempts. Please request a new OTP.' });
        }
        if (otpRecord.otp !== otp) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            const remaining = MAX_ATTEMPTS - otpRecord.attempts;
            return res.status(400).json({
                message: remaining > 0
                    ? `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
                    : 'Too many incorrect attempts. Please request a new OTP.',
            });
        }
        const validOTP = otpRecord;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.availableSeats <= 0) return res.status(400).json({ message: 'No seats available' });

        const existingBooking = await Booking.findOne({ userId: req.user.id, eventId });
        if (existingBooking && existingBooking.status !== 'cancelled') {
            return res.status(400).json({ message: 'Already booked or pending' });
        }

        const booking = await Booking.create({
            userId: req.user.id,
            eventId,
            status: 'pending',
            paymentStatus: 'not_paid',
            amount: event.ticketPrice
        });

        await OTP.deleteOne({ _id: validOTP._id }); // cleanup

        res.status(201).json({ message: 'Booking request submitted', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.confirmBooking = async (req, res) => {
    try {
        const { paymentStatus } = req.body;

        // Security: Validate paymentStatus value
        if (paymentStatus && !['paid', 'not_paid'].includes(paymentStatus)) {
            return res.status(400).json({ message: 'Invalid payment status' });
        }

        const booking = await Booking.findById(req.params.id).populate('userId').populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'confirmed') return res.status(400).json({ message: 'Booking is already confirmed' });
        if (booking.status === 'cancelled') return res.status(400).json({ message: 'Cannot confirm a cancelled booking' });

        // Security: Atomic decrement — only succeeds if availableSeats > 0 (prevents race condition)
        const event = await Event.findOneAndUpdate(
            { _id: booking.eventId._id, availableSeats: { $gt: 0 } },
            { $inc: { availableSeats: -1 } },
            { new: true }
        );
        if (!event) {
            return res.status(400).json({ message: 'No seats available to confirm this booking' });
        }

        booking.status = 'confirmed';
        if (paymentStatus) booking.paymentStatus = paymentStatus;
        await booking.save();

        // Send email on admin confirmation
        await sendBookingEmail(booking.userId.email, booking.userId.name, booking.eventId.title);

        res.json({ message: 'Booking confirmed successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', ...(process.env.NODE_ENV === 'development' && { error: error.message }) });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = req.user.role === 'admin'
            ? await Booking.find().populate('eventId').populate('userId', 'name email').sort({ createdAt: -1 })
            : await Booking.find({ userId: req.user.id }).populate('eventId').sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

        const wasConfirmed = booking.status === 'confirmed';

        booking.status = 'cancelled';
        await booking.save();

        // Only restore the seat if it was actually confirmed and deducted
        // Use atomic $inc to prevent race conditions with concurrent cancellations
        if (wasConfirmed) {
            await Event.findByIdAndUpdate(booking.eventId, { $inc: { availableSeats: 1 } });
        }

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// GET /api/bookings/all -- admin only: returns all bookings with user + event details
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({})
            .populate('userId', 'name email')
            .populate('eventId', 'title date location ticketPrice availableSeats totalSeats category')
            .sort({ createdAt: -1 })
            .lean();
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
