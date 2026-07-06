const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../utils/email');

// Basic email format check
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// POST /api/contact
router.post('/', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Please provide a valid email address.' });
    }
    if (name.length > 100 || subject.length > 200 || message.length > 2000) {
        return res.status(400).json({ message: 'Input too long.' });
    }

    try {
        await sendContactEmail({ name, email, subject, message });
        res.json({ message: 'Your message has been sent successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send message. Please try again later.' });
    }
});

module.exports = router;
