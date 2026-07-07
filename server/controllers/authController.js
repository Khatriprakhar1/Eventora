const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/email');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Security: Basic email format validation
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Security: Input validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (name.length < 2 || name.length > 50) {
            return res.status(400).json({ message: 'Name must be between 2 and 50 characters' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }
        if (password.length > 128) {
            return res.status(400).json({ message: 'Password is too long' });
        }

        let user = await User.findOne({ email: email.toLowerCase().trim() });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: 'user', // Hardcoded to prevent frontend passing role
            isVerified: false
        });

        const otp = generateOTP();
        await OTP.create({ email: user.email, otp, action: 'account_verification' });
        await sendOTPEmail(user.email, otp, 'account_verification');

        res.status(201).json({
            message: 'OTP sent to email. Please verify.',
            email: user.email
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', ...(process.env.NODE_ENV === 'development' && { error: error.message }) });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Security: Input validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        // Security: Generic error message to avoid user enumeration
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // Security: Block suspended accounts BEFORE bcrypt to prevent credential-oracle attacks
        // (avoids leaking whether a password is correct via 403 vs 400 status difference)
        if (user.isSuspended) {
            return res.status(403).json({ message: 'Account suspended' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        if (!user.isVerified && user.role !== 'admin') {
            const otp = generateOTP();
            await OTP.findOneAndDelete({ email: user.email, action: 'account_verification' });
            await OTP.create({ email: user.email, otp, action: 'account_verification' });
            await sendOTPEmail(user.email, otp, 'account_verification');
            return res.status(403).json({ message: 'Account not verified', needsVerification: true, email: user.email });
        }

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            isSuperAdmin: user.isSuperAdmin || false,
            createdAt: user.createdAt,
            avatar: user.avatar || null,
            token: generateToken(user.id, user.role)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', ...(process.env.NODE_ENV === 'development' && { error: error.message }) });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Security: Input validation
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }
        // Security: OTP must be exactly 6 digits to prevent injection
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({ message: 'Invalid OTP format' });
        }

        const otpRecord = await OTP.findOne({ email: email.toLowerCase().trim(), action: 'account_verification' });

        // Security: Check attempt count before comparing OTP value (prevents brute-force)
        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
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

        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            { isVerified: true },
            { new: true }
        );

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        await OTP.deleteOne({ _id: otpRecord._id }); // Delete OTP after usage

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            isSuperAdmin: user.isSuperAdmin || false,
            createdAt: user.createdAt,
            avatar: user.avatar || null,
            token: generateToken(user.id, user.role)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
