import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { slopeFactor } from './measurements';

/* ═══════════════════════════════════════════════════════════════════════════
   Ahjin Roofing — Client-Side 7-Page PDF (Roofr-Style Template)
   ─────────────────────────────────────────────────────────────────────────
   Each page: off-screen div → html2canvas (scale: 3) → jsPDF page
   Template matches the Roofr 7-page cycle exactly.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Design Tokens ──────────────────────────────────────────────────── */
const BLUE = '#0047AB';
const DK   = '#1a1a2e';
const TX   = '#374151';
const GR   = '#6b7280';
const GL   = '#9ca3af';
const LN   = '#e5e7eb';
const RA   = '#f9fafb';

/* ── Edge type config ───────────────────────────────────────────────── */
const EC = {
  eave:          { c: '#16a34a', n: 'Eaves' },
  ridge:         { c: '#14b8a6', n: 'Ridges' },
  valley:        { c: '#ef4444', n: 'Valleys' },
  hip:           { c: '#a855f7', n: 'Hips' },
  rake:          { c: '#f59e0b', n: 'Rakes' },
  wall_flashing: { c: '#3b82f6', n: 'Wall flashing' },
  step_flashing: { c: '#ec4899', n: 'Step flashing' },
  transition:    { c: '#8b5cf6', n: 'Transitions' },
  parapet_wall:  { c: '#f97316', n: 'Parapet wall' },
  unclassified:  { c: '#94a3b8', n: 'Unspecified' },
};

const EDGE_ORDER = ['eave','ridge','valley','hip','rake',
  'wall_flashing','step_flashing','transition','parapet_wall','unclassified'];

/* ── Helpers ───────────────────────────────────────────────────────── */
const ftIn = (ft) => {
  if (!ft || ft <= 0) return '0ft 0in';
  const f = Math.floor(ft);
  return `${f}ft ${Math.round((ft - f) * 12)}in`;
};
const nm  = (v) => Math.round(v).toLocaleString();
const d1  = (v) => Number(v).toFixed(1);
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ── Inline style constants ─────────────────────────────────────────── */
const PAGE = `width:794px;height:1123px;position:relative;overflow:hidden;background:#fff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${TX};font-size:11px;line-height:1.4;box-sizing:border-box;`;
const PAD  = `padding:36px 38px 44px;`;
const TH   = `padding:7px 10px;font-size:9px;font-weight:700;color:#fff;letter-spacing:0.06em;text-transform:uppercase;background:${BLUE};border:none;white-space:nowrap;`;
const TD   = `padding:6px 10px;font-size:10px;border-bottom:1px solid ${LN};`;

/* ── Common HTML fragments (Roofr-style header / footer) ─────────── */
const hdr = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid ${LN};">
  <div style="display:flex;align-items:center;gap:8px;">
    <div style="width:28px;height:28px;border-radius:6px;background:${BLUE};display:flex;align-items:center;justify-content:center;">
      <span style="color:#fff;font-size:15px;font-weight:800;line-height:1;">T</span>
    </div>
    <span style="font-size:12px;font-weight:700;color:${DK};letter-spacing:-0.2px;">Ahjin Roofing</span>
  </div>
  <div style="display:flex;align-items:center;gap:5px;font-size:9px;color:${GR};">
    <span style="font-weight:500;">Powered by</span>
    <span style="display:inline-flex;align-items:center;gap:4px;">
      <span style="width:16px;height:16px;border-radius:4px;background:#0090FF;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:800;">r</span>
      <span style="font-weight:800;color:#1a1a2e;font-size:12px;letter-spacing:-0.3px;">roofr</span>
    </span>
  </div>
</div>`;

const ftr = (pg) => `<div style="position:absolute;bottom:0;left:0;right:0;padding:10px 38px;display:flex;align-items:center;justify-content:space-between;font-size:7.5px;border-top:1px solid ${LN};background:#fff;">
  <span style="color:${GR};">This report was powered by Ahjin Roofing. Copyright &copy; ${new Date().getFullYear()} Ahjin Roofing | All rights reserved.</span>
  <span style="width:22px;height:22px;border-radius:50%;background:${BLUE};display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;">${pg}</span>
