const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Security: Sanitize user input before inserting into HTML emails
// Prevents HTML/script injection via malicious usernames or event titles
const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
    try {
        const safeName = escapeHtml(userName);
        const safeTitle = escapeHtml(eventTitle);
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Booking Confirmed: ${safeTitle}`,
            html: `
        <h2>Hi ${safeName}!</h2>
        <p>Your booking for the event <strong>${safeTitle}</strong> is successfully confirmed.</p>
        <p>Thank you for choosing Eventora.</p>
      `
        };
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to', userEmail);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const sendOTPEmail = async (userEmail, otp, type) => {
    try {
        const title = type === 'account_verification' ? 'Verify your Eventora Account' : 'Eventora Booking Verification';
        const msg = type === 'account_verification'
            ? 'Please use the following OTP to verify your new Eventora account.'
            : 'Please use the following OTP to verify and confirm your event booking.';

        // Security: OTP is generated server-side (digits only), but sanitize just in case
        const safeOtp = escapeHtml(otp);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: title,
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                    <h2 style="color: #111;">${title}</h2>
                    <p style="color: #555; font-size: 16px;">${msg}</p>
                    <div style="margin: 20px auto; padding: 15px; font-size: 24px; font-weight: bold; background: #f4f4f4; width: max-content; letter-spacing: 5px;">
                        ${safeOtp}
                    </div>
                    <p style="color: #999; font-size: 12px;">This code expires in 5 minutes. If you didn't request this, please ignore this email.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${userEmail} for ${type}`);
    } catch (error) {
        console.error('Error sending OTP email:', error);
    }
};

const sendContactEmail = async ({ name, email, subject, message }) => {
    try {
        const safeName    = escapeHtml(name);
        const safeEmail   = escapeHtml(email);
        const safeSubject = escapeHtml(subject);
        const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // send to yourself (admin)
            replyTo: email,             // reply goes directly to the sender
            subject: `[Eventora Contact] ${safeSubject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
                    <h2 style="color: #4f46e5; margin-bottom: 4px;">New Contact Form Submission</h2>
                    <p style="color: #6b7280; margin-top: 0; font-size: 13px;">via Eventora Contact Page</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
                    <table style="width: 100%; font-size: 15px; color: #374151;">
                        <tr><td style="padding: 6px 0; font-weight: bold; width: 100px;">From:</td><td>${safeName} &lt;${safeEmail}&gt;</td></tr>
                        <tr><td style="padding: 6px 0; font-weight: bold;">Subject:</td><td>${safeSubject}</td></tr>
                    </table>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
                    <h3 style="color: #111827; margin-bottom: 8px;">Message</h3>
                    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; color: #374151; line-height: 1.7;">
                        ${safeMessage}
                    </div>
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                        Hit Reply to respond directly to ${safeName}.
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Contact email sent from ${email}`);
    } catch (error) {
        console.error('Error sending contact email:', error);
        throw error;
    }
};

const sendEventCancelledEmail = async (userEmail, userName, eventTitle) => {
    try {
        const safeName  = escapeHtml(userName);
        const safeTitle = escapeHtml(eventTitle);
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Event Cancelled: ${safeTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
                    <h2 style="color: #4f46e5; margin-bottom: 4px;">Event Cancellation Notice</h2>
                    <p style="color: #6b7280; margin-top: 0; font-size: 13px;">via Eventora</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
                    <p style="color: #374151; font-size: 15px;">Hi <strong>${safeName}</strong>,</p>
                    <p style="color: #374151; font-size: 15px;">
                        We're sorry to inform you that the event <strong>${safeTitle}</strong> has been
                        <span style="color: #ef4444; font-weight: bold;">cancelled</span> by the organiser.
                    </p>
                    <p style="color: #374151; font-size: 15px;">
                        Your booking for this event has been automatically cancelled. If you made a payment,
                        please contact the organiser for a refund.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
                    <p style="color: #9ca3af; font-size: 12px;">
                        We apologise for any inconvenience. Browse other events on Eventora.
                    </p>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Event cancellation email sent to ${userEmail}`);
    } catch (error) {
        console.error('Error sending event cancellation email:', error);
    }
};

module.exports = { sendBookingEmail, sendOTPEmail, sendContactEmail, sendEventCancelledEmail };

