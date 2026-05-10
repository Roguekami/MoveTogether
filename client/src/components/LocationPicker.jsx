import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, X } from 'lucide-react';
import './LocationPicker.css';

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const createIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const icons = {
    origin: createIcon('green'),
    destination: createIcon('red'),
    meeting_point: createIcon('blue')
};

// Component to handle map clicks
function ClickHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        }
    });
    return null;
}

// Component to re-center the map
function RecenterMap({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 14);
        }
    }, [center, map]);
    return null;
}

export default function LocationPicker({ isOpen, onClose, onSelectLocation, activeField, currentCoords }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [marker, setMarker] = useState(currentCoords || null);
    const [mapCenter, setMapCenter] = useState(currentCoords || [9.06, 7.49]); // Default: Nigeria center
    const searchTimeout = useRef(null);

    const fieldLabels = {
        origin: 'Origin (From)',
        destination: 'Destination (To)',
        meeting_point: 'Meeting Point'
    };

    useEffect(() => {
        if (currentCoords) {
            setMarker(currentCoords);
            setMapCenter(currentCoords);
        }
    }, [currentCoords]);

    // Search with debounce
    const handleSearch = (query) => {
        setSearchQuery(query);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ng`
                );
                const data = await res.json();
                setSearchResults(data);
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setSearching(false);
            }
        }, 400);
    };

    const selectSearchResult = (result) => {
        const coords = [parseFloat(result.lat), parseFloat(result.lon)];
        setMarker(coords);
        setMapCenter(coords);
        setSearchResults([]);
        setSearchQuery(result.display_name);
    };

    const handleMapClick = async (latlng) => {
        const coords = [latlng.lat, latlng.lng];
        setMarker(coords);

        // Reverse geocode to get the location name
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
            );
            const data = await res.json();
            if (data.display_name) {
                setSearchQuery(data.display_name);
            }
        } catch (err) {
            console.error('Reverse geocode failed:', err);
        }
    };

    const handleConfirm = () => {
        if (marker) {
            // Build a short name from search query
            const locationName = searchQuery || `${marker[0].toFixed(4)}, ${marker[1].toFixed(4)}`;
            onSelectLocation({
                name: locationName,
                coords: { lat: marker[0], lng: marker[1] }
            });
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="location-picker-overlay" onClick={onClose}>
            <div className="location-picker-modal card-shadow" onClick={(e) => e.stopPropagation()}>
                <div className="picker-header">
                    <h3><MapPin size={20} /> Select {fieldLabels[activeField] || 'Location'}</h3>
                    <button className="picker-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="picker-search">
                    <Search size={18} className="picker-search-icon" />
                    <input
                        type="text"
                        placeholder="Search for a location in Nigeria..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        autoFocus
                    />
                    {searching && <div className="picker-searching">Searching...</div>}
                    {searchResults.length > 0 && (
                        <ul className="picker-results">
                            {searchResults.map((result, i) => (
                                <li key={i} onClick={() => selectSearchResult(result)}>
                                    <MapPin size={14} />
                                    <span>{result.display_name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <p className="picker-hint">Click anywhere on the map to drop a pin, or search above.</p>

                <div className="picker-map-container">
                    <MapContainer
                        center={mapCenter}
                        zoom={6}
                        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <ClickHandler onMapClick={handleMapClick} />
                        <RecenterMap center={mapCenter} />
                        {marker && (
                            <Marker
                                position={marker}
                                icon={icons[activeField] || icons.origin}
                            />
                        )}
                    </MapContainer>
                </div>

                <div className="picker-actions">
                    <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleConfirm} disabled={!marker}>
                        Confirm Location
                    </button>
                </div>
            </div>
        </div>
    );
}
