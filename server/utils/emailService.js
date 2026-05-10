const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const isConfigured = () => {
    return process.env.EMAIL_USER && 
           process.env.EMAIL_PASSWORD && 
           process.env.EMAIL_USER !== 'your-email@gmail.com';
};

// Send email (fails silently if not configured)
const sendEmail = async (to, subject, html) => {
    if (!isConfigured()) {
        console.log(`📧 [DEV] Email skipped (not configured): "${subject}" to ${to}`);
        return;
    }
    try {
        await transporter.sendMail({
            from: `"MoveTogether" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`📧 Email sent: "${subject}" to ${to}`);
    } catch (err) {
        console.error(`📧 Email failed: ${err.message}`);
    }
};

// --- Template Functions ---

const notifyNewJoinRequest = async (creatorEmail, creatorName, requesterName, tripTitle) => {
    await sendEmail(creatorEmail, `New Join Request for "${tripTitle}"`, `
        <h3>New Join Request</h3>
        <p>Hi ${creatorName},</p>
        <p><strong>${requesterName}</strong> has requested to join your trip <strong>"${tripTitle}"</strong>.</p>
        <p>Log in to MoveTogether to accept or reject the request.</p>
        <p>Happy travels! 🚀</p>
    `);
};

const notifyRequestAccepted = async (travelerEmail, travelerName, tripTitle) => {
    await sendEmail(travelerEmail, `You're in! 🎉 "${tripTitle}"`, `
        <h3>Request Accepted!</h3>
        <p>Hi ${travelerName},</p>
        <p>Great news! You've been accepted to the trip <strong>"${tripTitle}"</strong>.</p>
        <p>Check the trip details and group chat on MoveTogether.</p>
        <p>See you there! 🚀</p>
    `);
};

const notifyTripStatusChange = async (travelerEmails, tripTitle, newStatus) => {
    const statusMessages = {
        confirmed: 'has been <strong>confirmed</strong>! Get ready for departure.',
        cancelled: 'has been <strong>cancelled</strong> by the creator.',
        completed: 'has been marked as <strong>completed</strong>. Hope you had a great time!'
    };

    const message = statusMessages[newStatus] || `status has changed to <strong>${newStatus}</strong>.`;

    for (const { email, name } of travelerEmails) {
        await sendEmail(email, `Trip Update: "${tripTitle}" — ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`, `
            <h3>Trip Update</h3>
            <p>Hi ${name},</p>
            <p>Your trip <strong>"${tripTitle}"</strong> ${message}</p>
            <p>Check MoveTogether for more details.</p>
        `);
    }
};

const notifyPasswordReset = async (userEmail, userName, resetToken) => {
    // In production, this should be an environment variable like process.env.CLIENT_URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
    
    await sendEmail(userEmail, `Password Reset Request`, `
        <h3>Reset Your Password</h3>
        <p>Hi ${userName},</p>
        <p>You recently requested to reset your password for MoveTogether.</p>
        <p>Click the link below to reset it. This link is valid for 1 hour.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background-color:#7c3aed;color:white;text-decoration:none;border-radius:8px;">Reset Password</a></p>
        <p>If you did not request a password reset, please ignore this email or reply to let us know.</p>
        <p>Thanks,<br>The MoveTogether Team</p>
    `);
};

module.exports = {
    sendEmail,
    notifyNewJoinRequest,
    notifyRequestAccepted,
    notifyTripStatusChange,
    notifyPasswordReset
};