</div>`;

const ttl = (t, addr) => `<div style="font-size:20px;font-weight:700;color:${BLUE};margin-bottom:2px;">${t}</div><div style="font-size:10px;color:${GR};margin-bottom:12px;">${esc(addr)}</div>`;

const img = (src, h) => src
  ? `<img src="${src}" style="width:100%;height:${h}px;display:block;object-fit:cover;border:1px solid ${LN};border-radius:4px;" />`
  : `<div style="height:${Math.min(h, 200)}px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px;border-radius:4px;">No image</div>`;

const diag = (src, h) => src
  ? `<img src="${src}" style="width:100%;height:${h}px;display:block;object-fit:contain;background:#fff;border:1px solid ${LN};border-radius:4px;" />`
  : `<div style="height:${h}px;background:#fff;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px;border-radius:4px;border:1px solid ${LN};">No diagram</div>`;


/* ═════════════════════════════════════════════════════════════════════
   RENDER GEOMETRIC DIAGRAM (canvas → data-URL)
   Options: showLengths, showAreas, showPitch, colorByType, showCompass
   ═════════════════════════════════════════════════════════════════════ */
function renderDiagram(edges, facets, w, h, opts = {}) {
  if (!edges || edges.length === 0) return '';

  // Diagnostic: log edge coordinates for debugging
  console.log('[PDF renderDiagram] edges:', edges.length, 'facets:', (facets||[]).length, 'canvas:', w, 'x', h);
  edges.forEach((e, i) => {
    console.log(`  edge[${i}]: start=[${e.start}] end=[${e.end}] len=${e.length||'?'} type=${e.type||'?'}`);
  });

  const canvas = document.createElement('canvas');
  const dpr = 3;                     // higher DPR for sharper PDF output
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // White background (matches Roofr)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Bounding box — with outlier protection
  const allPts = [];
  edges.forEach(e => {
    [e.start, e.end].forEach(p => {
      if (Array.isArray(p) && p.length >= 2 && isFinite(p[0]) && isFinite(p[1])) {
        allPts.push([p[0], p[1]]);
      }
    });
  });

  if (allPts.length === 0) return '';

  // Sort lats and lngs to compute median
  const lats = allPts.map(p => p[0]).sort((a, b) => a - b);
  const lngs = allPts.map(p => p[1]).sort((a, b) => a - b);
  const medLat = lats[Math.floor(lats.length / 2)];
  const medLng = lngs[Math.floor(lngs.length / 2)];

  // Compute raw bbox
  let rawMinLat = Math.min(...lats), rawMaxLat = Math.max(...lats);
  let rawMinLng = Math.min(...lngs), rawMaxLng = Math.max(...lngs);
  const rawDLat = rawMaxLat - rawMinLat;
  const rawDLng = rawMaxLng - rawMinLng;

  let minLat, maxLat, minLng, maxLng;

  // If range is suspiciously large (> 0.003° ≈ 300m — very generous for a roof),
  // find the densest cluster of points and use only those for the bounding box
  if (rawDLat > 0.003 || rawDLng > 0.003) {
    console.warn('[PDF diagram] Outlier detected — raw bbox range:', rawDLat.toFixed(6), rawDLng.toFixed(6));
    // Density-based cluster detection: find the point with the most nearby neighbors
    const CLUSTER_R = 0.0015; // ~150m radius — generous for a single roof
    let bestCenter = allPts[0];
    let bestCount = 0;
    for (const p of allPts) {
      let count = 0;
      for (const q of allPts) {
        if (Math.abs(q[0] - p[0]) < CLUSTER_R && Math.abs(q[1] - p[1]) < CLUSTER_R) count++;
      }
      if (count > bestCount) { bestCount = count; bestCenter = p; }
    }
    // Keep all points within 2× radius of the densest cluster center
    const keepR = CLUSTER_R * 2;
    const clusterPts = allPts.filter(p =>
      Math.abs(p[0] - bestCenter[0]) < keepR && Math.abs(p[1] - bestCenter[1]) < keepR
    );
    const usePts = clusterPts.length >= 3 ? clusterPts : allPts;
    minLat = Infinity; maxLat = -Infinity; minLng = Infinity; maxLng = -Infinity;
    usePts.forEach(p => {
      if (p[0] < minLat) minLat = p[0];
      if (p[0] > maxLat) maxLat = p[0];
      if (p[1] < minLng) minLng = p[1];
      if (p[1] > maxLng) maxLng = p[1];
    });
    console.warn('[PDF diagram] Cluster filter:', { center: bestCenter, kept: usePts.length, total: allPts.length });
  } else {
    // Normal case — use raw bbox directly
    minLat = rawMinLat; maxLat = rawMaxLat;
    minLng = rawMinLng; maxLng = rawMaxLng;
  }

  const pad = 45;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const avgLat = (minLat + maxLat) / 2;
  const cosLat = Math.cos(avgLat * Math.PI / 180);

  // ── Rotation: straighten the diagram ─────────────────────────────
  // When the user draws on a rotated map, edges that looked horizontal
  // on screen are tilted in true North-up coordinates. Use the known
  // map bearing to rotate them back to straight. Falls back to
  // auto-detection for legacy projects without a saved bearing.
  let rotAngle = 0;
  if (opts.bearing && Math.abs(opts.bearing) > 0.5) {
    // Direct bearing from map rotation — most reliable
    rotAngle = -opts.bearing * Math.PI / 180;
    console.log('[PDF diagram] Using map bearing for rotation:', opts.bearing, '° → rotAngle:', rotAngle.toFixed(4));
  } else {
    // Fallback: auto-detect dominant edge direction
    let sumSin = 0, sumCos = 0;
    edges.forEach(e => {
      if (!e.start || !e.end) return;
      const dx = (e.end[1] - e.start[1]) * cosLat;
      const dy = e.end[0] - e.start[0];
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1e-10) return;
      const angle = Math.atan2(dy, dx);
      sumSin += Math.sin(angle * 4) * (e.length || len);
      sumCos += Math.cos(angle * 4) * (e.length || len);
    });
    if (Math.hypot(sumSin, sumCos) > 1e-10) {
      const dominantOffset = Math.atan2(sumSin, sumCos) / 4;
      if (Math.abs(dominantOffset) < Math.PI / 6) { // 30° limit for auto-detect
        rotAngle = -dominantOffset;
        console.log('[PDF diagram] Auto-detected rotation:', (dominantOffset * 180 / Math.PI).toFixed(1), '° → rotAngle:', rotAngle.toFixed(4));
      }
    }
  }

  // Centroid = rotation center
  const cLat = allPts.reduce((s, p) => s + p[0], 0) / allPts.length;
  const cLng = allPts.reduce((s, p) => s + p[1], 0) / allPts.length;
  const cosR = Math.cos(rotAngle), sinR = Math.sin(rotAngle);

  // lat/lng → rotated flat coordinates (degrees, cosLat-corrected)
  const toRotated = (lat, lng) => {
    const dx = (lng - cLng) * cosLat;
    const dy = lat - cLat;
    return { rx: dx * cosR - dy * sinR, ry: dx * sinR + dy * cosR };
  };

  // Bounding box of ROTATED points
  let rMinX = Infinity, rMaxX = -Infinity, rMinY = Infinity, rMaxY = -Infinity;
  allPts.forEach(p => {
    const { rx, ry } = toRotated(p[0], p[1]);
    if (rx < rMinX) rMinX = rx; if (rx > rMaxX) rMaxX = rx;
    if (ry < rMinY) rMinY = ry; if (ry > rMaxY) rMaxY = ry;
  });
  const dRX = rMaxX - rMinX || 0.0001;
  const dRY = rMaxY - rMinY || 0.0001;
  const scale = Math.min(innerW / dRX, innerH / dRY);
  const offX = pad + (innerW - dRX * scale) / 2;
  const offY = pad + (innerH - dRY * scale) / 2;

  // ── Vertex deduplication ──────────────────────────────────────────
  const SNAP_THRESH = 0.000005;
  const vertexCache = [];
  const snapCoord = (lat, lng) => {
    for (const v of vertexCache) {
      if (Math.abs(v.lat - lat) < SNAP_THRESH && Math.abs(v.lng - lng) < SNAP_THRESH) {
        return { x: v.px, y: v.py };
      }
    }
    const { rx, ry } = toRotated(lat, lng);
    const px = Math.round((offX + (rx - rMinX) * scale) * 2) / 2;
    const py = Math.round((offY + (rMaxY - ry) * scale) * 2) / 2;
    vertexCache.push({ lat, lng, px, py });
    return { x: px, y: py };
  };

  const DIAG_EDGE = '#00b4d8';
  const DIAG_FILL = '#dff0fa';
  const DIAG_STROKE = opts.strokeWidth || 2.4;
  const colorByType = opts.colorByType || false;

  // ── Facet vertex → edge coordinate snapping ───────────────────────
  // Facet latlngs come from computeFacetsFromEdges() which deduplicates
  // at a coarser threshold (0.00002) than geometry.js (0.0000005).
  // This causes facet polygon corners to differ from edge endpoints,
  // making the fill overflow beyond the edge lines.
  // Fix: snap every facet vertex to its nearest edge endpoint, or for
  // T-junction points, to the nearest point ON an edge line.
  const FACET_SNAP = 0.00004; // ~4m — covers the measurements.js EPS gap
  const snapFacetPt = (lat, lng) => {
    // 1. Try nearest edge endpoint
    let bestD = Infinity, bestPt = null;
    for (const e of edges) {
      for (const ep of [e.start, e.end]) {
        if (!ep) continue;
        const d = Math.abs(ep[0] - lat) + Math.abs(ep[1] - lng);
        if (d < bestD) { bestD = d; bestPt = ep; }
      }
    }
    if (bestPt && bestD < FACET_SNAP) {
      return snapCoord(bestPt[0], bestPt[1]);
    }
    // 2. Nearest point ON an edge line (handles T-junction vertices)
    let bestLD = Infinity, bestLP = null;
    for (const e of edges) {
      if (!e.start || !e.end) continue;
      const ax = e.start[0], ay = e.start[1];
      const bx = e.end[0], by = e.end[1];
      const dx = bx - ax, dy = by - ay;
      const lenSq = dx * dx + dy * dy;
      if (lenSq < 1e-14) continue;
      const t = Math.max(0, Math.min(1, ((lat - ax) * dx + (lng - ay) * dy) / lenSq));
      const d = Math.abs(ax + t * dx - lat) + Math.abs(ay + t * dy - lng);
      if (d < bestLD) { bestLD = d; bestLP = [ax + t * dx, ay + t * dy]; }
    }
    if (bestLP && bestLD < FACET_SNAP) {
      return snapCoord(bestLP[0], bestLP[1]);
    }
    return snapCoord(lat, lng);
  };

  // 1. Facets — fill only (edges provide all line work on top)
  (facets || []).forEach(f => {
    if (!f.latlngs || f.latlngs.length < 3) return;
    ctx.beginPath();
    f.latlngs.forEach((p, i) => {
      const { x, y } = snapFacetPt(p[0], p[1]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = colorByType ? 'rgba(230,238,248,0.4)' : DIAG_FILL;
    ctx.fill();
  });

  // 2. Edges — drawn on top with full weight for crisp lines
  edges.forEach(e => {
    const ec = colorByType ? (EC[e.type] || EC.unclassified) : null;
    const s = snapCoord(e.start[0], e.start[1]);
    const en = snapCoord(e.end[0], e.end[1]);
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(en.x, en.y);
    ctx.strokeStyle = colorByType ? ec.c : DIAG_EDGE;
    ctx.lineWidth = DIAG_STROKE;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  });

  // 2b. Vertex dots — slightly oversized to cover small gaps at joints
  const vertexDotR = Math.max(2.5, DIAG_STROKE * 0.85);
  const drawnDots = new Set();
  edges.forEach(e => {
    [e.start, e.end].forEach(p => {
      const { x, y } = snapCoord(p[0], p[1]);
      const key = `${x},${y}`;
      if (drawnDots.has(key)) return;
      drawnDots.add(key);
      ctx.beginPath();
      ctx.arc(x, y, vertexDotR, 0, Math.PI * 2);
      ctx.fillStyle = colorByType
        ? (EC[e.type] || EC.unclassified).c
        : DIAG_EDGE;
      ctx.fill();
    });
  });

  // 3a. Edge length labels — rotated along edge angle
  if (opts.showLengths) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    edges.forEach(e => {
      if (!e.length || e.length < 1) return;
      const s1 = snapCoord(e.start[0], e.start[1]);
      const s2 = snapCoord(e.end[0], e.end[1]);
      const x1 = s1.x, y1 = s1.y;
      const x2 = s2.x, y2 = s2.y;
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      let angle = Math.atan2(y2 - y1, x2 - x1);
      if (angle > Math.PI / 2)  angle -= Math.PI;
      if (angle < -Math.PI / 2) angle += Math.PI;
      const label = `${Math.round(e.length)}`;
      const offsetPx = 6;
      const nx = -Math.sin(angle) * offsetPx;
      const ny =  Math.cos(angle) * offsetPx;
      ctx.save();
      ctx.translate(mx + nx, my - ny);
      ctx.rotate(angle);
      ctx.font = '700 9px Helvetica, Arial, sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });
  }

  // 3b. Facet area labels (centered in each facet)
  if (opts.showAreas) {
    ctx.font = '700 13px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    (facets || []).forEach(f => {
      if (!f.latlngs || f.latlngs.length < 3 || !f.area) return;
      const cx = f.latlngs.reduce((s, p) => s + snapCoord(p[0], p[1]).x, 0) / f.latlngs.length;
      const cy = f.latlngs.reduce((s, p) => s + snapCoord(p[0], p[1]).y, 0) / f.latlngs.length;
      const label = nm(f.area);
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.roundRect(cx - tw / 2 - 4, cy - 8, tw + 8, 16, 3);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.fillText(label, cx, cy);
    });
  }

  // 3c. Facet pitch labels with direction arrows
  if (opts.showPitch) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    (facets || []).forEach(f => {
      if (!f.latlngs || f.latlngs.length < 3) return;
      const cx = f.latlngs.reduce((s, p) => s + snapCoord(p[0], p[1]).x, 0) / f.latlngs.length;
      const cy = f.latlngs.reduce((s, p) => s + snapCoord(p[0], p[1]).y, 0) / f.latlngs.length;
      const pitchVal = f.pitch || '-';
      const rise = pitchVal.includes('/') ? pitchVal.split('/')[0] : pitchVal;

      let dir = 'down';
      if (f.latlngs.length >= 3) {
        const aLat = f.latlngs.reduce((s, p) => s + p[0], 0) / f.latlngs.length;
        const aLng = f.latlngs.reduce((s, p) => s + p[1], 0) / f.latlngs.length;
        let maxDist = 0, peakPt = f.latlngs[0];
        f.latlngs.forEach(p => {
          const d = Math.abs(p[0] - aLat) + Math.abs(p[1] - aLng);
          if (d > maxDist) { maxDist = d; peakPt = p; }
        });
        const peak = snapCoord(peakPt[0], peakPt[1]);
        const dx = peak.x - cx;
        const dy = peak.y - cy;
        if (Math.abs(dx) > Math.abs(dy)) {
          dir = dx > 0 ? 'right' : 'left';
        } else {
          dir = dy > 0 ? 'down' : 'up';
        }
      }

      const arrows = { up: '\u2191', down: '\u2193', left: '\u2190', right: '\u2192' };
      const arrow = arrows[dir];
      ctx.fillStyle = '#1e293b';

      if (dir === 'up') {
        ctx.font = '400 11px Helvetica, Arial, sans-serif';
        ctx.fillText(arrow, cx, cy - 8);
        ctx.font = '700 12px Helvetica, Arial, sans-serif';
        ctx.fillText(rise, cx, cy + 6);
      } else if (dir === 'down') {
        ctx.font = '700 12px Helvetica, Arial, sans-serif';
        ctx.fillText(rise, cx, cy - 6);
        ctx.font = '400 11px Helvetica, Arial, sans-serif';
        ctx.fillText(arrow, cx, cy + 8);
      } else if (dir === 'left') {
        ctx.font = '400 11px Helvetica, Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(arrow, cx - 4, cy);
        ctx.font = '700 12px Helvetica, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(rise, cx + 2, cy);
        ctx.textAlign = 'center';
      } else {
        ctx.font = '700 12px Helvetica, Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(rise, cx - 2, cy);
        ctx.font = '400 11px Helvetica, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(arrow, cx + 4, cy);
        ctx.textAlign = 'center';
      }
    });
  }

  // 4. Compass rose (N/S/E/W) — rotated so N still points to true north
  if (opts.showCompass !== false) {
    const compassX = w - 30;
    const compassY = h - 30;
    const armLen = 14;
    ctx.save();
    ctx.translate(compassX, compassY);
    ctx.rotate(-rotAngle);  // counter-rotate so geographic N stays correct
    ctx.strokeStyle = '#94a3b8';
    ctx.fillStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -armLen);
    ctx.lineTo(0, armLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-armLen, 0);
    ctx.lineTo(armLen, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -armLen);
    ctx.lineTo(-3, -armLen + 5);
    ctx.moveTo(0, -armLen);
    ctx.lineTo(3, -armLen + 5);
    ctx.stroke();
    ctx.font = '700 8px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -armLen - 7);
    ctx.fillText('S', 0, armLen + 7);
    ctx.fillText('W', -armLen - 7, 0);
    ctx.fillText('E', armLen + 7, 0);
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}


/* ═══════════════════════════════════════════════════════════════════════
   PAGE 1 — ROOF REPORT (COVER) — Roofr-style centered layout
   ═══════════════════════════════════════════════════════════════════════ */
function page1(d) {
  return `
  <div style="${PAD}">
    <!-- Centered logo block -->
    <div style="text-align:center;margin-bottom:18px;padding-top:6px;">
      <div style="display:inline-flex;align-items:center;gap:10px;">
        <div style="width:44px;height:44px;border-radius:8px;background:${BLUE};display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:800;">T</div>
        <div style="text-align:left;">
          <div style="font-size:16px;font-weight:800;color:${DK};line-height:1.15;">Ahjin Roofing</div>
          <div style="font-size:16px;font-weight:800;color:${DK};line-height:1.15;">Roofing</div>
        </div>
      </div>
    </div>

    <!-- Title + subtitle centered -->
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:30px;font-weight:700;color:${BLUE};margin-bottom:4px;letter-spacing:-0.3px;">Roof Report</div>
      <div style="font-size:10px;color:${GR};font-weight:500;">Prepared by Ahjin Roofing</div>
    </div>

    <!-- Address left + Stats right -->
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px;">
      <div>
        <div style="font-size:12px;font-weight:700;color:${DK};margin-bottom:2px;">${esc(d.address)}</div>
        <div style="font-size:9px;color:${GR};">Building ${d.projectId || '1/1'}</div>
      </div>
      <div style="text-align:right;font-size:10px;line-height:1.6;">
        <div style="font-weight:700;color:${DK};">${nm(d.totalSlopedArea)} sqft</div>
        <div style="color:${GR};">${d.facetCount} facets</div>
        <div style="color:${GR};">Predominant pitch ${esc(d.primaryPitch)}</div>
      </div>
    </div>

    <!-- Satellite image -->
    <div style="border-radius:6px;overflow:hidden;border:1px solid ${LN};">
      ${img(d.mapImage, 700)}
    </div>
    <div style="font-size:7.5px;color:${GL};margin-top:4px;">Satellite imagery</div>
  </div>
  ${ftr(1)}`;
}


/* ═══════════════════════════════════════════════════════════════════════
   PAGE 2 — DIAGRAM (FULL-PAGE)
   ═══════════════════════════════════════════════════════════════════════ */
function page2(d) {
  const src = d.diagBase || d.mapImage;
  return `
  <div style="${PAD}">
    ${hdr}
    ${ttl('Diagram', d.address)}

    <div style="border-radius:6px;overflow:hidden;border:1px solid ${LN};margin-bottom:10px;">
      ${diag(src, 790)}
    </div>
  </div>
  ${ftr(2)}`;
}


/* ═══════════════════════════════════════════════════════════════════════
   PAGE 3 — LENGTH MEASUREMENT REPORT
   Legend at top → diagram with per-type colored edges + edge lengths
   ═══════════════════════════════════════════════════════════════════════ */
function page3(d) {
  // Build legend items — colored rectangle + label (Roofr grid style)
  const LEG = `display:flex;align-items:center;gap:6px;padding:2px 0;font-size:10px;color:${DK};`;
  const LBOX = `width:18px;height:8px;border-radius:2px;flex-shrink:0;`;
  const LDASH = `width:18px;height:0;border-top:3px dashed;flex-shrink:0;`;
  let legendItems = '';
  EDGE_ORDER.forEach(key => {
    const len = d.edgeTotals[key]?.length || 0;
    const ec = EC[key] || EC.unclassified;
    const isDashed = key === 'step_flashing' || key === 'wall_flashing';
    const box = isDashed
      ? `<span style="${LDASH}border-color:${ec.c};"></span>`
      : `<span style="${LBOX}background:${ec.c};"></span>`;
    legendItems += `<div style="${LEG}">${box}<span style="font-weight:600;">${ec.n}: ${ftIn(len)}</span></div>`;
  });

  return `
  <div style="${PAD}">
    ${hdr}
    ${ttl('Length measurement report', d.address)}

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px 24px;margin-bottom:14px;">
      ${legendItems}
    </div>

    <div style="border-radius:6px;overflow:hidden;border:1px solid ${LN};">
      ${diag(d.diagLengths, 660)}
    </div>

    <div style="margin-top:8px;font-size:7.5px;color:${GL};font-style:italic;">
      Measurements in diagram are rounded up for display. Some edge lengths may be hidden from diagram to avoid overcrowding.</div>
  </div>
  ${ftr(3)}`;
}


/* ═══════════════════════════════════════════════════════════════════════
   PAGE 4 — AREA MEASUREMENT REPORT
   Stats grid at top → diagram with facet area labels
   ═══════════════════════════════════════════════════════════════════════ */
function page4(d) {
  const stats = [
    ['Total roof area', `${nm(d.totalSlopedArea)} sqft`],
    ['Pitched roof area', `${nm(d.totalSlopedArea)} sqft`],
    ['Flat roof area', '0 sqft'],
    ['Two story area', '0 sqft'],
    ['Two layer area', '0 sqft'],
  ];
  const statsR = [
    ['Predominant pitch', esc(d.primaryPitch)],
    ['Predominant pitch area', `${nm(d.totalSlopedArea)} sqft`],
    ['Unspecified pitch area', '0 sqft'],
  ];

  const sL = stats.map(([k, v]) => `<div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:2px;"><span style="color:${GR};font-weight:500;">${k}:</span><span style="font-weight:700;color:${DK};">${v}</span></div>`).join('');
  const sR = statsR.map(([k, v]) => `<div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:2px;"><span style="color:${GR};font-weight:500;">${k}:</span><span style="font-weight:700;color:${DK};">${v}</span></div>`).join('');

  return `
  <div style="${PAD}">
    ${hdr}
    ${ttl('Area measurement report', d.address)}

    <div style="display:flex;gap:24px;margin-bottom:14px;">
      <div style="flex:1;">${sL}</div>
      <div style="flex:1;">${sR}</div>
    </div>

    <div style="border-radius:6px;overflow:hidden;border:1px solid ${LN};">
      ${diag(d.diagAreas, 620)}
    </div>

    <div style="margin-top:8px;font-size:7px;color:${GL};font-style:italic;line-height:1.5;">
      Area measurements in diagram are rounded. The totals at the top of the page are the sums of the exact measurements, which are then rounded. Deleted facets (skylights, chimneys, etc.) are designated with a dashed line and are excluded from the calculations.</div>
  </div>
  ${ftr(4)}`;
}


