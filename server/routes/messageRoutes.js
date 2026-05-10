const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getConversations, getMessages, sendMessage, deleteMessage, getUnreadCount } = require('../controllers/messageController');

router.get('/unread-count', auth, getUnreadCount);
router.get('/conversations', auth, getConversations);
router.get('/:recipientId', auth, getMessages);
router.post('/:recipientId', auth, sendMessage);
router.delete('/message/:messageId', auth, deleteMessage);

module.exports = router;
