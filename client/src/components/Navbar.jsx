import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MapPin, Menu, X, Home, Search, PlusCircle, MessageCircle, User as UserIcon, Shield, Moon, Sun, Bell, LogOut } from 'lucide-react';
import { io } from 'socket.io-client';
import API from '../api';
import './Navbar.css';

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const navLinks = [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Explore', path: '/explore', icon: Search },
        { name: 'Create', path: '/create', icon: PlusCircle },
        { name: 'Messages', path: '/messages', icon: MessageCircle },
        { name: 'Profile', path: '/profile', icon: UserIcon },
    ];

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const closeMenu = () => setIsMobileMenuOpen(false);

    // Read user from localStorage to check role
    const userString = localStorage.getItem('user');
    let isAdmin = false;
    let userId = null;
    let user = null;
    if (userString) {
        try {
            user = JSON.parse(userString);
            isAdmin = user.role === 'admin';
            userId = user.id;
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
        }
    }

    const [notifications, setNotifications] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const notifRef = useRef(null);

    const fetchNotifications = async () => {
        if (!userId) return;
        try {
            const res = await API.get('/notifications');
            setNotifications(res.data.notifications);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        if (!userId) return;
        
        fetchNotifications();

        const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
        const socket = io(backendUrl);
        socket.on('connect', () => {
            socket.emit('join-user', userId);
        });

        socket.on('new-notification', () => {
            fetchNotifications();
        });

        return () => socket.disconnect();
    }, [userId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotifClick = async () => {
        setShowNotifs(!showNotifs);
        if (!showNotifs && unreadCount > 0) {
            try {
                await API.put('/notifications/read');
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            } catch (err) {
                console.error("Failed to mark as read", err);
            }
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (isAdmin) {
        navLinks.push({ name: 'Admin', path: '/admin', icon: Shield });
    }

    return (
        <>
            <nav className="top-navbar glass-nav">
                <div className="navbar-container">
                    {/* Logo Area */}
                    <div className="navbar-logo" onClick={() => navigate('/')}>
                        <div className="logo-icon-small">
                            <MapPin size={18} />
                        </div>
                        <span className="logo-text">MoveTogether</span>
                    </div>

                    {/* Desktop Links */}
                    <div className="navbar-desktop-links">
                        {navLinks.map((link) => (
                            <NavLink 
                                key={link.name} 
                                to={link.path} 
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            >
                                {link.name === 'Profile' && user?.profilePicture ? (
                                    <div className="nav-profile-avatar" style={{ width: '20px', height: '20px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--primary)' }}>
                                        <img 
                                            src={user.profilePicture.startsWith('http') ? user.profilePicture : `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${user.profilePicture}`} 
                                            alt="Profile" 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                    </div>
                                ) : (
                                    <link.icon size={18} />
                                )}
                                <span>{link.name}</span>
                            </NavLink>
                        ))}
                    </div>

                    {/* Right Side Icons */}
                    <div className="navbar-right-actions">
                        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Dark Mode">
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {userId && (
                            <div className="notif-container" ref={notifRef}>
                                <button className="theme-toggle-btn" onClick={handleNotifClick} aria-label="Notifications">
                                    <Bell size={20} />
                                    {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                                </button>
                                
                                {showNotifs && (
                                    <div className="notif-dropdown card-shadow">
                                        <h4>Notifications</h4>
                                        <div className="notif-list">
                                            {notifications.length === 0 ? (
                                                <p className="no-notifs">No notifications yet.</p>
                                            ) : (
                                                notifications.map(n => (
                                                    <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`} onClick={() => {
                                                        setShowNotifs(false);
                                                        if (n.relatedTrip) navigate(`/trip/${n.relatedTrip._id}`);
                                                    }}>
                                                        <p>{n.message}</p>
                                                        <small>{new Date(n.createdAt).toLocaleDateString()}</small>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button className="mobile-menu-btn" onClick={toggleMenu}>
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Full Screen Menu */}
            <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-content">
                    {navLinks.map((link) => (
                        <NavLink 
                            key={link.name} 
                            to={link.path} 
                            className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                            onClick={closeMenu}
                        >
                            {link.name === 'Profile' && user?.profilePicture ? (
                                <div className="nav-profile-avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--primary)' }}>
                                    <img 
                                        src={user.profilePicture.startsWith('http') ? user.profilePicture : `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${user.profilePicture}`} 
                                        alt="Profile" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                </div>
                            ) : (
                                <link.icon size={24} />
                            )}
                            <span>{link.name}</span>
                        </NavLink>
                    ))}
                    {userId && (
                        <button 
                            className="mobile-nav-link mobile-logout-btn"
                            onClick={() => {
                                closeMenu();
                                localStorage.clear();
                                window.location.reload();
                            }}
                        >
                            <LogOut size={24} />
                            <span>Log Out</span>
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
