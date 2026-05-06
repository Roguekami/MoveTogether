import React, { useState, useEffect, useRef } from 'react';
import { Send, MapPin, Loader } from 'lucide-react';
import API from '../api';
import './TripChat.css';

export default function TripChat({ tripId, currentUser, isTerminal }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState('');
    
    const messagesEndRef = useRef(null);

    const fetchMessages = async () => {
        try {
            const res = await API.get(`/trips/${tripId}/messages`);
            // Only update if lengths differ or last message differs to avoid unnecessary re-renders
            setMessages(prev => {
                const newMsgs = res.data.messages;
                if (prev.length !== newMsgs.length || 
                   (prev.length > 0 && prev[prev.length-1]._id !== newMsgs[newMsgs.length-1]._id)) {
                    return newMsgs;
                }
                return prev;
            });
        } catch (err) {
            console.error("Failed to fetch messages:", err);
        } finally {
            setLoading(false);
        }
    };

    // Polling setup
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(() => {
            fetchMessages();
        }, 5000);
        return () => clearInterval(interval);
    }, [tripId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        setSending(true);
        setError('');
        try {
            await API.post(`/trips/${tripId}/messages`, { text: newMessage });
            setNewMessage('');
            fetchMessages(); // Instantly fetch to update UI
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send message');
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
                        text: "Shared a location",
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                    fetchMessages();
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

    if (loading) return <div className="chat-loading">Loading chat...</div>;

    return (
        <div className="trip-chat-container card-shadow">
            <div className="chat-header">
                <h3>Trip Group Chat</h3>
                {isTerminal && <span className="read-only-badge">Read Only</span>}
            </div>
            
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="empty-chat">
                        <p>No messages yet. Be the first to say hi!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender._id === currentUser.id;
                        const showName = !isMe && (index === 0 || messages[index - 1].sender._id !== msg.sender._id);

                        return (
                            <div key={msg._id} className={`message-wrapper ${isMe ? 'message-mine' : 'message-theirs'}`}>
                                {showName && <span className="sender-name">{msg.sender.name}</span>}
                                <div className="message-bubble">
                                    {msg.text && <p className="message-text">{msg.text}</p>}
                                    {msg.latitude && msg.longitude && (
                                        <div className="location-attachment">
                                            <MapPin size={16} />
                                            <span>{msg.latitude.toFixed(4)}, {msg.longitude.toFixed(4)}</span>
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
