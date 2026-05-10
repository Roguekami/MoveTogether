const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const checkSuspended = require('../middleware/checkSuspended');
const {
  getUsers,
  suspendUser,
  getTrips,
  deleteTrip,
  getReports,
  resolveReport,
  getStats
} = require('../controllers/adminController');

router.use(auth);      // All routes need auth
router.use(checkSuspended); // Must not be suspended
router.use(isAdmin);   // All routes need admin role

router.get('/users', getUsers);
router.put('/users/:id/suspend', suspendUser);
router.get('/trips', getTrips);
router.delete('/trips/:id', deleteTrip);
router.get('/reports', getReports);
router.put('/reports/:id/resolve', resolveReport);
router.get('/stats', getStats);

module.exports = router;
