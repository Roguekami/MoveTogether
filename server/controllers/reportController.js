const Report = require('../models/Report');
const User = require('../models/User');

exports.createReport = async (req, res) => {
    try {
        const { reportedUserId, reason, description } = req.body;
        const reporterId = req.user.id;

        if (!reportedUserId || !reason || !description) {
            return res.status(400).json({ message: "Reported user, reason, and description are required." });
        }

        if (reporterId === reportedUserId) {
            return res.status(400).json({ message: "You cannot report yourself." });
        }

        const reportedUser = await User.findById(reportedUserId);
        if (!reportedUser) {
            return res.status(404).json({ message: "Reported user not found." });
        }

        const newReport = await Report.create({
            reporterId,
            reportedUserId,
            reason,
            description
        });

        // In a real application, you might trigger an email to admins here
        console.log('\n=============================================');
        console.log('🚨 NEW REPORT SUBMITTED');
        console.log(`Reporter: ${reporterId}`);
        console.log(`Reported User: ${reportedUserId}`);
        console.log(`Reason: ${reason}`);
        console.log('=============================================\n');

        res.status(201).json({ message: "Report submitted successfully. Our team will review it.", report: newReport });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