/* ═══════════════════════════════════════════════════════════════════════
   PAGE 5 — PITCH & DIRECTION MEASUREMENT REPORT
   Diagram with pitch labels + direction arrows inside each facet
   ═══════════════════════════════════════════════════════════════════════ */
function page5(d) {
  return `
  <div style="${PAD}">
    ${hdr}
    ${ttl('Pitch & direction measurement report', d.address)}

    <div style="border-radius:6px;overflow:hidden;border:1px solid ${LN};">
      ${diag(d.diagPitch, 740)}
    </div>

    <div style="margin-top:8px;font-size:7.5px;color:#dc2626;font-style:italic;">
      Deleted facets are designated with a dashed line and do not have a pitch.</div>
  </div>
  ${ftr(5)}`;
}


/* ═══════════════════════════════════════════════════════════════════════
   PAGE 6 — REPORT SUMMARY
   Thumbnail diagram (left) + Measurements table (right) + Waste table
   ═══════════════════════════════════════════════════════════════════════ */
function page6(d) {
  const mItems = [
    ['Total roof area',      `${nm(d.totalSlopedArea)} sqft`],
    ['Total pitched area',   `${nm(d.totalSlopedArea)} sqft`],
    ['Total flat area',      '0 sqft'],
    ['Total roof facets',    `${d.facetCount} facets`],
    ['Predominant pitch',    esc(d.primaryPitch)],
    ['Total eaves',          ftIn(d.eLen)],
    ['Total valleys',        ftIn(d.vLen)],
    ['Total hips',           ftIn(d.hLen)],
    ['Total ridges',         ftIn(d.gLen)],
    ['Total rakes',          ftIn(d.rLen)],
    ['Total wall flashing',  ftIn(d.wfLen)],
    ['Total step flashing',  ftIn(d.edgeTotals.step_flashing?.length || 0)],
    ['Total transitions',    ftIn(d.edgeTotals.transition?.length || 0)],
    ['Total parapet wall',   ftIn(d.edgeTotals.parapet_wall?.length || 0)],
    ['Total unspecified',    ftIn(d.edgeTotals.unclassified?.length || 0)],
    ['Hips + ridges',        ftIn(d.hrLen)],
    ['Eaves + rakes',        ftIn(d.erLen)],
  ];
  const mRows = mItems.map(([k, v], i) => {
    const bg = i % 2 === 0 ? `background:${RA};` : '';
    return `<tr><td style="padding:5px 10px;font-size:9.5px;color:${GR};${bg}">${k}</td><td style="padding:5px 10px;font-size:9.5px;text-align:right;font-weight:700;color:${DK};${bg}">${v}</td></tr>`;
  }).join('');

  // Waste table: 0%, 10%, 12%, 15%, 17%, 20%, 22% (Roofr style, 12% recommended)
  const wastePcts = [0, 10, 12, 15, 17, 20, 22];
  const rec = 12;
  const wHdr = wastePcts.map(p => {
    const isRec = p === rec;
    const bg = isRec ? 'background:#059669;color:#fff;' : `background:${BLUE};color:#fff;`;
    return `<th style="padding:4px 3px;text-align:center;font-size:8px;font-weight:700;${bg}border:none;">${p}%</th>`;
  }).join('');
  const wArea = wastePcts.map(p => {
    const v = d.totalSlopedArea * (1 + p / 100);
    const isRec = p === rec;
    const bg = isRec ? 'background:#ecfdf5;font-weight:700;color:#059669;' : '';
    return `<td style="padding:4px 3px;text-align:center;font-size:8.5px;border-bottom:1px solid ${LN};${bg}">${nm(v)}</td>`;
  }).join('');
  const wSq = wastePcts.map(p => {
    const v = d.totalSlopedArea * (1 + p / 100) / 100;
    const isRec = p === rec;
    const bg = isRec ? 'background:#ecfdf5;font-weight:700;color:#059669;' : '';
    return `<td style="padding:4px 3px;text-align:center;font-size:8.5px;font-weight:700;border-bottom:1px solid ${LN};${bg}">${d1(v)}</td>`;
  }).join('');

  return `
  <div style="${PAD}">
    ${hdr}
    ${ttl('Report summary', d.address)}

    <div style="display:flex;gap:14px;margin-bottom:12px;">
      <div style="flex:1;border-radius:6px;overflow:hidden;border:1px solid ${LN};">
        ${diag(d.diagThumb, 400)}
      </div>
      <div style="flex:1;">
        <div style="border:1px solid ${LN};border-radius:6px;overflow:hidden;">
          <div style="background:${RA};padding:6px 10px;font-size:10px;font-weight:700;color:${BLUE};text-align:center;border-bottom:1px solid ${LN};">Measurements</div>
          <table style="width:100%;border-collapse:collapse;">${mRows}</table>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:10px;margin-bottom:10px;">
      <div style="flex:0 0 100px;padding:6px 10px;border:1px solid ${LN};border-radius:4px;">
        <div style="font-size:8px;color:${BLUE};font-weight:600;">Pitch</div>
        <div style="font-size:13px;font-weight:800;color:${DK};">${esc(d.primaryPitch)}</div>
      </div>
      <div style="flex:1;padding:6px 10px;border:1px solid ${LN};border-radius:4px;">
        <div style="font-size:8px;color:${GR};font-weight:600;">Area (sqft)</div>
        <div style="font-size:13px;font-weight:800;color:${DK};">${nm(d.totalSlopedArea)}</div>
      </div>
      <div style="flex:1;padding:6px 10px;border:1px solid ${LN};border-radius:4px;">
        <div style="font-size:8px;color:${GR};font-weight:600;">Squares</div>
        <div style="font-size:13px;font-weight:800;color:${DK};">${d1(d.totalSquares)}</div>
      </div>
    </div>

    <div style="text-align:center;font-size:8px;color:#059669;font-weight:700;margin-bottom:4px;">Recommended</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th style="padding:4px 6px;text-align:left;font-size:8px;font-weight:700;color:#fff;background:${BLUE};border:none;">Waste %</th>
        ${wHdr}
      </tr></thead>
      <tbody>
        <tr><td style="${TD}font-weight:600;font-size:9px;">Area (sqft)</td>${wArea}</tr>
        <tr><td style="${TD}font-weight:600;font-size:9px;">Squares</td>${wSq}</tr>
      </tbody>
    </table>

    <div style="margin-top:6px;font-size:7px;color:${GL};font-style:italic;line-height:1.5;">
      Recommended waste is based on an asphalt shingle roof with a closed valley system (if applicable). Several other factors are involved
      in determining which waste percentage to use, including the complexity of the roof and individual roof application style. You will also
      need to calculate the post-waste quantity of other materials needed (hip and ridge caps, starter shingle, etc.).</div>
  </div>
  ${ftr(6)}`;
}


