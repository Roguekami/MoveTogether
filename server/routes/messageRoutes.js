const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getConversations, getMessages, sendMessage } = require('../controllers/messageController');

router.get('/conversations', auth, getConversations);
router.get('/:recipientId', auth, getMessages);
router.post('/:recipientId', auth, sendMessage);

module.exports = router;
