const User = require('../models/User');
const Trip = require('../models/Trip');
const Report = require('../models/Report');
const { notifyReportResolved } = require('../utils/emailService');

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

// Delete user account
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin accounts' });

    // Remove user from all trips they joined
    await Trip.updateMany(
      { travelers: user._id },
      { $pull: { travelers: user._id } }
    );

    // Delete all trips created by user
    await Trip.deleteMany({ creator: user._id });

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User account deleted successfully' });
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

// Resolve report
exports.resolveReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporterId', 'name email')
      .populate('reportedUserId', 'name');

    if (!report) return res.status(404).json({ error: 'Report not found' });
    
    report.status = 'resolved';
    await report.save();
    
    // Send email notification via Brevo
    await notifyReportResolved(
      report.reporterId.email,
      report.reporterId.name,
      report.reportedUserId.name,
      report.reason
    );
    
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
