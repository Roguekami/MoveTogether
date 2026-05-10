const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const rateLimit = require('express-rate-limit');

// Message Limiter: Max 30 messages per minute
const messageLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: 'You are sending messages too quickly. Please wait a moment.'
});

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
router.post('/:id/messages', messageLimiter, tripController.sendTripMessage);
router.delete('/:tripId/messages/:messageId', tripController.deleteTripMessage);
router.post('/:tripId/accept/:userId', tripController.acceptRequest);
router.post('/:tripId/reject/:userId', tripController.rejectRequest);
router.post('/:tripId/remove/:userId', tripController.removeTraveler);
router.delete('/:id', tripController.deleteTrip);

module.exports = router;
