const User = require('../models/User');
const bcrypt = require('bcryptjs');

const NAME_CHANGE_COOLDOWN_DAYS = 7;

// GET /api/profile - Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// PUT /api/profile - Update name, password, or avatar
exports.updateProfile = async (req, res) => {
    try {
        const { name, currentPassword, newPassword, avatar } = req.body;

        if (!name || name.length < 2 || name.length > 50) {
            return res.status(400).json({ message: 'Name must be between 2 and 50 characters' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Enforce name change cooldown (once per 7 days)
        const nameChanged = name.trim() !== user.name;
        if (nameChanged && user.nameLastChangedAt) {
            const daysSinceLastChange = (Date.now() - new Date(user.nameLastChangedAt).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceLastChange < NAME_CHANGE_COOLDOWN_DAYS) {
                const daysLeft = Math.ceil(NAME_CHANGE_COOLDOWN_DAYS - daysSinceLastChange);
                const nextChangeDate = new Date(user.nameLastChangedAt);
                nextChangeDate.setDate(nextChangeDate.getDate() + NAME_CHANGE_COOLDOWN_DAYS);
                return res.status(429).json({
                    message: `You can only change your name once per week. Try again in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.`,
                    nextChangeDate: nextChangeDate.toISOString(),
                    daysLeft,
                });
            }
        }

        if (nameChanged) {
            user.name = name.trim();
            user.nameLastChangedAt = new Date();
        }

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required to change password' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ message: 'New password must be at least 6 characters' });
            }
            if (newPassword.length > 128) {
                return res.status(400).json({ message: 'Password is too long (max 128 characters)' });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            user.passwordChangedAt = new Date(); // Security: invalidates all existing tokens
        }

        // Save avatar if provided
        if (avatar !== undefined) {
            if (avatar === null) {
                user.avatar = null; // remove avatar
            } else {
                // Validate it's a base64 image and not too large (~2MB limit)
                if (!avatar.startsWith('data:image/')) {
                    return res.status(400).json({ message: 'Invalid image format.' });
                }
                const sizeInBytes = Buffer.byteLength(avatar, 'utf8');
                if (sizeInBytes > 2 * 1024 * 1024) {
                    return res.status(400).json({ message: 'Image too large. Max size is 2MB after compression.' });
                }
                user.avatar = avatar;
            }
        }

        await user.save();
        const updated = await User.findById(user._id).select('-password');
        res.json({ message: 'Profile updated successfully', user: updated });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// DELETE /api/profile/avatar - Remove profile picture
exports.removeAvatar = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { avatar: null });
        const updated = await User.findById(req.user._id).select('-password');
        res.json({ message: 'Profile picture removed.', user: updated });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

