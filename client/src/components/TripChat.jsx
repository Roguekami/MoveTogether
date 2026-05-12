import React, { useState, useEffect, useRef } from 'react';
import { Send, MapPin, Loader, Wifi, WifiOff, Trash2 } from 'lucide-react';
import { io } from 'socket.io-client';
import API from '../api';
import './TripChat.css';

export default function TripChat({ tripId, currentUser, isTerminal }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState('');
    const [connected, setConnected] = useState(false);
    
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    // Initial message fetch
    const fetchMessages = async () => {
        try {
            const res = await API.get(`/trips/${tripId}/messages`);
            setMessages(res.data.messages);
        } catch (err) {
            console.error("Failed to fetch messages:", err);
        } finally {
            setLoading(false);
        }
    };

    // Socket.io setup
    useEffect(() => {
        // Fetch initial messages
        fetchMessages();

        // Connect to Socket.io
        // Use the backend URL from environment variables, or fallback to localhost
        const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
        const socket = io(backendUrl);
        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join-trip', tripId);
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        // Listen for real-time messages
        socket.on('receive-message', (msg) => {
            setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        });

        // Listen for deleted messages
        socket.on('message-deleted', (msgId) => {
            setMessages(prev => prev.filter(m => m._id !== msgId));
        });

        // Cleanup on unmount
        return () => {
            socket.emit('leave-trip', tripId);
            socket.disconnect();
        };
    }, [tripId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const messageText = newMessage.trim();
        if (!messageText) return;
        
        // Optimistic clear to avoid mobile keyboard ghosting
        setNewMessage('');

        setSending(true);
        setError('');
        try {
            await API.post(`/trips/${tripId}/messages`, { text: messageText });
            // Success: socket will handle adding the message
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send message');
            // Restore text on failure
            setNewMessage(messageText);
        } finally {
            setSending(false);
        }
    };

    const handleShareLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setLocating(true);
        setError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    await API.post(`/trips/${tripId}/messages`, {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                    // Socket will handle the update
                } catch (err) {
                    setError('Failed to share location');
                } finally {
                    setLocating(false);
                }
            },
            (err) => {
                setError('Could not get your location. Please check permissions.');
                setLocating(false);
            }
        );
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('Delete this message?')) return;
        try {
            await API.delete(`/trips/${tripId}/messages/${messageId}`);
            setMessages(prev => prev.filter(m => m._id !== messageId));
        } catch (err) {
            setError('Failed to delete message');
        }
    };

    if (loading) return <div className="chat-loading">Loading chat...</div>;

    return (
        <div className="trip-chat-container card-shadow">
            <div className="chat-header">
                <h3>Trip Group Chat</h3>
                <div className="chat-header-right">
                    {connected ? (
                        <span className="connection-badge live"><Wifi size={14} /> Live</span>
                    ) : (
                        <span className="connection-badge offline"><WifiOff size={14} /> Offline</span>
                    )}
                    {isTerminal && <span className="read-only-badge">Read Only</span>}
                </div>
            </div>
            
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="empty-chat">
                        <p>No messages yet. Be the first to say hi!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        if (msg.messageType === 'system') {
                            return (
                                <div key={msg._id} className="system-message">
                                    <i>ℹ️ {msg.text}</i>
                                </div>
                            );
                        }

                        const isMe = msg.sender && msg.sender._id === currentUser.id;
                        const showName = !isMe && msg.sender && (
                            index === 0 || 
                            !messages[index - 1].sender || 
                            messages[index - 1].sender._id !== msg.sender._id
                        );

                        return (
                            <div key={msg._id} className={`message-wrapper ${isMe ? 'message-mine' : 'message-theirs'}`}>
                                {showName && (
                                    <div className="sender-name-row" style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                                        <div 
                                            className="sender-avatar-tiny" 
                                            style={{ width: '18px', height: '18px', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            {msg.sender.profilePicture ? (
                                                <img 
                                                    src={msg.sender.profilePicture.startsWith('http') ? msg.sender.profilePicture : `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${msg.sender.profilePicture}`} 
                                                    alt="" 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                />
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                            )}
                                        </div>
                                        <span 
                                            className="sender-name hover-underline" 
                                            style={{ cursor: 'pointer', margin: 0 }}
                                            onClick={() => window.location.href = `/user/${msg.sender._id}`}
                                        >
                                            {msg.sender.name}
                                        </span>
                                        <button 
                                            className="btn-icon" 
                                            onClick={() => window.location.href = `/messages/${msg.sender._id}`}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '2px' }}
                                            title={`Message ${msg.sender.name}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                                        </button>
                                    </div>
                                )}
                                <div className="message-bubble" style={{ position: 'relative' }}>
                                    {(!msg.messageType || msg.messageType === 'text') && <p className="message-text">{msg.text}</p>}
                                    {msg.messageType === 'location' && (
                                        <div className="location-attachment">
                                            <MapPin size={16} />
                                            <span>{msg.latitude?.toFixed(4)}, {msg.longitude?.toFixed(4)}</span>
                                            <a 
                                                href={`https://www.google.com/maps/search/?api=1&query=${msg.latitude},${msg.longitude}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="map-link"
                                            >
                                                View Map
                                            </a>
                                        </div>
                                    )}
                                    <span className="message-time">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isMe && msg.messageType !== 'system' && (
                                        <button
                                            onClick={() => handleDeleteMessage(msg._id)}
                                            title="Delete message"
                                            style={{
                                                position: 'absolute', top: '4px', right: '4px',
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: 'rgba(255,255,255,0.5)', padding: '2px',
                                                display: 'flex', alignItems: 'center', opacity: 0,
                                                transition: 'opacity 0.2s'
                                            }}
                                            className="msg-delete-btn"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {error && <div className="chat-error">{error}</div>}

            <form className="chat-input-area" onSubmit={handleSendMessage}>
                <button 
                    type="button" 
                    className="btn-icon location-btn" 
                    onClick={handleShareLocation}
                    disabled={isTerminal || locating || sending}
                    title="Share Location"
                >
                    {locating ? <Loader size={20} className="spinner" /> : <MapPin size={20} />}
                </button>
                
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isTerminal ? "Chat is closed" : "Type a message..."}
                    className="chat-input"
                    disabled={isTerminal || sending || locating}
                    maxLength={1000}
                />
                
                <button 
                    type="submit" 
                    className="btn-icon send-btn" 
                    disabled={!newMessage.trim() || isTerminal || sending || locating}
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
}