/* ═══════════════════════════════════════════════════════════════════════
   PAGE 7 — MATERIAL CALCULATIONS
   Full brand breakdown table with multiple waste columns
   ═══════════════════════════════════════════════════════════════════════ */
function page7(d) {
  const matWaste = [0, 10, 12, 15];
  const recIdx = 2; // 12% is recommended
  const adj = matWaste.map(p => {
    const f = 1 + p / 100;
    return {
      pct: p, area: d.totalSlopedArea * f, sq: (d.totalSlopedArea * f) / 100,
      erFt: d.erLen * f, iwFt: (d.eLen + d.vLen + d.wfLen) * f,
      synSq: (d.totalSlopedArea * f) / 100, capFt: d.hrLen * f,
    };
  });

  const cats = [
    {
      label: 'Shingle (total sqft)',
      hdrVals: adj.map(a => `${nm(a.area)} sqft`),
      brands: [
        { name: 'IKO - Cambridge', unit: 'bundle', calc: a => Math.ceil(a.sq * 3) },
        { name: 'CertainTeed - Landmark', unit: 'bundle', calc: a => Math.ceil(a.area / 32.3) },
        { name: 'GAF - Timberline', unit: 'bundle', calc: a => Math.ceil(a.area / 32.3) },
        { name: 'Owens Corning - Duration', unit: 'bundle', calc: a => Math.ceil(a.area / 32.3) },
        { name: 'Atlas - Pristine', unit: 'bundle', calc: a => Math.ceil(a.sq * 3) },
      ],
    },
    {
      label: 'Starter (eaves + rakes)',
      hdrVals: adj.map(a => `${Math.round(a.erFt)} ft`),
      brands: [
        { name: 'IKO - Leading Edge Plus', unit: 'bundle', calc: a => Math.ceil(a.erFt / 105) },
        { name: 'CertainTeed - SwiftStart', unit: 'bundle', calc: a => Math.ceil(a.erFt / 104) },
        { name: 'GAF - Pro-Start', unit: 'bundle', calc: a => Math.ceil(a.erFt / 105) },
        { name: 'Owens Corning - Starter Strip', unit: 'bundle', calc: a => Math.ceil(a.erFt / 105) },
        { name: 'Atlas - Pro-Cut', unit: 'bundle', calc: a => Math.ceil(a.erFt / 105) },
      ],
    },
    {
      label: 'Ice and Water (eaves + valleys + flashings)',
      hdrVals: adj.map(a => `${Math.round(a.iwFt)} ft`),
      brands: [
        { name: 'IKO - StormShield', unit: 'roll', calc: a => Math.ceil(a.iwFt / 65) },
        { name: 'CertainTeed - WinterGuard', unit: 'roll', calc: a => Math.ceil(a.iwFt / 56) },
        { name: 'GAF - WeatherWatch', unit: 'roll', calc: a => Math.ceil(a.iwFt / 56) },
        { name: 'Owens Corning - WeatherLock', unit: 'roll', calc: a => Math.ceil(a.iwFt / 56) },
        { name: 'Atlas - Weathermaster', unit: 'roll', calc: a => Math.ceil(a.iwFt / 56) },
      ],
    },
    {
      label: 'Synthetic (total sqft; no laps)',
      hdrVals: adj.map(a => `${nm(a.area)} sqft`),
      brands: [
        { name: 'IKO - Stormtite', unit: 'roll', calc: a => Math.ceil(a.synSq / 10) },
        { name: 'CertainTeed - RoofRunner', unit: 'roll', calc: a => Math.ceil(a.synSq / 10) },
        { name: 'GAF - Deck-Armor', unit: 'roll', calc: a => Math.ceil(a.synSq / 10) },
        { name: 'Owens Corning - RhinoRoof', unit: 'roll', calc: a => Math.ceil(a.synSq / 10) },
        { name: 'Atlas - Summit', unit: 'roll', calc: a => Math.ceil(a.synSq / 10) },
      ],
    },
    {
      label: 'Capping (hips + ridges)',
      hdrVals: adj.map(a => `${Math.round(a.capFt)} ft`),
      brands: [
        { name: 'IKO - Hip and Ridge', unit: 'bundle', calc: a => Math.ceil(a.capFt / 31) },
        { name: 'CertainTeed - Shadow Ridge', unit: 'bundle', calc: a => Math.ceil(a.capFt / 20) },
        { name: 'GAF - Seal-A-Ridge', unit: 'bundle', calc: a => Math.ceil(a.capFt / 20) },
        { name: 'Owens Corning - DecoRidge', unit: 'bundle', calc: a => Math.ceil(a.capFt / 20) },
        { name: 'Atlas - Pro-Cut H&R', unit: 'bundle', calc: a => Math.ceil(a.capFt / 20) },
      ],
    },
  ];

  // Build table rows
  let matRows = '';
  cats.forEach(cat => {
    // Category header row
    matRows += `<tr><td style="background:${RA};font-weight:700;color:${DK};padding:4px 8px;font-size:9px;border-bottom:1px solid ${LN};" colspan="2">${cat.label}</td>`;
    cat.hdrVals.forEach((v, vi) => {
      const isRec = vi === recIdx;
      const hl = isRec ? 'background:#ecfdf5;color:#059669;' : `background:${RA};`;
      matRows += `<td style="${hl}font-weight:700;color:${DK};padding:4px 6px;font-size:8px;text-align:right;border-bottom:1px solid ${LN};">${v}</td>`;
    });
    matRows += '</tr>';
    // Brand rows
    cat.brands.forEach((brand, bi) => {
      const bg = bi % 2 !== 0 ? `background:${RA};` : '';
      matRows += `<tr><td style="padding:3px 8px 3px 16px;font-size:9px;border-bottom:1px solid ${LN};${bg}">${brand.name}</td>`;
      matRows += `<td style="padding:3px 6px;text-align:center;font-size:8px;border-bottom:1px solid ${LN};${bg}">${brand.unit}</td>`;
      adj.forEach((a, ai) => {
        const isRec = ai === recIdx;
        const hl = isRec ? 'background:#ecfdf5;font-weight:700;color:#059669;' : '';
        matRows += `<td style="padding:3px 6px;text-align:right;font-size:9px;border-bottom:1px solid ${LN};${bg}${hl}">${brand.calc(a)}</td>`;
      });
      matRows += '</tr>';
    });
  });

  // Other section
  const vCount = Math.max(1, Math.ceil((d.vLen || 0) / 8));
  matRows += `<tr><td style="background:${RA};font-weight:700;color:${DK};padding:4px 8px;font-size:9px;border-bottom:1px solid ${LN};" colspan="${2 + matWaste.length}">Other</td></tr>`;
  matRows += `<tr><td style="padding:3px 8px 3px 16px;font-size:9px;border-bottom:1px solid ${LN};">8' Valley (no laps)</td><td style="padding:3px 6px;text-align:center;font-size:8px;border-bottom:1px solid ${LN};">sheet</td>`;
  adj.forEach((_, ai) => {
    const isRec = ai === recIdx;
    const hl = isRec ? 'background:#ecfdf5;font-weight:700;color:#059669;' : '';
    matRows += `<td style="padding:3px 6px;text-align:right;font-size:9px;border-bottom:1px solid ${LN};${hl}">${vCount}</td>`;
  });
  matRows += '</tr>';
  matRows += `<tr><td style="padding:3px 8px 3px 16px;font-size:9px;border-bottom:1px solid ${LN};">10' Drip Edge (eaves + rakes; no laps)</td><td style="padding:3px 6px;text-align:center;font-size:8px;border-bottom:1px solid ${LN};">sheet</td>`;
  adj.forEach((a, ai) => {
    const isRec = ai === recIdx;
    const hl = isRec ? 'background:#ecfdf5;font-weight:700;color:#059669;' : '';
    matRows += `<td style="padding:3px 6px;text-align:right;font-size:9px;border-bottom:1px solid ${LN};${hl}">${Math.ceil(a.erFt / 10)}</td>`;
  });
  matRows += '</tr>';

  return `
  <div style="${PAD}">
    ${hdr}
    ${ttl('Material calculations', d.address)}

    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th style="${TH}padding-left:8px;font-size:8px;">Product</th>
        <th style="${TH}text-align:center;font-size:8px;">Unit</th>
        ${matWaste.map((p, i) => {
          const isRec = i === recIdx;
          const bg = isRec ? 'background:#059669;' : '';
          return `<th style="${TH}text-align:right;font-size:8px;${bg}">Waste (${p}%)</th>`;
        }).join('')}
      </tr></thead>
      <tbody>${matRows}</tbody>
    </table>

    <div style="margin-top:6px;font-size:7px;color:${GL};font-style:italic;line-height:1.5;">
      These calculations are estimates and are not guaranteed. Always double check calculations before ordering materials. Estimates are
      based off of the total pitched area (i.e., flat area is excluded).</div>
  </div>
  ${ftr(7)}`;
}


