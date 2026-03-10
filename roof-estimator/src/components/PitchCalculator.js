import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PITCH_MULTIPLIERS } from '../utils/measurements';

const STANDARD_PITCHES = Object.keys(PITCH_MULTIPLIERS).map(p => {
  const rise = parseInt(p.split('/')[0], 10);
  return { label: p, rise, ratio: rise / 12 };
});

function snapToStandardPitch(calculatedRise) {
  let closest = STANDARD_PITCHES[0];
  let minDiff = Infinity;
  for (const sp of STANDARD_PITCHES) {
    const diff = Math.abs(sp.rise - calculatedRise);
    if (diff < minDiff) {
      minDiff = diff;
      closest = sp;
    }
  }
  return closest;
}

const STEPS = [
  { id: 'rise1', label: 'Click the TOP of the vertical rise', icon: '↑' },
  { id: 'rise2', label: 'Click the BOTTOM of the vertical rise', icon: '↓' },
  { id: 'run1', label: 'Click the LEFT end of the horizontal run', icon: '←' },
  { id: 'run2', label: 'Click the RIGHT end of the horizontal run', icon: '→' },
];

export default function PitchCalculator({ onClose, onPitchSelected, imageUrl, streetViewUrl }) {
  const [step, setStep] = useState(0);
  const [points, setPoints] = useState({});
  const [result, setResult] = useState(null);
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // If a street view URL is provided, try to show it; otherwise show image or placeholder
  const hasImage = imageUrl || streetViewUrl;

  const handleContainerClick = useCallback((e) => {
    if (step >= 4) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const currentStep = STEPS[step];
    const newPoints = { ...points, [currentStep.id]: { x, y } };
    setPoints(newPoints);

    if (step === 3) {
      // All 4 points collected — calculate pitch
      const risePixels = Math.abs(newPoints.rise1.y - newPoints.rise2.y);
      const runPixels = Math.abs(newPoints.run1.x - newPoints.run2.x);

      if (runPixels < 2) {
        setResult({ error: 'Horizontal run too small. Please try again.' });
        setStep(4);
        return;
      }

      const rawRise = (risePixels / runPixels) * 12;
      const snapped = snapToStandardPitch(rawRise);

      setResult({
        rawRise: rawRise.toFixed(1),
        snappedPitch: snapped.label,
        snappedRise: snapped.rise,
        risePixels: Math.round(risePixels),
        runPixels: Math.round(runPixels),
        multiplier: PITCH_MULTIPLIERS[snapped.label],
      });
    }

    setStep(step + 1);
  }, [step, points]);

  const handleReset = useCallback(() => {
    setStep(0);
    setPoints({});
    setResult(null);
  }, []);

  const handleApply = useCallback(() => {
    if (result && !result.error && onPitchSelected) {
      onPitchSelected(result.snappedPitch);
    }
    if (onClose) onClose();
  }, [result, onPitchSelected, onClose]);

  // Keyboard shortcut: Escape to close, R to reset
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
      if (e.key === 'r' || e.key === 'R') handleReset();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, handleReset]);

  const renderLines = () => {
    const lines = [];

    // Rise line (vertical)
    if (points.rise1 && points.rise2) {
      lines.push(
        <line
          key="rise"
          x1={points.rise1.x} y1={points.rise1.y}
          x2={points.rise2.x} y2={points.rise2.y}
          stroke="#ef4444" strokeWidth="2.5" strokeDasharray="6 3"
        />
      );
      // Rise label
      const midY = (points.rise1.y + points.rise2.y) / 2;
      lines.push(
        <g key="rise-label">
          <rect
            x={points.rise1.x + 6} y={midY - 10}
            width="40" height="20" rx="4"
            fill="rgba(239,68,68,0.9)"
          />
          <text
            x={points.rise1.x + 26} y={midY + 4}
            fill="white" fontSize="11" fontWeight="600" textAnchor="middle"
          >
            Rise
          </text>
        </g>
      );
    }

    // Run line (horizontal)
    if (points.run1 && points.run2) {
      lines.push(
        <line
          key="run"
          x1={points.run1.x} y1={points.run1.y}
          x2={points.run2.x} y2={points.run2.y}
          stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6 3"
        />
      );
      // Run label
      const midX = (points.run1.x + points.run2.x) / 2;
      lines.push(
        <g key="run-label">
          <rect
            x={midX - 20} y={points.run1.y + 6}
            width="40" height="20" rx="4"
            fill="rgba(59,130,246,0.9)"
          />
          <text
            x={midX} y={points.run1.y + 20}
            fill="white" fontSize="11" fontWeight="600" textAnchor="middle"
          >
            Run
          </text>
        </g>
      );
    }

    // Point markers
    Object.entries(points).forEach(([key, pt]) => {
      const color = key.startsWith('rise') ? '#ef4444' : '#3b82f6';
      lines.push(
        <circle key={`pt-${key}`} cx={pt.x} cy={pt.y} r="5" fill={color} stroke="white" strokeWidth="2" />
      );
    });

    return lines;
  };

  return (
    <div className="pitch-calc-overlay">
      <div className="pitch-calc-container">
        {/* Title bar */}
        <div className="pitch-calc-titlebar">
          <span className="pitch-calc-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Pitch Calculator
          </span>
          <button className="pitch-calc-close" onClick={onClose} title="Close (Esc)">×</button>
        </div>

        {/* Step indicator */}
        <div className="pitch-calc-steps">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`pitch-calc-step ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}
            >
              <span className="pitch-calc-step-num">{i < step ? '✓' : i + 1}</span>
              <span className="pitch-calc-step-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Image / click area */}
        <div
          className="pitch-calc-canvas"
          ref={containerRef}
          onClick={step < 4 ? handleContainerClick : undefined}
          style={{ cursor: step < 4 ? 'crosshair' : 'default' }}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Property view"
              className="pitch-calc-img"
              draggable={false}
            />
          )}

          {!imageUrl && streetViewUrl && (
            <div className="pitch-calc-placeholder">
              <p>Street View cannot be embedded directly.</p>
              <button className="pitch-calc-open-sv" onClick={() => window.open(streetViewUrl, '_blank')}>
                Open Street View in New Tab
              </button>
              <p className="pitch-calc-hint">
                Take a screenshot, then use "Upload Image" below,<br/>
                or click on the grid area to mark points manually.
              </p>
              <div className="pitch-calc-grid-bg" />
            </div>
          )}

          {!hasImage && (
            <div className="pitch-calc-placeholder">
              <div className="pitch-calc-grid-bg" />
              <p>Click to place measurement points on the grid.</p>
              <p className="pitch-calc-hint">
                For best results, open Street View and take a screenshot.
              </p>
            </div>
          )}

          {/* SVG overlay for lines and points */}
          <svg
            ref={svgRef}
            className="pitch-calc-svg"
            style={{ pointerEvents: 'none' }}
          >
            {renderLines()}
          </svg>

          {/* Current step hint */}
          {step < 4 && (
            <div className="pitch-calc-step-hint">
              <span className="pitch-calc-step-icon">{STEPS[step].icon}</span>
              {STEPS[step].label}
            </div>
          )}
        </div>

        {/* Result area */}
        {result && (
          <div className={`pitch-calc-result ${result.error ? 'error' : ''}`}>
            {result.error ? (
              <p className="pitch-calc-error">{result.error}</p>
            ) : (
              <>
                <div className="pitch-calc-result-main">
                  <div className="pitch-calc-result-pitch">
                    <span className="pitch-calc-result-label">Calculated Pitch</span>
                    <span className="pitch-calc-result-value">{result.snappedPitch}</span>
                  </div>
                  <div className="pitch-calc-result-details">
                    <div className="pitch-calc-detail-row">
                      <span>Raw measurement:</span>
                      <span>{result.rawRise}/12</span>
                    </div>
                    <div className="pitch-calc-detail-row">
                      <span>Snapped to:</span>
                      <span>{result.snappedPitch}</span>
                    </div>
                    <div className="pitch-calc-detail-row">
                      <span>Area multiplier:</span>
                      <span>×{result.multiplier.toFixed(3)}</span>
                    </div>
                    <div className="pitch-calc-detail-row muted">
                      <span>Rise: {result.risePixels}px</span>
                      <span>Run: {result.runPixels}px</span>
                    </div>
                  </div>
                </div>

                {/* Pitch visual */}
                <div className="pitch-calc-result-visual">
                  <PitchVisual rise={result.snappedRise} />
                </div>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="pitch-calc-actions">
          <button className="pitch-calc-btn secondary" onClick={handleReset}>
            Reset (R)
          </button>
          {result && !result.error && (
            <button className="pitch-calc-btn primary" onClick={handleApply}>
              Apply {result.snappedPitch} Pitch
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PitchVisual({ rise }) {
  const w = 120;
  const maxH = 60;
  const h = Math.min((rise / 20) * maxH, maxH);

  return (
    <svg width={w + 30} height={maxH + 20} className="pitch-calc-visual-svg">
      {/* Run (horizontal base) */}
      <line x1="10" y1={maxH + 8} x2={w + 10} y2={maxH + 8} stroke="#3b82f6" strokeWidth="2.5" />
      {/* Rise (vertical) */}
      <line x1={w + 10} y1={maxH + 8} x2={w + 10} y2={maxH + 8 - h} stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4" />
      {/* Slope */}
      <line x1="10" y1={maxH + 8} x2={w + 10} y2={maxH + 8 - h} stroke="#22c55e" strokeWidth="2.5" />
      {/* Labels */}
      <text x={w / 2 + 10} y={maxH + 18} fontSize="10" fill="#3b82f6" textAnchor="middle" fontWeight="600">12</text>
      <text x={w + 22} y={maxH + 8 - h / 2} fontSize="10" fill="#ef4444" textAnchor="start" fontWeight="600">{rise}</text>
    </svg>
  );
}
