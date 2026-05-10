const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        required: true
    },
    reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 500
    }
}, { timestamps: true });

// Prevent multiple ratings for the same user on the same trip
ratingSchema.index({ tripId: 1, reviewerId: 1, reviewedUserId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
