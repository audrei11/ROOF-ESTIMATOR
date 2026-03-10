import React, { useRef, useState, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   SignatureCanvas — Draw or type a signature
   ─────────────────────────────────────────────────────────────────────────
   Props:
     onSignature(dataUrl)  — called with base64 PNG when user draws/types
     width                 — canvas width (default 500)
     height                — canvas height (default 180)
   ═══════════════════════════════════════════════════════════════════════════ */

export default function SignatureCanvas({ onSignature, width = 500, height = 180 }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState('draw'); // 'draw' or 'type'
  const [typedName, setTypedName] = useState('');

  // Get canvas coordinates from mouse/touch event
  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  // Start drawing
  const handleStart = useCallback((e) => {
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }, [getPos]);

  // Draw stroke
  const handleMove = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasDrawn(true);
  }, [isDrawing, getPos]);

  // End drawing
  const handleEnd = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (hasDrawn && canvasRef.current) {
      onSignature?.(canvasRef.current.toDataURL('image/png'));
    }
  }, [isDrawing, hasDrawn, onSignature]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSignature?.(null);
  }, [onSignature]);

  // When typed name changes, render it to canvas and emit
  useEffect(() => {
    if (mode !== 'type') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (typedName.trim()) {
      ctx.font = 'italic 42px "Georgia", "Times New Roman", serif';
      ctx.fillStyle = '#1e293b';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 24, canvas.height / 2);
      onSignature?.(canvas.toDataURL('image/png'));
    } else {
      onSignature?.(null);
    }
  }, [typedName, mode, onSignature]);

  // Attach touch listeners (non-passive for preventDefault)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== 'draw') return;

    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleEnd);
    };
  }, [mode, handleStart, handleMove, handleEnd]);

  return (
    <div className="sig-container">
      {/* Mode toggle */}
      <div className="sig-mode-toggle">
        <button
          className={`sig-mode-btn ${mode === 'draw' ? 'active' : ''}`}
          onClick={() => { setMode('draw'); clearCanvas(); setTypedName(''); }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
          </svg>
          Draw
        </button>
        <button
          className={`sig-mode-btn ${mode === 'type' ? 'active' : ''}`}
          onClick={() => { setMode('type'); clearCanvas(); }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/>
            <line x1="12" y1="4" x2="12" y2="20"/>
          </svg>
          Type
        </button>
      </div>

      {/* Canvas */}
      <div className="sig-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="sig-canvas"
          onMouseDown={mode === 'draw' ? handleStart : undefined}
          onMouseMove={mode === 'draw' ? handleMove : undefined}
          onMouseUp={mode === 'draw' ? handleEnd : undefined}
          onMouseLeave={mode === 'draw' ? handleEnd : undefined}
        />
        {mode === 'draw' && !hasDrawn && (
          <div className="sig-placeholder">Sign here with your mouse or finger</div>
        )}
        {/* Signature line */}
        <div className="sig-line" />
      </div>

      {/* Type input */}
      {mode === 'type' && (
        <input
          type="text"
          className="sig-type-input"
          placeholder="Type your full name..."
          value={typedName}
          onChange={e => setTypedName(e.target.value)}
          autoFocus
        />
      )}

      {/* Clear button */}
      {(hasDrawn || typedName) && (
        <button className="sig-clear-btn" onClick={() => { clearCanvas(); setTypedName(''); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 105.64-12.36L1 10"/>
          </svg>
          Clear signature
        </button>
      )}
    </div>
  );
}
