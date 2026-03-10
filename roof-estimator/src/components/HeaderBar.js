import React, { useState } from 'react';

export default function HeaderBar({
  address,
  onAddressChange,
  onGeocode,
  activeTab,
  onTabChange,
  onUndo,
  onRedo,
  onSave,
  onMarkDone,
  canUndo,
  canRedo,
}) {
  const [input, setInput] = useState(address || '');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'draw', label: 'Draw' },
    { id: 'edges', label: 'Edges' },
    { id: 'facets', label: 'Facets' },
  ];

  const handleSearch = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
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
        setEditing(false);
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
    if (e.key === 'Escape') {
      setEditing(false);
      setInput(address || '');
    }
  };

  return (
    <div className="header-bar">
      {/* Left: Tabs */}
      <div className="header-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`header-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Center: Address */}
      <div className="header-address">
        {editing ? (
          <div className="header-address-edit">
            <input
              type="text"
              className="header-address-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter address..."
              autoFocus
            />
            <button className="header-btn-search" onClick={handleSearch} disabled={loading}>
              {loading ? '...' : 'Go'}
            </button>
            <button className="header-btn-cancel" onClick={() => { setEditing(false); setInput(address || ''); }}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="header-address-display" onClick={() => setEditing(true)}>
            {address || 'Click to enter address...'}
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div className="header-actions">
        <button className="header-action-btn" onClick={onUndo} disabled={!canUndo} title="Undo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          Undo
        </button>
        <button className="header-action-btn" onClick={onRedo} disabled={!canRedo} title="Redo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
          </svg>
          Redo
        </button>
        <button className="header-save-btn" onClick={onMarkDone || onSave}>
          Mark as done
        </button>
      </div>
    </div>
  );
}
