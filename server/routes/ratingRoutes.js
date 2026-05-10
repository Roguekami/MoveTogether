const express = require('express');
const router = express.Router();

const ratingController = require('../controllers/ratingController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, ratingController.createRating);
router.get('/user/:userId', ratingController.getUserRatings); // Public or private based on preference, making it public

module.exports = router;
