const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Helper to generate a consistent conversationId from two user IDs
messageSchema.statics.getConversationId = function(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
};

module.exports = mongoose.model('Message', messageSchema);
