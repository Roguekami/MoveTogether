const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

// GET all conversations for the current user
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all messages involving this user, get unique conversation IDs
        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }]
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'name')
        .populate('receiver', 'name');

        // Group by conversationId, keep the latest message per conversation
        const conversationMap = {};
        for (const msg of messages) {
            if (!conversationMap[msg.conversationId]) {
                const otherUser = msg.sender._id.toString() === userId 
                    ? msg.receiver 
                    : msg.sender;
                
                // Count unread messages in this conversation
                const unreadCount = await Message.countDocuments({
                    conversationId: msg.conversationId,
                    receiver: userId,
                    read: false
                });

                conversationMap[msg.conversationId] = {
                    conversationId: msg.conversationId,
                    otherUser,
                    lastMessage: msg.text,
                    lastMessageAt: msg.createdAt,
                    unreadCount
                };
            }
        }

        const conversations = Object.values(conversationMap);
        res.json({ conversations });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET messages for a specific conversation
exports.getMessages = async (req, res) => {
    try {
        const { recipientId } = req.params;
        const conversationId = Message.getConversationId(req.user.id, recipientId);

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .populate('sender', 'name')
            .populate('receiver', 'name');

        // Mark messages as read
        await Message.updateMany(
            { conversationId, receiver: req.user.id, read: false },
            { read: true }
        );

        // Get recipient info
        const recipient = await User.findById(recipientId).select('name bio');

        res.json({ messages, recipient });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST send a message
exports.sendMessage = async (req, res) => {
    try {
        const { recipientId, text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Message cannot be empty' });
        }

        const conversationId = Message.getConversationId(req.user.id, recipientId);

        const message = await Message.create({
            conversationId,
            sender: req.user.id,
            receiver: recipientId,
            text: text.trim()
        });

        const populated = await message.populate([
            { path: 'sender', select: 'name' },
            { path: 'receiver', select: 'name' }
        ]);

        // Create a notification for the recipient if there isn't an unread one from this sender already
        const existingNotif = await Notification.findOne({
            recipient: recipientId,
            type: 'new_message',
            isRead: false,
            message: `New message from ${populated.sender.name}`
        });

        if (!existingNotif) {
            await Notification.create({
                recipient: recipientId,
                type: 'new_message',
                message: `New message from ${populated.sender.name}`
            });
        }

        res.status(201).json({ message: populated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE a message (sender only)
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        if (message.sender.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only delete your own messages' });
        }

        await Message.findByIdAndDelete(messageId);
        res.json({ message: 'Message deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

