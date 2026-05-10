import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Navigation, Calendar, Users, Wallet, Image as ImageIcon, ChevronLeft } from 'lucide-react';
import API from '../api';
import LocationPicker from '../components/LocationPicker';
import './CreateTrip.css';

export default function EditTrip() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form, setForm] = useState({
        title: '',
        origin: '',
        destination: '',
        meeting_point: '',
        departureDate: '',
        transportType: 'Car',
        category: 'Transport',
        maxTravelers: 4,
        totalCost: 0,
        imageUrl: '',
        image: null
    });

    const [coords, setCoords] = useState({
        originCoords: null,
        destinationCoords: null,
        meetingPointCoords: null
    });

    // Get current datetime string for min attribute
    const now = new Date();
    const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,16);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');

    // Location picker state
    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeField, setActiveField] = useState('origin');

    useEffect(() => {
        const fetchTrip = async () => {
            try {
                const res = await API.get(`/trips/${id}`);
                const trip = res.data.trip;
                
                // Format date for datetime-local input
                const formattedDate = new Date(trip.departureDate).toISOString().slice(0, 16);
                
                setForm({
                    title: trip.title,
                    origin: trip.origin,
                    destination: trip.destination,
                    meeting_point: trip.meeting_point,
                    departureDate: formattedDate,
                    transportType: trip.transportType,
                    category: trip.category || 'Transport',
                    maxTravelers: trip.maxTravelers,
                    totalCost: trip.totalCost,
                    imageUrl: trip.imageUrl
                });

                // Load existing coords if available
                setCoords({
                    originCoords: trip.originCoords?.lat ? trip.originCoords : null,
                    destinationCoords: trip.destinationCoords?.lat ? trip.destinationCoords : null,
                    meetingPointCoords: trip.meetingPointCoords?.lat ? trip.meetingPointCoords : null
                });
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load trip');
            } finally {
                setFetching(false);
            }
        };
        fetchTrip();
    }, [id]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleFileChange = (e) => {
        setForm({ ...form, image: e.target.files[0] });
        setError('');
    };

    const openPicker = (field) => {
        setActiveField(field);
        setPickerOpen(true);
    };

    const handleLocationSelect = ({ name, coords: selectedCoords }) => {
        const coordsKeyMap = {
            origin: 'originCoords',
            destination: 'destinationCoords',
            meeting_point: 'meetingPointCoords'
        };

        const shortName = name.split(',').slice(0, 2).join(',').trim();
        setForm(prev => ({ ...prev, [activeField]: shortName }));
        setCoords(prev => ({ ...prev, [coordsKeyMap[activeField]]: selectedCoords }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            Object.keys(form).forEach(key => {
                if (key === 'image' && form[key]) {
                    formData.append('image', form[key]);
                } else if (key !== 'image') {
                    formData.append(key, form[key]);
                }
            });

            // Append coords as JSON strings
            if (coords.originCoords) formData.append('originCoords', JSON.stringify(coords.originCoords));
            if (coords.destinationCoords) formData.append('destinationCoords', JSON.stringify(coords.destinationCoords));
            if (coords.meetingPointCoords) formData.append('meetingPointCoords', JSON.stringify(coords.meetingPointCoords));

            await API.put(`/trips/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            navigate(`/trip/${id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update trip');
            setLoading(false);
        }
    };

    const getCoordsForField = () => {
        const map = { origin: 'originCoords', destination: 'destinationCoords', meeting_point: 'meetingPointCoords' };
        const c = coords[map[activeField]];
        return c ? [c.lat, c.lng] : null;
    };

    if (fetching) return <div className="loading-screen">Loading Trip Details...</div>;

    return (
        <div className="create-trip-wrapper">
            <main className="create-main">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ChevronLeft size={24} />
                    </button>
                    <h1>Edit Journey</h1>
                    <div style={{width: 24}}></div>
                </div>

                <form className="create-form card-shadow" onSubmit={handleSubmit}>
                    
                    <div className="input-group">
                        <label className="input-label">TRIP TITLE</label>
                        <div className="input-wrapper">
                            <input
                                className="input-soft"
                                type="text"
                                name="title"
                                placeholder="e.g., Weekend getaway to the mountains"
                                value={form.title}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="route-container">
                        <div className="input-group flex-1">
                            <label className="input-label">FROM</label>
                            <div className="input-with-pin">
                                <div className="input-wrapper">
                                    <input
                                        className="input-soft"
                                        type="text"
                                        name="origin"
                                        placeholder="City or Campus"
                                        value={form.origin}
                                        onChange={handleChange}
                                        required
                                    />
                                    <MapPin size={16} className="input-icon" />
                                </div>
                                <button type="button" className={`pin-map-btn ${coords.originCoords ? 'has-pin' : ''}`} onClick={() => openPicker('origin')}>
                                    <MapPin size={14} />
                                    <span>{coords.originCoords ? '✓ Pinned' : 'Pin on Map'}</span>
                                </button>
                            </div>
                        </div>
                        <div className="input-group flex-1">
                            <label className="input-label">TO</label>
                            <div className="input-with-pin">
                                <div className="input-wrapper">
                                    <input
                                        className="input-soft"
                                        type="text"
                                        name="destination"
                                        placeholder="Destination"
                                        value={form.destination}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Navigation size={16} className="input-icon" />
                                </div>
                                <button type="button" className={`pin-map-btn ${coords.destinationCoords ? 'has-pin' : ''}`} onClick={() => openPicker('destination')}>
                                    <MapPin size={14} />
                                    <span>{coords.destinationCoords ? '✓ Pinned' : 'Pin on Map'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">MEETING POINT</label>
                        <div className="input-with-pin">
                            <div className="input-wrapper">
                                <input
                                    className="input-soft"
                                    type="text"
                                    name="meeting_point"
                                    placeholder="e.g., Campus Gate, Airport Terminal 1"
                                    value={form.meeting_point}
                                    onChange={handleChange}
                                    required
                                />
                                <MapPin size={16} className="input-icon" />
                            </div>
                            <button type="button" className={`pin-map-btn ${coords.meetingPointCoords ? 'has-pin' : ''}`} onClick={() => openPicker('meeting_point')}>
                                <MapPin size={14} />
                                <span>{coords.meetingPointCoords ? '✓ Pinned' : 'Pin on Map'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">DEPARTURE DATE & TIME</label>
                        <div className="input-wrapper">
                            <input
                                className="input-soft"
                                type="datetime-local"
                                name="departureDate"
                                value={form.departureDate}
                                onChange={handleChange}
                                min={minDateTime}
                                required
                            />
                            <Calendar size={16} className="input-icon" />
                        </div>
                    </div>

                    <div className="two-col-container" style={{display: 'flex', gap: '16px', marginBottom: '16px'}}>
                        <div className="input-group flex-1">
                            <label className="input-label">CATEGORY</label>
                            <select 
                                className="input-soft select-soft" 
                                name="category" 
                                value={form.category} 
                                onChange={handleChange}
                            >
                                <option value="Transport">Transport</option>
                                <option value="Fitness">Fitness</option>
                                <option value="Adventure">Adventure</option>
                                <option value="Events">Events</option>
                                <option value="Social">Social</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="input-group flex-1">
                            <label className="input-label">TRANSPORT</label>
                            <select 
                                className="input-soft select-soft" 
                                name="transportType" 
                                value={form.transportType} 
                                onChange={handleChange}
                            >
                                <option value="Car">Car</option>
                                <option value="Bus">Bus</option>
                                <option value="Train">Train</option>
                                <option value="Flight">Flight</option>
                                <option value="Walk">Walk</option>
                                <option value="Bike">Bike</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="two-col-container" style={{display: 'flex', gap: '16px', marginBottom: '16px'}}>
                        <div className="input-group flex-1">
                            <label className="input-label">MAX SEATS</label>
                            <div className="input-wrapper">
                                <input
                                    className="input-soft"
                                    type="number"
                                    name="maxTravelers"
                                    min="2"
                                    max="50"
                                    value={form.maxTravelers}
                                    onChange={handleChange}
                                    required
                                />
                                <Users size={16} className="input-icon" />
                            </div>
                        </div>

                        <div className="input-group flex-1">
                            <label className="input-label">TOTAL ESTIMATED COST (₦)</label>
                            <div className="input-wrapper">
                                <input
                                    className="input-soft"
                                    type="number"
                                    name="totalCost"
                                    min="0"
                                    step="0.01"
                                    value={form.totalCost}
                                    onChange={handleChange}
                                    required
                                />
                                <Wallet size={16} className="input-icon" />
                            </div>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">COVER IMAGE (Optional)</label>
                        <div className="input-wrapper">
                            <input
                                className="input-soft"
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <ImageIcon size={16} className="input-icon" />
                        </div>
                        <p style={{fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px'}}>
                            OR paste a link below
                        </p>
                        <div className="input-wrapper" style={{marginTop: '8px'}}>
                            <input
                                className="input-soft"
                                type="url"
                                name="imageUrl"
                                placeholder="https://..."
                                value={form.imageUrl}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {error && <p className="error-text">{error}</p>}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Updating...' : 'Save Changes'}
                    </button>
                </form>
            </main>

            <LocationPicker
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelectLocation={handleLocationSelect}
                activeField={activeField}
                currentCoords={getCoordsForField()}
            />
        </div>
    );
}
