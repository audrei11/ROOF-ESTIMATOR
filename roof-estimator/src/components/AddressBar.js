import React, { useState } from 'react';

export default function AddressBar({ address, onAddressChange, onGeocode, center }) {
  const [input, setInput] = useState(address || '');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      // Use Nominatim (free, no API key needed) for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=1`,
        { headers: { 'User-Agent': 'RoofEstimator/1.0' } }
      );
      const results = await response.json();
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        onAddressChange(display_name);
        onGeocode([parseFloat(lat), parseFloat(lon)]);
        setInput(display_name);
      } else {
        alert('Address not found. Try a more specific address.');
      }
    } catch (err) {
      alert('Geocoding error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const openGoogleMaps = () => {
    if (center) {
      window.open(
        `https://www.google.com/maps/@${center[0]},${center[1]},21z/data=!3m1!1e3`,
        '_blank'
      );
    }
  };

  const openStreetView = () => {
    if (center) {
      window.open(
        `https://www.google.com/maps?q=&layer=c&cbll=${center[0]},${center[1]}`,
        '_blank'
      );
    }
  };

  return (
    <div className="address-bar">
      <div className="address-input-group">
        <input
          type="text"
          className="address-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter address (e.g., 2028 Lexington Ave, Indianapolis, IN)"
        />
        <button
          className="btn-search"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? '...' : '🔍 Search'}
        </button>
      </div>
      <div className="address-actions">
        <button className="btn-link" onClick={openGoogleMaps} title="View satellite on Google Maps">
          📡 Google Maps
        </button>
        <button className="btn-link" onClick={openStreetView} title="View pitch in Street View">
          🏠 Street View
        </button>
      </div>
    </div>
  );
}
