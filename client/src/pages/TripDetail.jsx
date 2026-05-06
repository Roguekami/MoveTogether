import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Navigation, Calendar, Users, Wallet, User as UserIcon, Trash2, MessageCircle, X, Check, Edit3, Flag } from 'lucide-react';
import API from '../api';
import './TripDetail.css';

export default function TripDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Parse current user from local storage
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};

    const getImageUrl = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000';
        return url.startsWith('/uploads') ? `http://localhost:5000${url}` : url;
    };

    useEffect(() => {
        fetchTrip();
    }, [id]);

    const fetchTrip = async () => {
        try {
            const res = await API.get(`/trips/${id}`);
            setTrip(res.data.trip);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load trip');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        setActionLoading(true);
        setError('');
        try {
            const res = await API.post(`/trips/${id}/join`);
            setTrip(res.data.trip);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to join trip');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeave = async () => {
        setActionLoading(true);
        setError('');
        try {
            const res = await API.post(`/trips/${id}/leave`);
            setTrip(res.data.trip);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to leave trip');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this trip?")) return;
        
        setActionLoading(true);
        setError('');
        try {
            await API.delete(`/trips/${id}`);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete trip');
            setActionLoading(false);
        }
    };

    const handleAcceptRequest = async (userId) => {
        setActionLoading(true);
        try {
            const res = await API.post(`/trips/${id}/accept/${userId}`);
            setTrip(res.data.trip);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to accept request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectRequest = async (userId) => {
        setActionLoading(true);
        try {
            const res = await API.post(`/trips/${id}/reject/${userId}`);
            setTrip(res.data.trip);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveTraveler = async (userId) => {
        if (!window.confirm("Remove this traveler from the trip?")) return;
        setActionLoading(true);
        try {
            const res = await API.post(`/trips/${id}/remove/${userId}`);
            setTrip(res.data.trip);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove traveler');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to change the trip status to ${newStatus.toUpperCase()}?`)) return;
        setActionLoading(true);
        setError('');
        try {
            const res = await API.patch(`/trips/${id}/status`, { status: newStatus });
            setTrip(res.data.trip);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="loading-screen">Loading Trip Details...</div>;
    if (!trip) return <div className="error-screen">Trip not found.</div>;

    const isCreator = trip.creator._id === currentUser.id;
    const isJoined = trip.travelers.some(t => t._id === currentUser.id);
    const isPending = trip.pendingRequests?.some(t => t._id === currentUser.id);
    const isFull = trip.status === 'full';
    const isTerminal = trip.status === 'completed' || trip.status === 'cancelled';
    const isAlmostFull = (trip.travelers.length / trip.maxTravelers) >= 0.8;
    
    // Cost calculations
    const estimatedFullCost = trip.totalCost / trip.maxTravelers;

    return (
        <div className="trip-detail-wrapper">
            <header className="detail-header">
                <button className="back-btn-glass" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
            </header>

            <div className="hero-image-container">
                <img src={getImageUrl(trip.imageUrl)} alt={trip.title} className="hero-image" />
                <div className="hero-overlay"></div>
            </div>

            <main className="detail-main">
                <div className="detail-card card-shadow">
                    <div className="trip-header-info">
                        <div className="tags-row">
                            <span className={`tag ${isTerminal ? 'cancelled-tag' : 'active-tag'}`}>{trip.status}</span>
                            <span className="tag light-tag">{trip.category}</span>
                            <span className="tag light-tag">{trip.transportType}</span>
                            {trip.status === 'active' && isAlmostFull && (
                                <span className="tag warning-tag">⚠️ Almost Full! ({trip.travelers.length}/{trip.maxTravelers})</span>
                            )}
                            {trip.status === 'full' && (
                                <span className="tag danger-tag">🚫 Full</span>
                            )}
                        </div>
                        <h1 className="trip-title-large">{trip.title}</h1>
                        <p className="route-text">
                            <MapPin size={16}/> {trip.origin} <span className="arrow">→</span> <Navigation size={16}/> {trip.destination}
                        </p>
                        <p className="route-text" style={{marginTop: '4px', fontSize: '14px'}}>
                            <Flag size={14}/> Meet at: <strong>{trip.meeting_point}</strong>
                        </p>
                        <p className="date-text">
                            <Calendar size={16}/> {new Date(trip.departureDate).toLocaleString()}
                        </p>
                    </div>

                    <div className="divider"></div>

                    <div className="meta-grid">
                        <div className="meta-box">
                            <div className="meta-icon"><Users size={20}/></div>
                            <div className="meta-text">
                                <span className="meta-label">Travelers</span>
                                <span className="meta-value">{trip.travelers.length} / {trip.maxTravelers}</span>
                            </div>
                        </div>
                        <div className="meta-box" style={{flex: 2}}>
                            <div className="meta-icon"><Wallet size={20}/></div>
                            <div className="meta-text" style={{width: '100%'}}>
                                <span className="meta-label">Cost Breakdown</span>
                                <div className="cost-breakdown" style={{marginTop: '4px'}}>
                                    <p className="current-cost" style={{margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)'}}>
                                        ₦{trip.currentCostPerPerson.toLocaleString()} <span style={{fontSize: '0.9rem', fontWeight: 'normal'}}>per person</span>
                                        <span className="travelers" style={{display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal', marginTop: '2px'}}>
                                            ({trip.travelers.length} joined)
                                        </span>
                                    </p>
                                    {trip.travelers.length < trip.maxTravelers && (
                                        <p className="estimated-full" style={{margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', padding: '6px', backgroundColor: 'var(--bg-main)', borderRadius: '6px', border: '1px dashed var(--border-color)'}}>
                                            ₦{estimatedFullCost.toLocaleString()} per person when full
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <div className="creator-section">
                        <h3>Organized by</h3>
                        <div className="creator-card">
                            <div className="creator-avatar">
                                <UserIcon size={24} />
                            </div>
                            <div className="creator-info">
                                <h4>{trip.creator.name}</h4>
                                {trip.creator.bio && <p>{trip.creator.bio}</p>}
                            </div>
                            {!isCreator && (
                                <button className="message-creator-btn" onClick={() => navigate(`/messages/${trip.creator._id}`)}>
                                    <MessageCircle size={18} />
                                    Message
                                </button>
                            )}
                        </div>
                    </div>

                    {isCreator && trip.pendingRequests?.length > 0 && (
                        <div className="requests-section">
                            <h3>Pending Requests ({trip.pendingRequests.length})</h3>
                            <div className="requests-list">
                                {trip.pendingRequests.map(req => (
                                    <div key={req._id} className="request-item card-shadow">
                                        <div className="request-info">
                                            <div className="traveler-avatar-small"><UserIcon size={16}/></div>
                                            <span>{req.name}</span>
                                        </div>
                                        <div className="request-actions">
                                            <button className="action-btn accept" onClick={() => handleAcceptRequest(req._id)} disabled={actionLoading}>
                                                <Check size={16} />
                                            </button>
                                            <button className="action-btn reject" onClick={() => handleRejectRequest(req._id)} disabled={actionLoading}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="travelers-section">
                        <h3>Travelers ({trip.travelers.length})</h3>
                        <div className="travelers-list">
                            {trip.travelers.map(t => (
                                <div key={t._id} className="traveler-item">
                                    <div className="traveler-avatar-small"><UserIcon size={16}/></div>
                                    <span>{t.name}</span>
                                    {isCreator && t._id !== currentUser.id && (
                                        <button className="remove-traveler-btn" onClick={() => handleRemoveTraveler(t._id)} disabled={actionLoading}>
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && <p className="error-text mt-4">{error}</p>}

                    <div className="action-section">
                        {isCreator ? (
                            <div className="creator-actions">
                                {!isTerminal && trip.status !== 'confirmed' && (
                                    <button className="btn-secondary" onClick={() => navigate(`/edit-trip/${trip._id}`)} disabled={actionLoading}>
                                        <Edit3 size={18} /> Edit Trip
                                    </button>
                                )}
                                
                                {['active', 'full'].includes(trip.status) && (
                                    <button className="btn-primary" onClick={() => handleUpdateStatus('confirmed')} disabled={actionLoading}>
                                        <Check size={18} /> Confirm Trip
                                    </button>
                                )}
                                
                                {trip.status === 'confirmed' && (
                                    <button className="btn-primary" onClick={() => handleUpdateStatus('completed')} disabled={actionLoading}>
                                        <Flag size={18} /> Mark Completed
                                    </button>
                                )}
                                
                                {!isTerminal && (
                                    <button className="btn-danger" onClick={() => handleUpdateStatus('cancelled')} disabled={actionLoading}>
                                        <X size={18} /> Cancel Trip
                                    </button>
                                )}

                                <button className="btn-danger" onClick={handleDelete} disabled={actionLoading}>
                                    <Trash2 size={18} /> Delete Trip
                                </button>
                            </div>
                        ) : isTerminal ? (
                            <button className="btn-secondary" disabled={true}>
                                Trip is {trip.status}
                            </button>
                        ) : trip.status === 'confirmed' && !isJoined ? (
                            <button className="btn-secondary" disabled={true}>
                                Trip already confirmed
                            </button>
                        ) : isJoined ? (
                            <button className="btn-secondary" onClick={handleLeave} disabled={actionLoading}>
                                {actionLoading ? 'Processing...' : 'Leave Trip'}
                            </button>
                        ) : isPending ? (
                            <button className="btn-secondary" onClick={handleJoin} disabled={actionLoading}>
                                {actionLoading ? 'Processing...' : 'Cancel Request'}
                            </button>
                        ) : isFull ? (
                            <button className="btn-primary" disabled={true}>
                                Trip is Full
                            </button>
                        ) : (
                            <button className="btn-primary" onClick={handleJoin} disabled={actionLoading}>
                                {actionLoading ? 'Processing...' : 'Request to Join'}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
