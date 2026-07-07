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

        if (!targetId || targetId.length !== 24) {
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

        if (!targetId || targetId.length !== 24) {
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

        if (!targetId || targetId.length !== 24) {
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
        if (!targetId || targetId.length !== 24) {
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

// DELETE /api/users/:id -- permanently delete a user and all their bookings (super admin only)
exports.deleteUser = async (req, res) => {
    try {
        // Security: Only the super admin can delete accounts
        if (!req.user.isSuperAdmin) {
            return res.status(403).json({ message: 'Only the super admin can delete user accounts' });
        }

        const targetId = req.params.id;

        if (!targetId || targetId.length !== 24 || !mongoose.Types.ObjectId.isValid(targetId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Security: Cannot delete yourself
        if (req.user.id === targetId) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        const targetUser = await User.findById(targetId);
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        // Security: Cannot delete another super admin
        if (targetUser.isSuperAdmin) {
            return res.status(403).json({ message: 'Cannot delete a super admin account' });
        }

        // Delete all bookings belonging to this user
        const { deletedCount } = await Booking.deleteMany({ userId: targetId });

        // Delete the user
        await User.findByIdAndDelete(targetId);

        res.json({
            message: `User "${targetUser.name}" and ${deletedCount} booking(s) deleted successfully`,
            deletedUserId: targetId,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', ...(process.env.NODE_ENV === 'development' && { error: error.message }) });
    }
};
/* 
Step 1: Get the target user's _id from the GET /api/users call above

Step 2:

PUT http://localhost:5000/api/users/<TARGET_USER_ID>/superadmin
Authorization: Bearer <CURRENT-SUPER-ADMIN-TOKEN>
No body needed. Response:

json
{
  "message": "Super admin transferred to newadmin@example.com",
  "newSuperAdmin": { "_id": "...", "name": "...", "email": "..." }
}
⚠️ This immediately revokes your own super admin and grants it to the other user. You'll need to log in as them to get it back.

*/