const User = require('../models/User');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');

// GET /api/users -- returns all users (no passwords) with their total booking count
exports.getAllUsers = async (req, res) => {
    try {
        // Aggregate booking counts per user in one DB round-trip
        const bookingCounts = await Booking.aggregate([
            { $group: { _id: '$userId', totalBookings: { $sum: 1 } } }
        ]);

        // Build a fast lookup map: userId string -> count
        const countMap = {};
        bookingCounts.forEach(({ _id, totalBookings }) => {
            countMap[_id.toString()] = totalBookings;
        });

        const users = await User.find({}).select('-password').sort({ createdAt: -1 }).lean();

        const result = users.map(u => ({
            ...u,
            totalBookings: countMap[u._id.toString()] || 0,
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// PUT /api/users/:id/role -- promote user to admin OR demote admin to user (super admin only)
exports.updateUserRole = async (req, res) => {
    try {
        // Security: Only the super admin can change roles
        if (!req.user.isSuperAdmin) {
            return res.status(403).json({ message: 'Only the super admin can change user roles' });
        }

        const targetId = req.params.id;

        // Security: Prevent super admin from changing their own role
        if (req.user.id === targetId) {
            return res.status(400).json({ message: 'You cannot change your own role' });
        }

        if (!mongoose.isValidObjectId(targetId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const targetUser = await User.findById(targetId).select('-password');
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        // Security: Cannot change role of another super admin
        if (targetUser.isSuperAdmin) {
            return res.status(403).json({ message: 'Cannot change the role of another super admin' });
        }

        // Toggle: user -> admin or admin -> user
        const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
        targetUser.role = newRole;
        await targetUser.save();

        res.json({ message: `Role updated to ${newRole}`, user: targetUser });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// PUT /api/users/:id/status -- flip isSuspended
exports.toggleUserStatus = async (req, res) => {
    try {
        const targetId = req.params.id;

        // Security: Prevent admin from suspending themselves
        if (req.user.id === targetId) {
            return res.status(400).json({ message: 'You cannot suspend your own account' });
        }

        if (!mongoose.isValidObjectId(targetId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const targetUser = await User.findById(targetId).select('-password');
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        // Security: Only super admin can suspend/unsuspend another admin
        if (targetUser.role === 'admin' && !req.user.isSuperAdmin) {
            return res.status(403).json({ message: 'Only the super admin can suspend admin accounts' });
        }

        // Security: Cannot suspend another super admin
        if (targetUser.isSuperAdmin) {
            return res.status(403).json({ message: 'Cannot suspend the super admin account' });
        }

        targetUser.isSuspended = !targetUser.isSuspended;
        await targetUser.save();

        const action = targetUser.isSuspended ? 'suspended' : 'unsuspended';
        res.json({ message: `User account ${action}`, user: targetUser });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// PUT /api/users/:id/verify -- manually set isVerified to true
exports.forceVerifyUser = async (req, res) => {
    try {
        const targetId = req.params.id;

        if (!mongoose.isValidObjectId(targetId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const targetUser = await User.findById(targetId).select('-password');
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        if (targetUser.isVerified) {
            return res.status(400).json({ message: 'User is already verified' });
        }

        targetUser.isVerified = true;
        await targetUser.save();

        res.json({ message: 'User manually verified', user: targetUser });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// PUT /api/users/:id/superadmin -- transfer super admin to another user (super admin only)
exports.transferSuperAdmin = async (req, res) => {
    try {
        // Only the current super admin can call this
        if (!req.user.isSuperAdmin) {
            return res.status(403).json({ message: 'Only the super admin can transfer this role' });
        }

        const targetId = req.params.id;
        if (!mongoose.isValidObjectId(targetId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        if (req.user.id === targetId) {
            return res.status(400).json({ message: 'You are already the super admin' });
        }

        const targetUser = await User.findById(targetId).select('-password');
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        // Revoke from current super admin
        await User.findByIdAndUpdate(req.user.id, { $set: { isSuperAdmin: false } });

        // Grant to target — also ensure they are admin + verified
        targetUser.isSuperAdmin = true;
        targetUser.role = 'admin';
        targetUser.isVerified = true;
        await targetUser.save();

        res.json({
            message: `Super admin transferred to ${targetUser.email}`,
            newSuperAdmin: { _id: targetUser._id, name: targetUser.name, email: targetUser.email }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', ...(process.env.NODE_ENV === 'development' && { error: error.message }) });
    }
};

/*
 * ============================================================
 *  HOW TO TRANSFER SUPER ADMIN TO ANOTHER USER
 * ============================================================
 *
 * Use these API calls in order (Postman, curl, or any HTTP client).
 * Replace <BASE_URL> with your server URL,
 * e.g. https://eventora-server.onrender.com/api
 *
 * ── STEP 1: Login as the current super admin ──────────────────
 *
 *   POST <BASE_URL>/auth/login
 *   Content-Type: application/json
 *
 *   Body:
 *   {
 *     "email": "current_superadmin@example.com",
 *     "password": "yourpassword"
 *   }
 *
 *   → Copy the "token" value from the response.
 *
 * ── STEP 2: Get all users to find the target user's _id ───────
 *
 *   GET <BASE_URL>/users
 *   Authorization: Bearer <TOKEN_FROM_STEP_1>
 *
 *   → Find the user you want to promote in the response array.
 *     Copy their "_id" value.
 *
 * ── STEP 3: Transfer super admin ──────────────────────────────
 *
 *   PUT <BASE_URL>/users/<TARGET_USER_ID>/superadmin
 *   Authorization: Bearer <TOKEN_FROM_STEP_1>
 *   (No request body needed)
 *
 *   → On success you will receive:
 *   {
 *     "message": "Super admin transferred to newadmin@example.com",
 *     "newSuperAdmin": { "_id": "...", "name": "...", "email": "..." }
 *   }
 *
 * ⚠️  WARNING: After Step 3 your current token immediately loses
 *     super admin privileges. Log in fresh as the new super admin
 *     if you need to continue managing the platform.
 * ============================================================
 */
