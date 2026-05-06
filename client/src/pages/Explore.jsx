import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Map, List, Car, Bus, Train, Plane, Footprints, Bike, SlidersHorizontal } from 'lucide-react';
import API from '../api';
import './Explore.css';

export default function Explore() {
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTransport, setSelectedTransport] = useState('All');
    const [showMap, setShowMap] = useState(false);

    const getImageUrl = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000';
        return url.startsWith('/uploads') ? `http://localhost:5000${url}` : url;
    };

    const transportIcons = {
        All: <List size={16} />,
        Car: <Car size={16} />,
        Bus: <Bus size={16} />,
        Train: <Train size={16} />,
        Flight: <Plane size={16} />,
        Walk: <Footprints size={16} />,
        Bike: <Bike size={16} />
    };

    useEffect(() => {
        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchTrips();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedTransport]);

    const fetchTrips = async () => {
        setLoading(true);
        try {
            const res = await API.get('/trips', {
                params: {
                    search: searchQuery,
                    transportType: selectedTransport
                }
            });
            setTrips(res.data.trips);
        } catch (err) {
            console.error("Failed to fetch explore trips", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="explore-wrapper">
            <header className="explore-header">
                <h1>Discover Trips</h1>
                <p>Find the perfect journey for your next adventure.</p>
                
                <div className="search-bar card-shadow">
                    <Search size={20} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search by destination, origin, or title..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <button className="filter-btn" title="More Filters">
                        <SlidersHorizontal size={20} />
                    </button>
                </div>

                <div className="filters-container">
                    {Object.keys(transportIcons).map(type => (
                        <button 
                            key={type}
                            className={`filter-chip ${selectedTransport === type ? 'active' : ''}`}
                            onClick={() => setSelectedTransport(type)}
                        >
                            {transportIcons[type]}
                            <span>{type}</span>
                        </button>
                    ))}
                </div>

                <div className="view-toggle">
                    <button 
                        className={`toggle-btn ${!showMap ? 'active' : ''}`}
                        onClick={() => setShowMap(false)}
                    >
                        <List size={18} /> List View
                    </button>
                    <button 
                        className={`toggle-btn ${showMap ? 'active' : ''}`}
                        onClick={() => setShowMap(true)}
                    >
                        <Map size={18} /> Map View
                    </button>
                </div>
            </header>

            <main className="explore-main">
                {loading ? (
                    <div className="loading-state">Searching...</div>
                ) : showMap ? (
                    <div className="map-placeholder card-shadow">
                        <div className="map-overlay">
                            <Map size={48} className="map-icon-large" />
                            <h3>Live Maps Coming Soon</h3>
                            <p>Interactive routing requires a Google Maps API key integration.</p>
                            <button className="btn-primary" onClick={() => setShowMap(false)}>
                                Return to List View
                            </button>
                        </div>
                    </div>
                ) : trips.length > 0 ? (
                    <div className="explore-grid">
                        {trips.map(trip => (
                            <div key={trip._id} className="nearby-card card-shadow group" onClick={() => navigate(`/trip/${trip._id}`)}>
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
                                    <div className="nearby-footer">
                                        <span className="footer-date">{new Date(trip.departureDate).toLocaleDateString()}</span>
                                        <div className="footer-transport">
                                            {transportIcons[trip.transportType] || <Car size={14}/>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state card-shadow">
                        <p>No trips found matching your criteria. Try adjusting your filters!</p>
                    </div>
                )}
            </main>
        </div>
    );
}
