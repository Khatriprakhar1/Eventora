const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            // Security: Block deleted accounts — return distinct 410 so client can show proper message
            if (req.user.isDeleted) {
                return res.status(410).json({ message: 'Your account has been deleted by an administrator.' });
            }
            // Security: Block suspended accounts from all protected routes
            if (req.user.isSuspended) {
                return res.status(403).json({ message: 'Account suspended' });
            }
            // Security: Invalidate tokens issued before a password change
            if (req.user.passwordChangedAt) {
                const changedAt = Math.floor(req.user.passwordChangedAt.getTime() / 1000);
                if (decoded.iat < changedAt) {
                    return res.status(401).json({ message: 'Password was changed. Please log in again.' });
                }
            }
            next();

        } catch (error) {
            // Security: Differentiate expired vs invalid tokens for better client handling
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired, please log in again' });
            }
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

// Security: Middleware to ensure only verified users can access certain routes
const verified = (req, res, next) => {
    if (req.user && (req.user.isVerified || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Please verify your account first' });
    }
};

module.exports = { protect, admin, verified };
