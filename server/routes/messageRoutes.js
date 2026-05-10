const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getConversations, getMessages, sendMessage, deleteMessage, getUnreadCount } = require('../controllers/messageController');
const rateLimit = require('express-rate-limit');

// Message Limiter: Max 30 messages per minute
const messageLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: 'You are sending messages too quickly. Please wait a moment.'
});

router.get('/unread-count', auth, getUnreadCount);
router.get('/conversations', auth, getConversations);
router.get('/:recipientId', auth, getMessages);
router.post('/:recipientId', auth, messageLimiter, sendMessage);
router.delete('/message/:messageId', auth, deleteMessage);

module.exports = router;
