import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Map, List, Car, Bus, Train, Plane, Footprints, Bike, SlidersHorizontal, Calendar, Filter, ArrowUpDown } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API from '../api';
import './Explore.css';

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function Explore() {
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTransport, setSelectedTransport] = useState('All');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('active');
    const [selectedSort, setSelectedSort] = useState('newest');
    
    const [showMap, setShowMap] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const getImageUrl = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000';
        const backendUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
        return url.startsWith('/uploads') ? `${backendUrl}${url}` : url;
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

    const categories = ['All', 'Transport', 'Fitness', 'Adventure', 'Events', 'Social', 'Other'];
    const statuses = ['All', 'active', 'full', 'confirmed'];
    const sortOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'soonest', label: 'Soonest First' },
        { value: 'almost-full', label: 'Almost Full' }
    ];

    useEffect(() => {
        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchTrips();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedTransport, selectedCategory, selectedDate, selectedStatus, selectedSort]);

    const fetchTrips = async () => {
        setLoading(true);
        try {
            const res = await API.get('/trips', {
                params: {
                    q: searchQuery,
                    transportType: selectedTransport,
                    category: selectedCategory,
                    date: selectedDate,
                    status: selectedStatus,
                    sort: selectedSort
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
                        placeholder="Search by destination, origin, title, or description..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <button className={`filter-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)} title="More Filters">
                        <SlidersHorizontal size={20} />
                    </button>
                </div>

                {showFilters && (
                    <div className="extended-filters card-shadow">
                        <div className="filter-group">
                            <label><Filter size={16}/> Category</label>
                            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label><Calendar size={16}/> Date</label>
                            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                        </div>
                        <div className="filter-group">
                            <label><Filter size={16}/> Status</label>
                            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                                {statuses.map(stat => <option key={stat} value={stat}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label><ArrowUpDown size={16}/> Sort By</label>
                            <select value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)}>
                                {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    </div>
                )}

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
                    <div className="explore-grid">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                            <div key={n} className="nearby-card skeleton card-shadow">
                                <div className="skeleton-img"></div>
                                <div className="nearby-info">
                                    <div className="skeleton-text title"></div>
                                    <div className="skeleton-text meta"></div>
                                    <div className="skeleton-text meta short"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : showMap ? (
                    <div className="explore-map-container card-shadow">
                        <MapContainer
                            center={[9.06, 7.49]}
                            zoom={6}
                            style={{ height: '100%', width: '100%', borderRadius: '24px' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {trips.filter(t => t.originCoords?.lat).map(trip => (
                                <Marker key={trip._id} position={[trip.originCoords.lat, trip.originCoords.lng]}>
                                    <Popup>
                                        <div className="map-popup">
                                            <strong>{trip.title}</strong>
                                            <p>{trip.origin} → {trip.destination}</p>
                                            <p>₦{trip.currentCostPerPerson?.toLocaleString()}/person</p>
                                            <button onClick={() => navigate(`/trip/${trip._id}`)}>View Trip</button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                        {trips.filter(t => !t.originCoords?.lat).length > 0 && (
                            <p className="map-note">Some trips are not shown on the map because they don't have pinned locations.</p>
                        )}
                    </div>
                ) : trips.length > 0 ? (
                    <div className="explore-grid">
                        {trips.map(trip => (
                            <div key={trip._id} className="nearby-card card-shadow group" onClick={() => navigate(`/trip/${trip._id}`)}>
                                <div className="nearby-image-container">
                                    <img src={getImageUrl(trip.imageUrl)} alt={trip.title} />
                                    <div className={`status-badge ${trip.status === 'active' ? 'active-badge' : trip.status === 'full' ? 'full-badge' : 'confirmed-badge'}`}>
                                        {trip.status}
                                    </div>
                                    {trip.fillRatio >= 0.8 && trip.fillRatio < 1 && (
                                        <div className="almost-full-badge">Almost Full</div>
                                    )}
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
                        <Search size={48} className="empty-icon" />
                        <h3>No Trips Found</h3>
                        <p>We couldn't find any trips matching your criteria. Try adjusting your filters or search terms.</p>
                        <button className="btn-secondary" onClick={() => {
                            setSearchQuery('');
                            setSelectedTransport('All');
                            setSelectedCategory('All');
                            setSelectedDate('');
                            setSelectedStatus('active');
                            setSelectedSort('newest');
                        }}>
                            Clear All Filters
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
