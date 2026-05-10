const User = require('../models/User');
const Trip = require('../models/Trip');
const Report = require('../models/Report');

// Get all users with stats
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    // Add stats to each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const tripsCreated = await Trip.countDocuments({ creator: user._id });
        const tripsJoined = await Trip.countDocuments({ travelers: user._id });
        
        return {
          ...user._doc,
          tripsCreated,
          tripsJoined
        };
      })
    );
    
    res.json(usersWithStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Suspend/unsuspend user
exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.isSuspended = !user.isSuspended;
    await user.save();
    
    res.json({ message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'}`, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all trips
exports.getTrips = async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete any trip
exports.deleteTrip = async (req, res) => {
  try {
    await Trip.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trip deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all reports
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporterId', 'name email')
      .populate('reportedUserId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Resolve report
exports.resolveReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporterId', 'name email')
      .populate('reportedUserId', 'name');

    if (!report) return res.status(404).json({ error: 'Report not found' });
    
    report.status = 'resolved';
    await report.save();
    
    // Send email notification if transporter is configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: report.reporterId.email,
          subject: 'Your Report Has Been Resolved',
          html: `
            <h3>Report Update</h3>
            <p>Hi ${report.reporterId.name},</p>
            <p>Your report regarding <strong>${report.reportedUserId.name}</strong> has been reviewed and resolved by our admin team.</p>
            <p><strong>Reason:</strong> ${report.reason}</p>
            <p>Thank you for helping keep MoveTogether safe!</p>
          `
        });
    } else {
        console.warn("EMAIL_USER or EMAIL_PASSWORD not set. Report resolution email skipped.");
    }
    
    res.json({ message: 'Report resolved and reporter notified', report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get platform stats
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTrips = await Trip.countDocuments();
    const activeTrips = await Trip.countDocuments({ 
      status: { $in: ['active', 'full', 'confirmed'] } 
    });
    const completedTrips = await Trip.countDocuments({ status: 'completed' });
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    
    res.json({
      totalUsers,
      totalTrips,
      activeTrips,
      completedTrips,
      pendingReports
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
