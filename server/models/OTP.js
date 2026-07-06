const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    action: { type: String, enum: ['account_verification', 'event_booking'], required: true },
    attempts: { type: Number, default: 0 }, // Security: max 3 attempts before OTP is invalidated
    createdAt: { type: Date, default: Date.now, expires: 300 } // OTP expires in 5 minutes
});

module.exports = mongoose.model('OTP', otpSchema);
