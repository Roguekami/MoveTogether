import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, PlusCircle, Users, Wallet, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';
import API from '../api';
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [myTrips, setMyTrips] = useState([]);
    const [nearbyTrips, setNearbyTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    const getImageUrl = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000';
        const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
        return url.startsWith('/uploads') ? `${backendUrl}${url}` : url;
    };

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        try {
            const [mineRes, allRes] = await Promise.all([
                API.get('/trips/mine'),
                API.get('/trips')
            ]);
            setMyTrips(mineRes.data.trips);
            setNearbyTrips(allRes.data.trips);
        } catch (err) {
            console.error("Failed to fetch trips", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-screen">Loading MoveTogether...</div>;
    }

    return (
        <div className="dashboard-wrapper">
            <main className="dashboard-main">
                {/* Welcome Section */}
                <section className="welcome-section">
                    <div>
                        <h2 className="welcome-text">Hello, {user.name?.split(' ')[0] || 'Traveler'}</h2>
                        <p className="welcome-subtext"></p>
                    </div>
                    <button className="btn-primary flex-center gap-sm btn-create" onClick={() => navigate('/create')}>
                        <PlusCircle size={20} />
                        Create a Trip
                    </button>
                </section>

                {/* Upcoming Trips - Created */}
                <section className="section-container">
                    <div className="section-header">
                        <h3>Trips You're Organizing</h3>
                    </div>
                    
                    <div className="upcoming-scroll-container">
                        {myTrips.filter(t => t.creator._id === user.id).length > 0 ? (
                            myTrips.filter(t => t.creator._id === user.id).map(trip => (
                                <div key={trip._id} className="bento-large card-shadow group" onClick={() => navigate(`/trip/${trip._id}`)}>
                                    <div className="bento-bg">
                                        <img src={getImageUrl(trip.imageUrl)} alt={trip.title} />
                                        <div className="bento-overlay"></div>
                                    </div>
                                    <div className="bento-content">
                                        <div className="tags-row">
                                            <span className="tag glass-tag">{trip.destination}</span>
                                            <span className="tag glass-tag-light">
                                                {new Date(trip.departureDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="trip-title">{trip.title}</h4>
                                        <div className="trip-meta-row">
                                            <span className="meta-item"><Users size={16}/> {trip.travelers.length}/{trip.maxTravelers}</span>
                                            <span className="meta-item"><Wallet size={16}/> ₦{trip.currentCostPerPerson?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state card-shadow">
                                <p>You aren't organizing any trips yet.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Upcoming Trips - Joined */}
                <section className="section-container">
                    <div className="section-header">
                        <h3>Trips You've Joined</h3>
                    </div>
                    
                    <div className="upcoming-scroll-container">
                        {myTrips.filter(t => t.creator._id !== user.id).length > 0 ? (
                            myTrips.filter(t => t.creator._id !== user.id).map(trip => (
                                <div key={trip._id} className="bento-large card-shadow group" onClick={() => navigate(`/trip/${trip._id}`)}>
                                    <div className="bento-bg">
                                        <img src={getImageUrl(trip.imageUrl)} alt={trip.title} />
                                        <div className="bento-overlay"></div>
                                    </div>
                                    <div className="bento-content">
                                        <div className="tags-row">
                                            <span className="tag glass-tag">{trip.destination}</span>
                                            <span className="tag glass-tag-light">
                                                {new Date(trip.departureDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="trip-title">{trip.title}</h4>
                                        <div className="trip-meta-row">
                                            <span className="meta-item"><Users size={16}/> {trip.travelers.length}/{trip.maxTravelers}</span>
                                            <span className="meta-item"><Wallet size={16}/> ₦{trip.currentCostPerPerson?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state card-shadow">
                                <p>You haven't joined any trips yet. Explore some nearby!</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Nearby Trips */}
                <section className="section-container">
                    <div className="section-header">
                        <h3>Nearby Trips</h3>
                    </div>

                    <div className="nearby-grid">
                        {nearbyTrips.map(trip => (
                            <div key={trip._id} className="nearby-card group" onClick={() => navigate(`/trip/${trip._id}`)}>
                                <div className="nearby-image-container">
                                    <img src={getImageUrl(trip.imageUrl)} alt={trip.title} />
                                    <div className="status-badge active-badge">{trip.status}</div>
                                </div>
                                <div className="nearby-info">
                                    <h5 className="nearby-title">{trip.title}</h5>
                                    <div className="nearby-meta">
                                        <span className="meta-sub">{trip.origin} → {trip.destination}</span>
                                        <span className="meta-price">₦{trip.currentCostPerPerson?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
