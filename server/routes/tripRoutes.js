const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All trip routes require authentication
router.use(authMiddleware);

router.post('/', upload.single('image'), tripController.createTrip);
router.get('/', tripController.getAllTrips);
router.get('/mine', tripController.getMyTrips);
router.get('/:id', tripController.getTripById);

router.put('/:id', upload.single('image'), tripController.editTrip);
router.patch('/:id/status', tripController.updateTripStatus);

router.post('/:id/join', tripController.joinTrip);
router.post('/:id/leave', tripController.leaveTrip);

// Group Chat Routes
router.get('/:id/messages', tripController.getTripMessages);
router.post('/:id/messages', tripController.sendTripMessage);
router.post('/:tripId/accept/:userId', tripController.acceptRequest);
router.post('/:tripId/reject/:userId', tripController.rejectRequest);
router.post('/:tripId/remove/:userId', tripController.removeTraveler);
router.delete('/:id', tripController.deleteTrip);

module.exports = router;
