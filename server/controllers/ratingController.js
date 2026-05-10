const Rating = require('../models/Rating');
const Trip = require('../models/Trip');
const User = require('../models/User');

exports.createRating = async (req, res) => {
    try {
        const { tripId, reviewedUserId, rating, comment } = req.body;
        const reviewerId = req.user.id;

        // 1. Validate inputs
        if (!tripId || !reviewedUserId || !rating) {
            return res.status(400).json({ message: "Trip, reviewed user, and rating are required." });
        }

        if (reviewerId === reviewedUserId) {
            return res.status(400).json({ message: "You cannot rate yourself." });
        }

        // 2. Check if trip exists and is completed
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ message: "Trip not found." });
        }
        if (trip.status !== 'completed') {
            return res.status(400).json({ message: "You can only rate travelers after the trip is completed." });
        }

        // 3. Ensure both users were part of the trip
        const isReviewerParticipant = trip.travelers.some(t => t.toString() === reviewerId) || trip.creator.toString() === reviewerId;
        const isReviewedParticipant = trip.travelers.some(t => t.toString() === reviewedUserId) || trip.creator.toString() === reviewedUserId;

        if (!isReviewerParticipant || !isReviewedParticipant) {
            return res.status(400).json({ message: "Both users must have participated in the trip." });
        }

        // 4. Create the rating
        const newRating = await Rating.create({
            tripId,
            reviewerId,
            reviewedUserId,
            rating,
            comment
        });

        // 5. Update the average rating for the reviewed user
        const allRatings = await Rating.find({ reviewedUserId });
        const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

        await User.findByIdAndUpdate(reviewedUserId, { averageRating: avgRating.toFixed(1) });

        res.status(201).json({ message: "Rating submitted successfully.", rating: newRating });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "You have already rated this user for this trip." });
        }
        res.status(500).json({ message: err.message });
    }
};

exports.getUserRatings = async (req, res) => {
    try {
        const { userId } = req.params;
        const ratings = await Rating.find({ reviewedUserId: userId })
            .populate('reviewerId', 'name avatar') // assuming avatar exists, if not just name
            .populate('tripId', 'title')
            .sort({ createdAt: -1 });

        res.json({ ratings });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
