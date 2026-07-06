const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

// Security: Refuse to start without a proper JWT secret
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
    process.exit(1);
}

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const profileRoutes = require('./routes/profile');
const contactRoutes = require('./routes/contact');
const userRoutes = require('./routes/users');

const app = express();

// Security: HTTP security headers (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(helmet());

// Security: CORS - restrict to known frontend origin in production
const allowedOrigins = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Security: Limit JSON body size to prevent large payload attacks
app.use(express.json({ limit: '1mb' }));

// Security: Global rate limiter - 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Security: Strict rate limiter for auth routes - 15 requests per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { message: 'Too many authentication attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Security: Strict rate limiter for OTP endpoints - 5 per 15 minutes
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Too many OTP requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Admin limiter - higher cap for dashboard reads (admin routes are already auth-protected)
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiters
app.use('/api/events', globalLimiter);
app.use('/api/bookings', globalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/auth/verify-otp', otpLimiter);
app.use('/api/bookings/send-otp', otpLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/profile', globalLimiter, profileRoutes);
app.use('/api/contact', globalLimiter, contactRoutes);
app.use('/api/users', adminLimiter, userRoutes);

// Database Connection
const User = require('./models/User');

const seedSuperAdmin = async () => {
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@eventora.com';
    try {
        // Step 1: Revoke isSuperAdmin from anyone who currently has it
        await User.updateMany({ isSuperAdmin: true }, { $set: { isSuperAdmin: false } });

        // Step 2: Grant isSuperAdmin to the designated account
        const updated = await User.findOneAndUpdate(
            { email: SUPER_ADMIN_EMAIL },
            { $set: { isSuperAdmin: true, role: 'admin', isVerified: true } },
            { new: true }
        );
        if (updated) {
            console.log(`✅ Super admin seeded: ${SUPER_ADMIN_EMAIL}`);
        } else {
            console.warn(`⚠️  Super admin account not found in DB: ${SUPER_ADMIN_EMAIL}`);
        }
    } catch (err) {
        console.error('Error seeding super admin:', err.message);
    }
};

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eventora')
  .then(async () => {
      console.log('MongoDB Connected');
      await seedSuperAdmin();
  })
  .catch(err => console.error('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
