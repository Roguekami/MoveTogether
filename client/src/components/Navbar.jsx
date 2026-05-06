import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MapPin, Menu, X, Home, Search, PlusCircle, MessageCircle, User as UserIcon } from 'lucide-react';
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

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const closeMenu = () => setIsMobileMenuOpen(false);

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
                                <link.icon size={18} />
                                <span>{link.name}</span>
                            </NavLink>
                        ))}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="mobile-menu-btn" onClick={toggleMenu}>
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
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
                            <link.icon size={24} />
                            <span>{link.name}</span>
                        </NavLink>
                    ))}
                </div>
            </div>
        </>
    );
}
