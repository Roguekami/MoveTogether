import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User as UserIcon, MessageCircle, Trash2 } from 'lucide-react';
import API from '../api';
import './Messages.css';

export default function Messages() {
    const { recipientId } = useParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    // Conversations list state
    const [conversations, setConversations] = useState([]);
    const [loadingConvos, setLoadingConvos] = useState(true);

    // Chat state
    const [messages, setMessages] = useState([]);
    const [recipient, setRecipient] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loadingChat, setLoadingChat] = useState(false);
    const [sending, setSending] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user')) || {};

    // Load conversations list
    useEffect(() => {
        if (!recipientId) {
            fetchConversations();
        }
    }, [recipientId]);

    // Load chat when recipientId changes
    useEffect(() => {
        if (recipientId) {
            fetchMessages();
            // Poll for new messages every 5 seconds
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [recipientId]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        setLoadingConvos(true);
        try {
            const res = await API.get('/messages/conversations');
            setConversations(res.data.conversations);
        } catch (err) {
            console.error('Failed to load conversations', err);
        } finally {
            setLoadingConvos(false);
        }
    };

    const fetchMessages = async () => {
        setLoadingChat(true);
        try {
            const res = await API.get(`/messages/${recipientId}`);
            setMessages(res.data.messages);
            setRecipient(res.data.recipient);
        } catch (err) {
            console.error('Failed to load messages', err);
        } finally {
            setLoadingChat(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const res = await API.post(`/messages/${recipientId}`, { 
                recipientId,
                text: newMessage 
            });
            setMessages(prev => [...prev, res.data.message]);
            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message', err);
        } finally {
            setSending(false);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('Delete this message?')) return;
        try {
            await API.delete(`/messages/message/${messageId}`);
            setMessages(prev => prev.filter(m => m._id !== messageId));
        } catch (err) {
            console.error('Failed to delete message', err);
        }
    };

    // If we have a recipientId, show the chat view
    if (recipientId) {
        return (
            <div className="messages-wrapper">
                <div className="chat-container">
                    {/* Chat Header */}
                    <div className="chat-header card-shadow">
                        <button className="back-btn" onClick={() => navigate('/messages')}>
                            <ArrowLeft size={20} />
                        </button>
                        <div className="chat-header-info">
                            <div className="chat-avatar">
                                <UserIcon size={18} />
                            </div>
                            <h3>{recipient?.name || 'Loading...'}</h3>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="messages-area">
                        {loadingChat && messages.length === 0 ? (
                            <div className="loading-state">Loading messages...</div>
                        ) : messages.length === 0 ? (
                            <div className="empty-chat">
                                <MessageCircle size={48} className="empty-icon" />
                                <p>No messages yet. Say hello!</p>
                            </div>
                        ) : (
                            messages.map(msg => {
                            const isSent = msg.sender._id === currentUser.id;
                            return (
                                <div 
                                    key={msg._id} 
                                    className={`message-bubble ${isSent ? 'sent' : 'received'}`}
                                    style={{ position: 'relative' }}
                                >
                                    <p>{msg.text}</p>
                                    <span className="message-time">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isSent && (
                                        <button
                                            onClick={() => handleDeleteMessage(msg._id)}
                                            title="Delete message"
                                            style={{
                                                position: 'absolute', top: '6px', right: '6px',
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: 'rgba(255,255,255,0.6)', padding: '2px',
                                                display: 'flex', alignItems: 'center', opacity: 0,
                                                transition: 'opacity 0.2s'
                                            }}
                                            className="msg-delete-btn"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            );
                        })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <form className="message-input-bar" onSubmit={handleSend}>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="message-input"
                        />
                        <button type="submit" className="send-btn" disabled={sending || !newMessage.trim()}>
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Otherwise show the conversations list
    return (
        <div className="messages-wrapper">
            <div className="conversations-container">
                <header className="messages-header">
                    <h1>Messages</h1>
                    <p>Stay connected with your travel companions.</p>
                </header>

                {loadingConvos ? (
                    <div className="loading-state">Loading MoveTogether...</div>
                ) : conversations.length === 0 ? (
                    <div className="empty-state card-shadow">
                        <MessageCircle size={48} className="empty-icon" />
                        <h3>No conversations yet</h3>
                        <p>Join a trip and start chatting with fellow travelers!</p>
                    </div>
                ) : (
                    <div className="conversations-list">
                        {conversations.map(convo => (
                            <div 
                                key={convo.conversationId} 
                                className="conversation-item card-shadow"
                                onClick={() => navigate(`/messages/${convo.otherUser._id}`)}
                            >
                                <div className="convo-avatar">
                                    <UserIcon size={20} />
                                </div>
                                <div className="convo-info">
                                    <div className="convo-top-row">
                                        <h4>{convo.otherUser.name}</h4>
                                        <span className="convo-time">
                                            {new Date(convo.lastMessageAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="convo-preview">{convo.lastMessage}</p>
                                </div>
                                {convo.unreadCount > 0 && (
                                    <div className="unread-badge">{convo.unreadCount}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
