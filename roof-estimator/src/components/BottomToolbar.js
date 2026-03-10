import { useState, useCallback, useRef } from 'react';
import { TILE_PROVIDERS } from './MapViewer';

const IMAGERY_GROUPS = [
  {
    label: 'Satellite',
    options: [
      { key: 'esriSatellite', name: 'Esri World Imagery' },
      { key: 'googleSatellite', name: 'Google Satellite' },
      { key: 'googleHybrid', name: 'Google Hybrid' },
      { key: 'bingSatellite', name: 'Bing Satellite' },
    ],
  },
  {
    label: 'Map',
    options: [
      { key: 'osm', name: 'OpenStreetMap' },
      { key: 'openTopo', name: 'OpenTopoMap' },
    ],
  },
];

export default function BottomToolbar({
  center,
  tileProvider,
  onTileChange,
  onOpenPitchOverlay,
  onTriggerDraw,
  activeTool,
  // Rotation
  mapRotation = 0,
  onRotateLeft,
  onRotateRight,
  onFineRotateLeft,
  onFineRotateRight,
  onResetRotation,
  // New: grid
  showGrid,
  onToggleGrid,
  // New: units
  unit = 'ft',
  onToggleUnit,
  // New: zoom
  onZoomIn,
  onZoomOut,
}) {
  const [showSelector, setShowSelector] = useState(false);

  const handleOpenGoogleMaps = () => {
    if (!center) return;
    const [lat, lon] = center;
    window.open(
      `https://www.google.com/maps/@${lat},${lon},21z/data=!3m1!1e3`,
      '_blank'
    );
  };

  const currentTile = TILE_PROVIDERS[tileProvider];
  const currentName = currentTile ? currentTile.name : 'Esri Satellite';

  // Hold-to-rotate: continuous rotation while mouse is held down
  const holdTimerRef = useRef(null);
  const holdIntervalRef = useRef(null);

  const startHoldRotate = useCallback((direction, fine = false) => {
    // First rotation fires immediately
    if (fine) {
      if (direction === 'left') onFineRotateLeft?.();
      else onFineRotateRight?.();
    } else {
      if (direction === 'left') onRotateLeft?.();
      else onRotateRight?.();
    }

    // After 400ms delay, start continuous rotation
    holdTimerRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        if (fine) {
          if (direction === 'left') onFineRotateLeft?.();
          else onFineRotateRight?.();
        } else {
          if (direction === 'left') onRotateLeft?.();
          else onRotateRight?.();
        }
      }, fine ? 100 : 60);
    }, 400);
  }, [onRotateLeft, onRotateRight, onFineRotateLeft, onFineRotateRight]);

  const stopHoldRotate = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdTimerRef.current = null;
    holdIntervalRef.current = null;
  }, []);

  return (
    <div className="bottom-toolbar">
      {/* ── Imagery Source Selector ── */}
      <div className="bottom-toolbar-left">
        <div className="imagery-selector-wrap">
          <button
            className="imagery-selector-btn"
            onClick={() => setShowSelector(!showSelector)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>{currentName}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ transform: showSelector ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {showSelector && (
            <div className="imagery-dropdown">
              {IMAGERY_GROUPS.map(group => (
                <div key={group.label} className="imagery-group">
                  <div className="imagery-group-label">{group.label}</div>
                  {group.options.map(opt => (
                    <button
                      key={opt.key}
                      className={`imagery-option ${tileProvider === opt.key ? 'active' : ''}`}
                      onClick={() => { onTileChange(opt.key); setShowSelector(false); }}
                    >
                      {tileProvider === opt.key && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                      {opt.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Rotation & Map Controls (Roofr-style icon bar) ── */}
      <div className="bottom-toolbar-tools">
        {/* Rotate Left */}
        <button
          className="bt-tool-btn"
          onMouseDown={() => startHoldRotate('left')}
          onMouseUp={stopHoldRotate}
          onMouseLeave={stopHoldRotate}
          title="Rotate left (hold for continuous)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        </button>

        {/* Rotate Right */}
        <button
          className="bt-tool-btn"
          onMouseDown={() => startHoldRotate('right')}
          onMouseUp={stopHoldRotate}
          onMouseLeave={stopHoldRotate}
          title="Rotate right 2° (hold for continuous)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'scaleX(-1)' }}>
            <path d="M1 4v6h6"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        </button>

        <div className="bt-divider" />

        {/* Fine Rotate Left (0.25°) */}
        <button
          className="bt-tool-btn bt-fine-btn"
          onMouseDown={() => startHoldRotate('left', true)}
          onMouseUp={stopHoldRotate}
          onMouseLeave={stopHoldRotate}
          title="Fine rotate left 0.25° (hold for continuous)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Fine rotation label */}
        <span className="bt-fine-label" title="Fine-tune rotation (0.25° steps)">
          {mapRotation !== 0 ? `${mapRotation}°` : '0°'}
        </span>

        {/* Fine Rotate Right (0.25°) */}
        <button
          className="bt-tool-btn bt-fine-btn"
          onMouseDown={() => startHoldRotate('right', true)}
          onMouseUp={stopHoldRotate}
          onMouseLeave={stopHoldRotate}
          title="Fine rotate right 0.25° (hold for continuous)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <div className="bt-divider" />

        {/* Reset Rotation */}
        <button
          className={`bt-tool-btn ${mapRotation !== 0 ? 'bt-tool-highlight' : ''}`}
          onClick={onResetRotation}
          title={`Reset rotation (${mapRotation}°)`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>

        <div className="bt-divider" />

        {/* Toggle Grid */}
        <button
          className={`bt-tool-btn ${showGrid ? 'active' : ''}`}
          onClick={onToggleGrid}
          title="Toggle grid overlay"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="1"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
        </button>

        {/* Add Section (+) */}
        <button
          className={`bt-tool-btn ${activeTool === 'draw' ? 'active' : ''}`}
          onClick={onTriggerDraw}
          title="Draw new roof section"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>

        {/* Unit Toggle (ft / m) */}
        <button
          className="bt-tool-btn bt-unit-btn"
          onClick={onToggleUnit}
          title={`Switch units (currently ${unit === 'ft' ? 'feet' : 'meters'})`}
        >
          <span className="bt-unit-label">{unit}</span>
        </button>

        <div className="bt-divider" />

        {/* Zoom In */}
        <button
          className="bt-tool-btn"
          onClick={onZoomIn}
          title="Zoom in"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>

        {/* Zoom Out */}
        <button
          className="bt-tool-btn"
          onClick={onZoomOut}
          title="Zoom out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
      </div>

      {/* ── Google Maps ── */}
      <div className="bottom-toolbar-center">
        <button
          className="bottom-view-btn"
          onClick={handleOpenGoogleMaps}
          disabled={!center}
          title="Open in Google Maps"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          Google Maps
        </button>
      </div>

      {/* ── View Pitch ── */}
      <div className="bottom-toolbar-right">
        <button
          className="bottom-view-btn bottom-pitch-btn"
          onClick={onOpenPitchOverlay}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          View Pitch
        </button>
      </div>

      {/* ── Rotation indicator badge ── */}
      {mapRotation !== 0 && (
        <div className="bt-rotation-badge" title="Current map rotation">
          {mapRotation}°
        </div>
      )}
    </div>
  );
}
