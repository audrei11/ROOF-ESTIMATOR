import { useState, useRef, useCallback, useEffect } from 'react';
import { PITCH_MULTIPLIERS } from '../utils/measurements';

const PITCH_LINES = [
  { label: '4/12', rise: 4 },
  { label: '5/12', rise: 5 },
  { label: '6/12', rise: 6 },
  { label: '7/12', rise: 7 },
  { label: '8/12', rise: 8 },
  { label: '9/12', rise: 9 },
  { label: '10/12', rise: 10 },
  { label: '12/12', rise: 12 },
  { label: '14/12', rise: 14 },
  { label: '16/12', rise: 16 },
  { label: '18/12', rise: 18 },
  { label: '20/12', rise: 20 },
];

// Common residential pitches (highlighted differently)
const COMMON_PITCHES = ['4/12', '5/12', '6/12', '7/12', '8/12'];

// Damping factor for smooth dragging (0 = no movement, 1 = instant/raw)
const DRAG_SMOOTHING = 0.35;

export default function PitchOverlay({ onClose, onPitchSelected, center, standalone }) {
  const [origin, setOrigin] = useState({ x: 50, y: 20 });
  const [rotation, setRotation] = useState(0);
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [hoveredPitch, setHoveredPitch] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [dims, setDims] = useState({ w: 1200, h: 700 });
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState('streetview');
  const [svLoaded, setSvLoaded] = useState(false);
  const [showAllLines, setShowAllLines] = useState(true);
  const [navMode, setNavMode] = useState(false);
  const [heading, setHeading] = useState(0);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const targetOriginRef = useRef({ x: 50, y: 20 });
  const animFrameRef = useRef(null);

  const svLat = center ? center[0] : 39.7684;
  const svLng = center ? center[1] : -86.1581;

  const streetViewEmbedUrl = `https://www.google.com/maps?layer=c&cbll=${svLat},${svLng}&cbp=12,${heading},0,0,0&output=svembed`;

  const turnLeft = () => { setSvLoaded(false); setHeading(h => (h - 30 + 360) % 360); };
  const turnRight = () => { setSvLoaded(false); setHeading(h => (h + 30) % 360); };

  // Track container dims
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) setDims({ w: width, h: height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode, imageSrc]);

  // Esc to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Arrow key nudging for precise red dot placement
  useEffect(() => {
    const handler = (e) => {
      const step = e.shiftKey ? 0.2 : 1; // Shift = fine, normal = coarse
      let dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else return;

      e.preventDefault();
      setOrigin(prev => ({
        x: Math.max(5, Math.min(95, prev.x + dx)),
        y: Math.max(2, Math.min(90, prev.y + dy)),
      }));
      targetOriginRef.current = {
        x: Math.max(5, Math.min(95, targetOriginRef.current.x + dx)),
        y: Math.max(2, Math.min(90, targetOriginRef.current.y + dy)),
      };
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Paste image from clipboard
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          const reader = new FileReader();
          reader.onload = (ev) => {
            setImageSrc(ev.target.result);
            setMode('image');
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Drag peak point — with smoothing
  const handleOriginDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    // Sync the target to current position when starting drag
    targetOriginRef.current = { ...origin };
  }, [origin]);

  // Smooth animation loop: lerp origin toward target
  useEffect(() => {
    if (!isDragging) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    const animate = () => {
      setOrigin(prev => {
        const target = targetOriginRef.current;
        const dx = target.x - prev.x;
        const dy = target.y - prev.y;
        // If close enough, snap
        if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return target;
        return {
          x: prev.x + dx * DRAG_SMOOTHING,
          y: prev.y + dy * DRAG_SMOOTHING,
        };
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isDragging]);

  // Mouse/touch move updates the TARGET (not origin directly)
  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      targetOriginRef.current = {
        x: Math.max(5, Math.min(95, ((cx - rect.left) / rect.width) * 100)),
        y: Math.max(2, Math.min(90, ((cy - rect.top) / rect.height) * 100)),
      };
    };
    const handleUp = () => {
      setIsDragging(false);
      // Snap to final position
      setOrigin(targetOriginRef.current);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target.result);
      setMode('image');
    };
    reader.readAsDataURL(file);
  };

  const handleLineClick = (label) => {
    setSelectedPitch(prev => (prev === label ? null : label));
  };

  const handleApply = () => {
    if (selectedPitch && onPitchSelected) onPitchSelected(selectedPitch);
    onClose?.();
  };

  // SVG coordinates
  const ox = (origin.x / 100) * dims.w;
  const oy = (origin.y / 100) * dims.h;
  const lineLen = Math.max(dims.w, dims.h) * 1.5;
  const baseLabelDist = dims.h * 0.55;

  // Determine which lines to display
  const visibleLines = showAllLines
    ? PITCH_LINES
    : PITCH_LINES.filter(p => COMMON_PITCHES.includes(p.label) || p.label === selectedPitch);

  const content = (
    <div className={standalone ? "po-standalone" : "po-fullscreen"} onClick={e => e.stopPropagation()}>

        {/* Top controls */}
        <div className="po-controls">
          <div className="po-controls-left">
            <button
              className={`po-ctrl-btn ${mode === 'streetview' ? 'po-ctrl-btn-active' : ''}`}
              onClick={() => setMode('streetview')}
            >
              Street View
            </button>
            <button
              className={`po-ctrl-btn ${mode === 'image' ? 'po-ctrl-btn-active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Photo
            </button>
            <input ref={fileInputRef} type="file" accept="image/*"
              onChange={handleFileChange} style={{ display: 'none' }} />
            <span className="po-ctrl-hint">or Ctrl+V to paste</span>
            <div className="po-ctrl-sep" />
            <label className="po-ctrl-label">Rotate:</label>
            <input type="range" min="-45" max="45" step="1" value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="po-ctrl-range" />
            <span className="po-ctrl-val">{rotation}°</span>
            <div className="po-ctrl-sep" />
            <button
              className={`po-ctrl-btn po-ctrl-btn-sm ${!showAllLines ? 'po-ctrl-btn-active' : ''}`}
              onClick={() => setShowAllLines(v => !v)}
              title={showAllLines ? 'Show only common pitches (4-8/12)' : 'Show all pitch lines'}
            >
              {showAllLines ? 'Simplify' : 'Show All'}
            </button>
            {mode === 'streetview' && (
              <>
                <div className="po-ctrl-sep" />
                <button
                  className={`po-ctrl-btn po-nav-toggle ${navMode ? 'po-nav-toggle-active' : ''}`}
                  onClick={() => setNavMode(v => !v)}
                  title={navMode ? 'Switch to pitch selection mode' : 'Navigate Street View freely'}
                >
                  {navMode ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                      </svg>
                      Select Pitch
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
                      </svg>
                      Navigate
                    </>
                  )}
                </button>
              </>
            )}
          </div>
          <div className="po-controls-right">
            {selectedPitch ? (
              <span className="po-ctrl-pitch">
                {selectedPitch} &mdash; &times;{(PITCH_MULTIPLIERS[selectedPitch] || 1).toFixed(3)}
              </span>
            ) : (
              <span className="po-ctrl-pitch-hint">Click a pitch line to select</span>
            )}
            <button className="po-ctrl-apply" onClick={handleApply} disabled={!selectedPitch}>
              Select pitch
            </button>
            {!standalone && (
              <button className="po-ctrl-close" onClick={onClose}>&times;</button>
            )}
          </div>
        </div>

        {/* Main canvas */}
        <div className="po-canvas" ref={canvasRef} tabIndex={-1}>

          {/* Street View iframe */}
          {mode === 'streetview' && (
            <>
              <iframe
                key={heading}
                src={streetViewEmbedUrl}
                className="po-sv-iframe"
                title="Google Street View"
                allowFullScreen
                onLoad={() => setSvLoaded(true)}
              />
              {!svLoaded && (
                <div className="po-sv-loading">
                  <div className="po-sv-spinner" />
                  <p>Loading Street View...</p>
                </div>
              )}
              {/* Turn buttons — always visible on sides */}
              <button className="po-turn-btn po-turn-left" onClick={turnLeft} title="Turn left 30°">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button className="po-turn-btn po-turn-right" onClick={turnRight} title="Turn right 30°">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </>
          )}

          {/* Uploaded/pasted image */}
          {mode === 'image' && imageSrc && (
            <img src={imageSrc} alt="House" className="po-bg-img" draggable={false} />
          )}

          {/* Placeholder when image mode but no image */}
          {mode === 'image' && !imageSrc && (
            <div className="po-waiting">
              <div className="po-waiting-inner">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <h2>Upload or paste a photo</h2>
                <p>Press <strong>Ctrl + V</strong> to paste a screenshot</p>
                <div className="po-waiting-or">or</div>
                <button className="po-waiting-btn" onClick={() => fileInputRef.current?.click()}>
                  Upload a photo
                </button>
              </div>
            </div>
          )}

          {/* SVG Pitch Lines — always on top */}
          <svg className={`po-lines-svg${navMode ? ' po-nav-mode' : ''}`} viewBox={`0 0 ${dims.w} ${dims.h}`} preserveAspectRatio="none">
            <g transform={`rotate(${rotation} ${ox} ${oy})`}>
              {visibleLines.map((pitch, idx) => {
                const theta = Math.atan(pitch.rise / 12);
                const isSel = selectedPitch === pitch.label;
                const isHov = hoveredPitch === pitch.label;
                const isCommon = COMMON_PITCHES.includes(pitch.label);

                // Dynamic styling based on state
                let strokeColor = '#000000';
                let sw = 2.5;
                let opacity = 0.85;

                if (isSel) {
                  strokeColor = '#ff3333';
                  sw = 3.5;
                  opacity = 1;
                } else if (isHov) {
                  strokeColor = '#fbbf24';
                  sw = 3;
                  opacity = 1;
                }

                const lx = ox - lineLen * Math.cos(theta);
                const ly = oy + lineLen * Math.sin(theta);
                const rx = ox + lineLen * Math.cos(theta);
                const ry = oy + lineLen * Math.sin(theta);

                const labelDist = baseLabelDist + idx * 8;
                const llx = ox - labelDist * Math.cos(theta);
                const lly = oy + labelDist * Math.sin(theta);
                const rlx = ox + labelDist * Math.cos(theta);
                const rly = oy + labelDist * Math.sin(theta);

                const labelFill = isSel ? '#ff3333' : isHov ? '#fbbf24' : '#000000';
                const labelFontSize = isSel || isHov ? 16 : 14;

                return (
                  <g key={pitch.label}
                    onClick={() => handleLineClick(pitch.label)}
                    onMouseEnter={() => setHoveredPitch(pitch.label)}
                    onMouseLeave={() => setHoveredPitch(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Hit areas — wider for easier clicking */}
                    <line x1={ox} y1={oy} x2={lx} y2={ly} stroke="transparent" strokeWidth="24" />
                    <line x1={ox} y1={oy} x2={rx} y2={ry} stroke="transparent" strokeWidth="24" />

                    {/* Left line */}
                    <line x1={ox} y1={oy} x2={lx} y2={ly}
                      stroke={strokeColor}
                      strokeWidth={sw}
                      strokeOpacity={opacity}
                    />
                    {/* Right line */}
                    <line x1={ox} y1={oy} x2={rx} y2={ry}
                      stroke={strokeColor}
                      strokeWidth={sw}
                      strokeOpacity={opacity}
                    />

                    {/* Glow for selected */}
                    {isSel && (
                      <>
                        <line x1={ox} y1={oy} x2={lx} y2={ly} stroke="#ff3333" strokeWidth={7} strokeOpacity={0.2} />
                        <line x1={ox} y1={oy} x2={rx} y2={ry} stroke="#ff3333" strokeWidth={7} strokeOpacity={0.2} />
                      </>
                    )}

                    {/* Hover glow */}
                    {isHov && !isSel && (
                      <>
                        <line x1={ox} y1={oy} x2={lx} y2={ly} stroke="#fbbf24" strokeWidth={6} strokeOpacity={0.15} />
                        <line x1={ox} y1={oy} x2={rx} y2={ry} stroke="#fbbf24" strokeWidth={6} strokeOpacity={0.15} />
                      </>
                    )}

                    {/* Left label */}
                    <g transform={`rotate(${-rotation} ${llx} ${lly})`}>
                      <text x={llx} y={lly + 5} textAnchor="middle"
                        fill={labelFill}
                        fontSize={labelFontSize} fontWeight="800"
                        stroke="rgba(255,255,255,0.9)" strokeWidth="4" paintOrder="stroke"
                        style={{ pointerEvents: 'none', userSelect: 'none', transition: 'font-size 0.15s, fill 0.15s' }}
                      >
                        {pitch.label}
                      </text>
                    </g>

                    {/* Right label */}
                    <g transform={`rotate(${-rotation} ${rlx} ${rly})`}>
                      <text x={rlx} y={rly + 5} textAnchor="middle"
                        fill={labelFill}
                        fontSize={labelFontSize} fontWeight="800"
                        stroke="rgba(255,255,255,0.9)" strokeWidth="4" paintOrder="stroke"
                        style={{ pointerEvents: 'none', userSelect: 'none', transition: 'font-size 0.15s, fill 0.15s' }}
                      >
                        {pitch.label}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>

            {/* Draggable peak point — hidden in navigate mode */}
            {!navMode && (
              <g>
                {/* Outer ring / pulse when not dragging */}
                <circle cx={ox} cy={oy} r={isDragging ? 20 : 16}
                  fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"
                  className={isDragging ? '' : 'po-dot-pulse'}
                />
                {/* Main dot */}
                <circle cx={ox} cy={oy} r={isDragging ? 16 : 12}
                  fill="#ff0000" stroke="white" strokeWidth="3"
                  filter="url(#dotShadow)"
                  style={{ cursor: isDragging ? 'grabbing' : 'grab', transition: 'r 0.15s' }}
                  onMouseDown={handleOriginDown}
                  onTouchStart={handleOriginDown}
                />
                {/* Crosshair inside dot */}
                <line x1={ox - 5} y1={oy} x2={ox + 5} y2={oy} stroke="white" strokeWidth="1.5" strokeOpacity="0.8" style={{ pointerEvents: 'none' }} />
                <line x1={ox} y1={oy - 5} x2={ox} y2={oy + 5} stroke="white" strokeWidth="1.5" strokeOpacity="0.8" style={{ pointerEvents: 'none' }} />
              </g>
            )}

            {/* SVG filter for dot shadow */}
            <defs>
              <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" />
              </filter>
            </defs>
          </svg>

          {/* Instructions */}
          <div className="po-instructions">
            {navMode ? (
              <div className="po-instr-main">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }}>
                  <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
                </svg>
                <strong>Navigate mode</strong> &mdash; drag to look around, then click <strong>Select Pitch</strong> when ready
              </div>
            ) : (
              <>
                <div className="po-instr-main">
                  Drag the <span style={{ color: '#ff4444', fontWeight: 700 }}>red dot</span> to the roof peak, then click the line that matches the slope
                </div>
                <div className="po-instr-keys">
                  <kbd>Arrow keys</kbd> to nudge &middot; <kbd>Shift</kbd> for fine control &middot; Click <strong>Navigate</strong> to look around
                </div>
              </>
            )}
          </div>
        </div>
      </div>
  );

  if (standalone) return content;

  return (
    <div className="po-modal" onClick={onClose}>
      {content}
    </div>
  );
}
