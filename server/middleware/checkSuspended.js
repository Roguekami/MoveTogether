const User = require('../models/User');

const checkSuspended = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.isSuspended) {
      return res.status(403).json({ error: 'Account suspended. Contact admin.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = checkSuspended;
