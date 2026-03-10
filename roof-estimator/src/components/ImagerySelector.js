import React from 'react';
import { TILE_PROVIDERS } from './MapViewer';

export default function ImagerySelector({ selected, onChange }) {
  const providers = [
    { key: 'esriSatellite', label: 'Satellite' },
    { key: 'osm', label: 'Street Map' },
    { key: 'openTopo', label: 'Topo Map' },
  ];

  return (
    <div className="imagery-selector">
      <label className="panel-label">Map Imagery</label>
      <div className="imagery-buttons">
        {providers.map(p => (
          <button
            key={p.key}
            className={`imagery-btn ${selected === p.key ? 'active' : ''}`}
            onClick={() => onChange(p.key)}
            title={TILE_PROVIDERS[p.key].name}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
