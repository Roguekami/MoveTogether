require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const path = require('path');

const isConfigured = () => {
    return process.env.BREVO_API_KEY && process.env.EMAIL_USER;
};

// Send email via Brevo REST API (bypasses Render SMTP block)
const sendEmail = async (to, subject, html) => {
    if (!isConfigured()) {
        console.log(`📧 [DEV] Email skipped (not configured): "${subject}" to ${to}`);
        return;
    }
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {  
                    name: "MoveTogether", 
                    email: process.env.EMAIL_USER 
                },
                to: [{ email: to }],
                subject: subject,
                htmlContent: html
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Brevo API Error: ${errorText}`);
        }
        
        console.log(`📧 Email sent successfully via Brevo: "${subject}" to ${to}`);
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

const notifyVerificationCode = async (userEmail, userName, code) => {
    await sendEmail(userEmail, `Your MoveTogether Verification Code`, `
        <h3>Email Verification</h3>
        <p>Hi ${userName},</p>
        <p>Welcome to MoveTogether! Your verification code is:</p>
        <div style="text-align:center;margin:20px 0;">
            <span style="display:inline-block;padding:16px 32px;background-color:#7c3aed;color:white;font-size:28px;font-weight:bold;letter-spacing:6px;border-radius:12px;">${code}</span>
        </div>
        <p>Enter this code in the app to verify your email address.</p>
        <p>Thanks,<br>The MoveTogether Team</p>
    `);
};

const notifyReportResolved = async (reporterEmail, reporterName, reportedUserName, reason) => {
    await sendEmail(reporterEmail, `Your Report Has Been Resolved`, `
        <h3>Report Update</h3>
        <p>Hi ${reporterName},</p>
        <p>Your report regarding <strong>${reportedUserName}</strong> has been reviewed and resolved by our admin team.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Thank you for helping keep MoveTogether safe!</p>
    `);
};

module.exports = {
    sendEmail,
    notifyNewJoinRequest,
    notifyRequestAccepted,
    notifyTripStatusChange,
    notifyPasswordReset,
    notifyVerificationCode,
    notifyReportResolved
};