/* ═══════════════════════════════════════════════════════════════════════
   MAIN EXPORT — Generate 7-page PDF
   ═══════════════════════════════════════════════════════════════════════ */
export async function generatePDFReport({ address, facets, edges, mapElement, projectId, mapBearing = 0 }) {
  const facetList = facets || [];
  const edgeList  = edges || [];

  /* ── Aggregate measurements ───────────────────────────────────────── */
  const totalFlatArea   = facetList.reduce((s, f) => s + (f.area || 0), 0);
  const totalSlopedArea = facetList.reduce((s, f) => s + (f.area || 0) * slopeFactor(f.pitch), 0);
  const totalSquares    = totalSlopedArea / 100;

  const pitchCounts = {};
  facetList.forEach(f => {
    if (f.pitch && f.pitch !== '0/12') pitchCounts[f.pitch] = (pitchCounts[f.pitch] || 0) + 1;
  });
  const primaryPitch = Object.entries(pitchCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const edgeTotals = {};
  edgeList.forEach(e => {
    const t = e.type || 'unclassified';
    if (!edgeTotals[t]) edgeTotals[t] = { count: 0, length: 0 };
    edgeTotals[t].count++;
    edgeTotals[t].length += e.length || 0;
  });

  const pitchGroups = {};
  facetList.forEach(f => {
    const p = f.pitch && f.pitch !== '0/12' ? f.pitch : 'Unassigned';
    if (!pitchGroups[p]) pitchGroups[p] = { count: 0, flatArea: 0, slopedArea: 0 };
    pitchGroups[p].count++;
    pitchGroups[p].flatArea += f.area || 0;
    pitchGroups[p].slopedArea += (f.area || 0) * slopeFactor(f.pitch);
  });

  const pitchEntries = Object.entries(pitchGroups)
    .sort((a, b) => (b[1].slopedArea || 0) - (a[1].slopedArea || 0));

  const eLen  = edgeTotals.eave?.length || 0;
  const rLen  = edgeTotals.rake?.length || 0;
  const vLen  = edgeTotals.valley?.length || 0;
  const hLen  = edgeTotals.hip?.length || 0;
  const gLen  = edgeTotals.ridge?.length || 0;
  const wfLen = edgeTotals.wall_flashing?.length || 0;
  const erLen = eLen + rLen;
  const hrLen = hLen + gLen;
  const totalEdges = Object.values(edgeTotals).reduce((s, v) => s + (v.count || 0), 0);
  const totalLen   = Object.values(edgeTotals).reduce((s, v) => s + (v.length || 0), 0);
  const activeEdges = EDGE_ORDER.filter(t => edgeTotals[t] && edgeTotals[t].count > 0);

  const facetDetails = facetList.map(f => ({
    area: f.area || 0,
    pitch: f.pitch || 'Unassigned',
    sf: slopeFactor(f.pitch),
  }));

  /* ── Map screenshot ───────────────────────────────────────────────── */
  let mapImage = '';
  if (mapElement) {
    try {
      const canvas = await html2canvas(mapElement, {
        useCORS: true, allowTaint: true, scale: 3, logging: false,
        backgroundColor: '#0f172a',
        ignoreElements: el => {
          const c = typeof el.className === 'string' ? el.className : '';
          return c.includes('map-layer-mgr') || c.includes('map-measure-btn')
              || c.includes('bottom-toolbar') || c.includes('leaflet-control');
        },
      });
      mapImage = canvas.toDataURL('image/jpeg', 0.92);
    } catch (err) {
      console.warn('[PDF] Map screenshot failed:', err);
    }
  }

  /* ── Render diagram variants (Roofr-style) ─────────────────────── */
  const diagBase    = renderDiagram(edgeList, facetList, 714, 790, { bearing: mapBearing });
  const diagLengths = renderDiagram(edgeList, facetList, 714, 660, { showLengths: true, colorByType: true, bearing: mapBearing });
  const diagAreas   = renderDiagram(edgeList, facetList, 714, 620, { showAreas: true, bearing: mapBearing });
  const diagPitch   = renderDiagram(edgeList, facetList, 714, 740, { showPitch: true, bearing: mapBearing });
  const diagThumb   = renderDiagram(edgeList, facetList, 340, 400, { strokeWidth: 1.8, showCompass: false, bearing: mapBearing });
  console.log('[PDF] Diagrams rendered:', diagBase ? 'OK' : 'empty');

  /* ── Data object ──────────────────────────────────────────────────── */
  const d = {
    address, mapImage, diagBase, diagLengths, diagAreas, diagPitch, diagThumb,
    totalSlopedArea, totalFlatArea, totalSquares,
    primaryPitch, facetCount: facetList.length,
    edgeTotals, pitchGroups, pitchEntries, facetDetails,
    projectId: projectId || '',
    eLen, rLen, vLen, hLen, gLen, wfLen, erLen, hrLen,
    totalEdges, totalLen, activeEdges,
  };

  /* ── Build 7 off-screen page divs ─────────────────────────────────── */
  const wrapper = document.createElement('div');
  wrapper.id = 'trj-report-wrapper';
  wrapper.style.cssText = 'position:absolute;left:-3000px;top:0;z-index:-1;';

  const pages = [page1, page2, page3, page4, page5, page6, page7];
  wrapper.innerHTML = pages
    .map((fn, i) => `<div id="trj-page-${i + 1}" style="${PAGE}">${fn(d)}</div>`)
    .join('');

  document.body.appendChild(wrapper);

  /* ── Wait for all <img> tags to finish loading ─────────────────── */
  await new Promise(resolve => {
    const imgs = wrapper.querySelectorAll('img');
    if (imgs.length === 0) { resolve(); return; }
    let loaded = 0;
    const check = () => { loaded++; if (loaded >= imgs.length) resolve(); };
    imgs.forEach(im => {
      if (im.complete) { check(); return; }
      im.onload = check;
      im.onerror = check;
    });
    setTimeout(resolve, 5000);
  });

  /* ── Capture each of the 7 divs → jsPDF ─────────────────────────── */
  console.log('[PDF] Starting 7-page capture (scale: 3)...');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  for (let i = 1; i <= 7; i++) {
    const pageEl = document.getElementById(`trj-page-${i}`);
    if (!pageEl) { console.warn(`[PDF] trj-page-${i} not found — skipping`); continue; }
    const canvas = await html2canvas(pageEl, {
      scale: 3, useCORS: true, allowTaint: true,
      backgroundColor: '#ffffff', logging: false,
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    if (i > 1) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    console.log(`[PDF] Page ${i}/7 captured`);
  }

  /* ── Download ─────────────────────────────────────────────────────── */
  const addrSlug = address
    ? address.split(',')[0].replace(/[^a-zA-Z0-9]/g, '_')
    : 'Report';
  pdf.save(`Ahjin_Roofing_${addrSlug}.pdf`);

  /* ── Cleanup ──────────────────────────────────────────────────────── */
  document.body.removeChild(wrapper);
}
