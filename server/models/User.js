const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    isSuperAdmin: { type: Boolean, default: false },
    nameLastChangedAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    avatar: { type: String, default: null }   // base64 compressed image
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
