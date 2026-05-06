const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    origin: {
        type: String,
        required: true,
        trim: true
    },
    destination: {
        type: String,
        required: true,
        trim: true
    },
    meeting_point: {
        type: String,
        required: true,
        trim: true
    },
    departureDate: {
        type: Date,
        required: true
    },
    transportType: {
        type: String,
        enum: ['Bus', 'Car', 'Train', 'Flight', 'Walk', 'Bike', 'Other'],
        required: true
    },
    category: {
        type: String,
        enum: ['Transport', 'Fitness', 'Adventure', 'Events', 'Social', 'Other'],
        required: true
    },
    maxTravelers: {
        type: Number,
        required: true,
        min: 2
    },
    totalCost: {
        type: Number,
        required: true,
        min: 0
    },
    travelers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    pendingRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['active', 'full', 'confirmed', 'completed', 'cancelled'],
        default: 'active'
    },
    imageUrl: {
        type: String,
        default: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000'
    }
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
