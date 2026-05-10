const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['join_request', 'request_accepted', 'trip_status_change', 'system', 'new_message'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedTrip: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip'
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
