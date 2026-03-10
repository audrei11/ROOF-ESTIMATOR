/**
 * Precision Roofing — Puppeteer HTML Report Template
 * Professional 7-page roof report (A4: 210mm × 297mm)
 *
 * Pages:
 *   1. Roof Report (Title / Cover)
 *   2. Diagram (full-page visual + color legend pills)
 *   3. Length Measurement Report (edge diagram + summary table)
 *   4. Area Measurement Report (facet labels + flat vs sloped)
 *   5. Pitch & Measurement Report (pitch breakdown + visual)
 *   6. Report Summary (executive summary + waste + signature)
 *   7. Material Calculations (order list + brand options)
 */

/* ── Design tokens ─────────────────────────────────────────────────── */
const BLUE      = '#0047AB';
const BLUE_DARK = '#003580';
const BLUE_LT   = '#e8f0fe';
const DARK      = '#1a1a2e';
const TEXT       = '#374151';
const GRAY      = '#6b7280';
const GRAY_LT   = '#9ca3af';
const LINE       = '#e5e7eb';
const ROW_ALT   = '#f9fafb';
const REC_BG    = '#ecfdf5';
const REC_CLR   = '#059669';
const WHITE     = '#ffffff';

const EC = {
  eave:          { color: '#16a34a', name: 'Eaves' },
  ridge:         { color: '#14b8a6', name: 'Ridges' },
  valley:        { color: '#ef4444', name: 'Valleys' },
  hip:           { color: '#a855f7', name: 'Hips' },
  rake:          { color: '#f59e0b', name: 'Rakes' },
  wall_flashing: { color: '#3b82f6', name: 'Wall Flashing' },
  step_flashing: { color: '#ec4899', name: 'Step Flashing' },
  transition:    { color: '#8b5cf6', name: 'Transitions' },
  parapet_wall:  { color: '#f97316', name: 'Parapet Wall' },
  unclassified:  { color: '#94a3b8', name: 'Unspecified' },
};

/* ── Helpers ───────────────────────────────────────────────────────── */
const ftIn = (feet) => {
  if (!feet || feet <= 0) return '0ft 0in';
  const f = Math.floor(feet);
  const i = Math.round((feet - f) * 12);
  return `${f}ft ${i}in`;
};
const num   = (n) => Math.round(n).toLocaleString();
const dec1  = (n) => Number(n).toFixed(1);
const esc   = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const today = () => {
  const d = new Date();
  return d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
};

/* ── Reusable CSS ──────────────────────────────────────────────────── */
const css = () => `
  @page {
    size: 210mm 297mm;
    margin: 0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    color: ${TEXT};
    font-size: 11px;
    line-height: 1.4;
  }
  table { border-spacing: 0; border-collapse: collapse; }

  .page {
    width: 210mm;
    height: 297mm;
    padding: 36px 40px 44px;
    position: relative;
    page-break-after: always;
    overflow: hidden;
    background: #fff;
  }
  .page:last-child { page-break-after: avoid; }

  .accent-bar {
    position: absolute; top: 0; left: 0; right: 0;
    height: 5px; background: linear-gradient(90deg, ${BLUE} 0%, ${BLUE_DARK} 100%);
  }
  .page-inner { padding-top: 8px; height: calc(100% - 36px); overflow: hidden; }

  /* Footer — every page */
  .footer {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 32px; padding: 0 40px;
    display: flex; align-items: center; justify-content: space-between;
    border-top: 2px solid ${BLUE};
    font-size: 8px; color: ${GRAY};
    background: ${WHITE};
  }
  .footer-left { font-weight: 600; color: ${DARK}; }
  .footer-right { color: ${GRAY_LT}; }

  /* Sub-page header (pages 2-7) */
  .sub-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 12px; padding-bottom: 8px;
    border-bottom: 2px solid ${BLUE};
  }
  .sub-header .brand {
    font-size: 13px; font-weight: 800; color: ${BLUE};
    letter-spacing: 0.1em; text-transform: uppercase;
  }
  .sub-header .prepared {
    font-size: 8.5px; font-weight: 600; color: ${GRAY};
    letter-spacing: 0.06em; text-transform: uppercase;
  }
  .page-title {
    font-size: 22px; font-weight: 700; color: ${BLUE};
    margin-bottom: 4px;
  }
  .page-address {
    font-size: 10px; color: ${GRAY};
    margin-bottom: 10px;
  }
  .divider {
    height: 1px; background: ${LINE}; margin-bottom: 12px;
  }

  /* Section title */
  .sec-title {
    font-size: 11px; font-weight: 800; color: ${DARK};
    letter-spacing: 0.1em; text-transform: uppercase;
    margin-bottom: 8px;
  }

  /* Blue table header */
  .tbl { width: 100%; }
  .tbl th {
    padding: 7px 10px; text-align: left;
    font-size: 9px; font-weight: 700; color: #fff;
    letter-spacing: 0.06em; text-transform: uppercase;
    background: ${BLUE}; border: none; white-space: nowrap;
  }
  .tbl td {
    padding: 6px 10px; font-size: 10px;
    border-bottom: 1px solid ${LINE};
  }
  .tbl .alt { background: ${ROW_ALT}; }
  .tbl .foot td {
    background: ${BLUE_DARK}; color: #fff;
    font-weight: 700; border: none;
  }

  .r { text-align: right; }
  .c { text-align: center; }
  .b { font-weight: 700; }
  .bc { font-weight: 700; color: ${BLUE}; }

  /* Map image */
  .map-img {
    width: 100%; display: block;
    border: 1px solid ${LINE}; border-radius: 4px;
    object-fit: cover;
  }

  /* Legend pills */
  .legend-pills {
    display: flex; flex-wrap: wrap; gap: 8px;
    padding: 12px 0;
  }
  .legend-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 14px; border-radius: 20px;
    font-size: 10px; font-weight: 600; color: ${DARK};
    background: ${ROW_ALT}; border: 1px solid ${LINE};
  }
  .legend-dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  }

  /* Stat tiles (cover page) */
  .stat-tiles {
    display: flex; gap: 16px; margin: 20px 0;
  }
  .stat-tile {
    flex: 1; padding: 18px 16px; border-radius: 8px;
    text-align: center; border: 2px solid ${BLUE};
    background: linear-gradient(135deg, ${BLUE_LT} 0%, #f0f4ff 100%);
  }
  .stat-tile-value {
    font-size: 26px; font-weight: 800; color: ${BLUE};
    line-height: 1.2;
  }
  .stat-tile-label {
    font-size: 10px; font-weight: 600; color: ${GRAY};
    text-transform: uppercase; letter-spacing: 0.08em;
    margin-top: 4px;
  }

  /* Stat rows (area page) */
  .stat-grid { display: flex; gap: 24px; margin-bottom: 14px; }
  .stat-col { flex: 1; }
  .stat-row {
    display: flex; justify-content: space-between;
    padding: 5px 0; border-bottom: 1px solid ${LINE};
    font-size: 10.5px;
  }
  .stat-label { color: ${GRAY}; }
  .stat-value { font-weight: 700; color: ${DARK}; }

  /* Horizontal waste table */
  .waste-tbl th, .waste-tbl td {
    padding: 5px 6px; text-align: center; font-size: 9.5px;
  }
  .waste-tbl th { font-size: 8.5px; }
  .waste-tbl .rec-bg { background: ${REC_BG}; color: ${REC_CLR}; }
  .waste-tbl .rec-head { background: ${REC_CLR}; color: #fff; }
  .waste-tbl .lbl { text-align: left; font-weight: 600; color: ${DARK}; padding-left: 10px; }

  /* Material table */
  .mat-cat {
    background: ${ROW_ALT}; font-weight: 700; color: ${DARK};
    border-bottom: 1px solid ${LINE};
  }

  /* Pitch bar chart */
  .pitch-bar-row {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 6px; font-size: 10px;
  }
  .pitch-bar-label {
    width: 50px; text-align: right; font-weight: 700; color: ${DARK};
    flex-shrink: 0;
  }
  .pitch-bar-track {
    flex: 1; height: 18px; background: ${ROW_ALT};
    border-radius: 3px; overflow: hidden; border: 1px solid ${LINE};
  }
  .pitch-bar-fill {
    height: 100%; background: linear-gradient(90deg, ${BLUE} 0%, #2563eb 100%);
    border-radius: 3px 0 0 3px; min-width: 2px;
    display: flex; align-items: center; justify-content: flex-end;
    padding-right: 6px; font-size: 8px; color: #fff; font-weight: 700;
  }
  .pitch-bar-value {
    width: 80px; font-size: 9px; color: ${GRAY}; flex-shrink: 0;
  }

  /* Signature section */
  .sig-section {
    margin-top: 16px; padding-top: 12px;
    border-top: 1px solid ${LINE};
  }
  .sig-line {
    display: flex; align-items: flex-end; gap: 24px;
    margin-top: 24px;
  }
  .sig-field {
    flex: 1; border-bottom: 1px solid ${DARK};
    padding-bottom: 4px; font-size: 9px; color: ${GRAY};
  }
`;

const footer = (pg, total, shortAddr) => `
  <div class="footer">
    <span class="footer-left">Precision Roofing</span>
    <span class="footer-right">${esc(shortAddr)} &middot; Page ${pg} of ${total}</span>
  </div>`;

const subHeader = () => `
  <div class="sub-header">
    <div class="brand">Precision Roofing</div>
    <div class="prepared">Prepared by Precision Roofing</div>
  </div>`;

const noImage = '<div style="height:200px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px;border-radius:4px;">No image available</div>';


/* ═══════════════════════════════════════════════════════════════════════
   MAIN EXPORT — Build complete HTML document from report data
   ═══════════════════════════════════════════════════════════════════════ */

function buildReportHTML(data) {
  const {
    address = '',
    mapImage = '',
    totalSlopedArea = 0,
    totalFlatArea = 0,
    totalSquares = 0,
    primaryPitch = 'N/A',
    facetCount = 0,
    edgeTotals = {},
    pitchGroups = {},
    facetDetails = [],
    projectId = '',
  } = data;

  const shortAddr = address.split(',').slice(0, 2).join(',').trim();
  const TOTAL_PAGES = 7;
  const dateStr = today();
  const projId = projectId || `TR-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  /* ── Derived values ──────────────────────────────────────────────── */
  const eLen  = edgeTotals.eave?.length           || 0;
  const rLen  = edgeTotals.rake?.length           || 0;
  const vLen  = edgeTotals.valley?.length         || 0;
  const hLen  = edgeTotals.hip?.length            || 0;
  const gLen  = edgeTotals.ridge?.length          || 0;
  const wfLen = edgeTotals.wall_flashing?.length  || 0;
  const sfLen = edgeTotals.step_flashing?.length  || 0;
  const trLen = edgeTotals.transition?.length     || 0;
  const pwLen = edgeTotals.parapet_wall?.length   || 0;
  const ucLen = edgeTotals.unclassified?.length   || 0;
  const erLen = eLen + rLen;
  const hrLen = hLen + gLen;

  const totalEdges = Object.values(edgeTotals).reduce((s, v) => s + (v.count || 0), 0);
  const totalLen   = Object.values(edgeTotals).reduce((s, v) => s + (v.length || 0), 0);

  const edgeOrder = [
    'eave','ridge','valley','hip','rake',
    'wall_flashing','step_flashing','transition','parapet_wall','unclassified',
  ];
  const activeEdges = edgeOrder.filter(t => edgeTotals[t] && edgeTotals[t].count > 0);

  const pitchEntries = Object.entries(pitchGroups)
    .sort((a, b) => (b[1].slopedArea || 0) - (a[1].slopedArea || 0));



  /* ═══════════════════════════════════════════════════════════════════
     PAGE 1 — ROOF REPORT (TITLE / COVER PAGE)
     ═══════════════════════════════════════════════════════════════════ */
  const page1 = `
  <div class="page">
    <div class="accent-bar"></div>
    <div class="page-inner">

      <!-- Logo / Brand -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
        <div>
          <div style="font-size:36px;font-weight:800;color:${BLUE};line-height:1.05;letter-spacing:-0.02em;">
            Precision Roofing</div>
          <div style="font-size:11px;color:${GRAY};margin-top:2px;letter-spacing:0.04em;">
            PROFESSIONAL ROOF REPORT</div>
        </div>
        <div style="text-align:right;font-size:10px;color:${GRAY};line-height:1.6;">
          <div style="font-weight:700;color:${DARK};">Report Date</div>
          <div>${dateStr}</div>
          <div style="font-weight:700;color:${DARK};margin-top:4px;">Project ID</div>
          <div>${esc(projId)}</div>
        </div>
      </div>

      <!-- Address -->
      <div style="background:${BLUE};color:#fff;padding:10px 16px;border-radius:6px;margin:10px 0 16px;">
        <div style="font-size:8px;text-transform:uppercase;letter-spacing:0.1em;opacity:0.75;">Property Address</div>
        <div style="font-size:14px;font-weight:700;margin-top:2px;">${esc(address)}</div>
      </div>

      <!-- 3 Primary Stat Tiles -->
      <div class="stat-tiles">
        <div class="stat-tile">
          <div class="stat-tile-value">${num(totalSlopedArea)}</div>
          <div class="stat-tile-label">Total Sqft</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-value">${facetCount}</div>
          <div class="stat-tile-label">Facets</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile-value">${esc(primaryPitch)}</div>
          <div class="stat-tile-label">Predominant Pitch</div>
        </div>
      </div>

      <!-- Full-width Aerial View -->
      <div style="margin-top:8px;">
        ${mapImage
          ? `<img src="${mapImage}" style="width:100%;display:block;max-height:520px;object-fit:cover;border-radius:6px;border:1px solid ${LINE};" />`
          : noImage}
      </div>
    </div>
    ${footer(1, TOTAL_PAGES, shortAddr)}
  </div>`;


  /* ═══════════════════════════════════════════════════════════════════
     PAGE 2 — DIAGRAM (VISUAL ONLY)
     ═══════════════════════════════════════════════════════════════════ */

  // Legend pills for all edge types with measurements
  let legendPillsHTML = '<div class="legend-pills">';
  Object.entries(EC).forEach(([key, v]) => {
    const len = edgeTotals[key]?.length || 0;
    if (len > 0) {
      legendPillsHTML += `
        <div class="legend-pill">
          <span class="legend-dot" style="background:${v.color};"></span>
          ${v.name}: ${ftIn(len)}
        </div>`;
    }
  });
  legendPillsHTML += '</div>';

  const page2 = `
  <div class="page">
    <div class="accent-bar"></div>
    <div class="page-inner">
      ${subHeader()}
      <div class="page-title">Diagram</div>
      <div class="page-address">${esc(address)}</div>
      <div class="divider"></div>

      <!-- Full-page diagram -->
      <div style="flex:1;">
        ${mapImage
          ? `<img src="${mapImage}" style="width:100%;display:block;max-height:680px;object-fit:contain;border-radius:4px;" />`
          : noImage}
      </div>

      <!-- Color Legend Pills -->
      <div style="margin-top:auto;padding-top:12px;">
        <div class="sec-title">Legend</div>
        ${legendPillsHTML}
      </div>
    </div>
    ${footer(2, TOTAL_PAGES, shortAddr)}
  </div>`;


  /* ═══════════════════════════════════════════════════════════════════
     PAGE 3 — LENGTH MEASUREMENT REPORT
     ═══════════════════════════════════════════════════════════════════ */

  // Edge table rows
  let edgeRowsHTML = '';
  activeEdges.forEach((t, i) => {
    const ec = EC[t] || EC.unclassified;
    const d  = edgeTotals[t];
    edgeRowsHTML += `
      <tr class="${i % 2 === 0 ? 'alt' : ''}">
        <td>
          <span style="display:inline-flex;align-items:center;gap:7px;">
            <span style="width:10px;height:10px;border-radius:50%;background:${ec.color};flex-shrink:0;display:inline-block;"></span>
            <span style="font-weight:600;">${ec.name}</span>
          </span>
        </td>
        <td class="c">${d.count}</td>
        <td class="r b">${ftIn(d.length)}</td>
      </tr>`;
  });

  const page3 = `
  <div class="page">
    <div class="accent-bar"></div>
    <div class="page-inner">
      ${subHeader()}
      <div class="page-title">Length Measurement Report</div>
      <div class="page-address">${esc(address)}</div>
      <div class="divider"></div>

      <!-- Diagram with edge lengths -->
      <div style="margin-bottom:14px;">
        ${mapImage
          ? `<img src="${mapImage}" style="width:100%;display:block;max-height:340px;object-fit:contain;border:1px solid ${LINE};border-radius:4px;" />`
          : noImage}
      </div>

      <!-- Edge Summary Table -->
      <div class="sec-title">Edge Summary</div>
      <table class="tbl">
        <thead><tr>
          <th>Edge Type</th>
          <th class="c">Segments</th>
          <th class="r">Total Length (ft in)</th>
        </tr></thead>
        <tbody>${edgeRowsHTML}</tbody>
        <tfoot><tr class="foot">
          <td>TOTAL</td>
          <td class="c">${totalEdges}</td>
          <td class="r">${ftIn(totalLen)}</td>
        </tr></tfoot>
      </table>

      <div style="margin-top:8px;font-size:7.5px;color:${GRAY_LT};font-style:italic;">
        Measurements are rounded up for display. Some edge lengths may be hidden from diagram to avoid overcrowding.</div>
    </div>
    ${footer(3, TOTAL_PAGES, shortAddr)}
  </div>`;


  /* ═══════════════════════════════════════════════════════════════════
     PAGE 4 — AREA MEASUREMENT REPORT
     ═══════════════════════════════════════════════════════════════════ */

  // Facet labels table (individual sqft per facet)
  let facetLabelsHTML = '';
  const facets = facetDetails && facetDetails.length > 0 ? facetDetails : [];
  if (facets.length > 0) {
    facetLabelsHTML = `
      <div class="sec-title" style="margin-top:14px;">Individual Facet Areas</div>
      <table class="tbl">
        <thead><tr>
          <th>Facet</th>
          <th class="c">Pitch</th>
          <th class="r">Flat Area (sqft)</th>
          <th class="r">Sloped Area (sqft)</th>
        </tr></thead>
        <tbody>`;
    facets.forEach((f, i) => {
      const flatA = f.area || 0;
      const pitch = f.pitch || 'Unassigned';
      const factor = f.slopeFactor || 1;
      const slopedA = flatA * factor;
      facetLabelsHTML += `
        <tr class="${i % 2 === 0 ? 'alt' : ''}">
          <td class="b">Facet ${i + 1}</td>
          <td class="c">${esc(pitch)}</td>
          <td class="r">${num(flatA)}</td>
          <td class="r b">${num(slopedA)}</td>
        </tr>`;
    });
    facetLabelsHTML += `
        </tbody>
        <tfoot><tr class="foot">
          <td>TOTAL</td>
          <td></td>
          <td class="r">${num(totalFlatArea)}</td>
          <td class="r">${num(totalSlopedArea)}</td>
        </tr></tfoot>
      </table>`;
  }

  const page4 = `
  <div class="page">
    <div class="accent-bar"></div>
    <div class="page-inner">
      ${subHeader()}
      <div class="page-title">Area Measurement Report</div>
      <div class="page-address">${esc(address)}</div>
      <div class="divider"></div>

      <!-- Diagram showing facets -->
      <div style="margin-bottom:12px;">
        ${mapImage
          ? `<img src="${mapImage}" style="width:100%;display:block;max-height:260px;object-fit:contain;border:1px solid ${LINE};border-radius:4px;" />`
          : noImage}
      </div>

      <!-- Total Flat vs Sloped Summary -->
      <div style="display:flex;gap:16px;margin-bottom:14px;">
        <div style="flex:1;padding:12px 16px;border-radius:6px;background:${BLUE_LT};border:1px solid ${BLUE};text-align:center;">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:${GRAY};font-weight:600;">Total Flat Area</div>
          <div style="font-size:22px;font-weight:800;color:${BLUE};margin-top:4px;">${num(totalFlatArea)} sqft</div>
        </div>
        <div style="flex:1;padding:12px 16px;border-radius:6px;background:${BLUE};text-align:center;">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.75);font-weight:600;">Total Sloped Area</div>
          <div style="font-size:22px;font-weight:800;color:#fff;margin-top:4px;">${num(totalSlopedArea)} sqft</div>
        </div>
      </div>

      <!-- Individual Facet Areas -->
      ${facetLabelsHTML}

      <div style="margin-top:8px;font-size:7.5px;color:${GRAY_LT};font-style:italic;">
        Flat area is the projected area. Sloped area accounts for the pitch multiplier. Totals are sums of exact measurements.</div>
    </div>
    ${footer(4, TOTAL_PAGES, shortAddr)}
  </div>`;


  /* ═══════════════════════════════════════════════════════════════════
     PAGE 5 — PITCH & MEASUREMENT REPORT
     ═══════════════════════════════════════════════════════════════════ */

  // Pitch table rows
  let pitchRowsHTML = '';
  pitchEntries.forEach(([pitch, data], i) => {
    const sq = (data.slopedArea || 0) / 100;
    pitchRowsHTML += `
      <tr class="${i % 2 === 0 ? 'alt' : ''}">
        <td class="b" style="color:${pitch === 'Unassigned' ? GRAY : DARK};">${esc(pitch)}</td>
        <td class="c">${data.count}</td>
        <td class="r">${num(data.slopedArea)} sqft</td>
        <td class="r b">${dec1(sq)} Sq</td>
      </tr>`;
  });

  // Visual pitch bar chart
  const maxSlopedArea = pitchEntries.length > 0
    ? Math.max(...pitchEntries.map(([, d]) => d.slopedArea || 0))
    : 1;
  let pitchBarsHTML = '';
  pitchEntries.forEach(([pitch, data]) => {
    const pct = maxSlopedArea > 0 ? ((data.slopedArea || 0) / maxSlopedArea * 100) : 0;
    const sq = (data.slopedArea || 0) / 100;
    pitchBarsHTML += `
      <div class="pitch-bar-row">
        <div class="pitch-bar-label">${esc(pitch)}</div>
        <div class="pitch-bar-track">
          <div class="pitch-bar-fill" style="width:${Math.max(pct, 3)}%;">
            ${pct > 25 ? `${data.count} facets` : ''}
          </div>
        </div>
        <div class="pitch-bar-value">${num(data.slopedArea)} sqft (${dec1(sq)} Sq)</div>
      </div>`;
  });

  const page5 = `
  <div class="page">
    <div class="accent-bar"></div>
    <div class="page-inner">
      ${subHeader()}
      <div class="page-title">Pitch &amp; Measurement Report</div>
      <div class="page-address">${esc(address)}</div>
      <div class="divider"></div>

      <!-- Pitch Breakdown Table -->
      <div class="sec-title">Pitch Breakdown</div>
      <table class="tbl">
        <thead><tr>
          <th>Pitch</th>
          <th class="c">Facets</th>
          <th class="r">True Area</th>
          <th class="r">Squares</th>
        </tr></thead>
        <tbody>${pitchRowsHTML}</tbody>
        <tfoot><tr class="foot">
          <td>TOTAL</td>
          <td class="c">${facetCount}</td>
          <td class="r">${num(totalSlopedArea)} sqft</td>
          <td class="r">${dec1(totalSquares)} Sq</td>
        </tr></tfoot>
      </table>

      <!-- Visual Pitch Distribution -->
      <div class="sec-title" style="margin-top:20px;">Pitch Distribution</div>
      <div style="padding:8px 0;">
        ${pitchBarsHTML}
      </div>

      <!-- Quick stats -->
      <div style="margin-top:12px;display:flex;gap:16px;">
        <div style="flex:1;padding:10px;border:1px solid ${LINE};border-radius:6px;">
          <div style="font-size:8px;text-transform:uppercase;color:${GRAY};font-weight:600;letter-spacing:0.08em;">Predominant Pitch</div>
          <div style="font-size:18px;font-weight:800;color:${BLUE};margin-top:4px;">${esc(primaryPitch)}</div>
        </div>
        <div style="flex:1;padding:10px;border:1px solid ${LINE};border-radius:6px;">
          <div style="font-size:8px;text-transform:uppercase;color:${GRAY};font-weight:600;letter-spacing:0.08em;">Total Squares</div>
          <div style="font-size:18px;font-weight:800;color:${BLUE};margin-top:4px;">${dec1(totalSquares)} Sq</div>
        </div>
        <div style="flex:1;padding:10px;border:1px solid ${LINE};border-radius:6px;">
          <div style="font-size:8px;text-transform:uppercase;color:${GRAY};font-weight:600;letter-spacing:0.08em;">Pitch Groups</div>
          <div style="font-size:18px;font-weight:800;color:${BLUE};margin-top:4px;">${pitchEntries.length}</div>
        </div>
      </div>
    </div>
    ${footer(5, TOTAL_PAGES, shortAddr)}
  </div>`;


  /* ═══════════════════════════════════════════════════════════════════
     PAGE 6 — REPORT SUMMARY (EXECUTIVE SUMMARY)
     ═══════════════════════════════════════════════════════════════════ */

  const summaryData = [
    ['Total Roof Area',      `${num(totalSlopedArea)} sqft`],
    ['Total Flat Area',      `${num(totalFlatArea)} sqft`],
    ['Total Roof Facets',    `${facetCount}`],
    ['Predominant Pitch',    esc(primaryPitch)],
    ['Total Squares',        `${dec1(totalSquares)} Sq`],
    ['Total Eaves',          ftIn(eLen)],
    ['Total Ridges',         ftIn(gLen)],
    ['Total Valleys',        ftIn(vLen)],
    ['Total Hips',           ftIn(hLen)],
    ['Total Rakes',          ftIn(rLen)],
    ['Total Wall Flashing',  ftIn(wfLen)],
    ['Total Step Flashing',  ftIn(sfLen)],
    ['Hips + Ridges',        ftIn(hrLen)],
    ['Eaves + Rakes',        ftIn(erLen)],
  ];

  let summaryRowsHTML = '';
  summaryData.forEach(([k, v], i) => {
    summaryRowsHTML += `
      <tr class="${i % 2 === 0 ? 'alt' : ''}">
        <td style="color:${GRAY};font-weight:500;">${k}</td>
        <td class="r b" style="color:${DARK};">${v}</td>
      </tr>`;
  });

  // Waste factors: 0%, 10%, 15%
  const wastePcts = [0, 10, 15];
  const wasteData = wastePcts.map(p => ({
    pct: p,
    area: totalSlopedArea * (1 + p / 100),
    sq:   (totalSlopedArea * (1 + p / 100)) / 100,
  }));

  const page6 = `
  <div class="page">
    <div class="accent-bar"></div>
    <div class="page-inner">
      ${subHeader()}
      <div class="page-title">Report Summary</div>
      <div class="page-address">${esc(address)}</div>
      <div class="divider"></div>

      <!-- Executive summary header -->
      <div style="background:${BLUE_LT};border:1px solid ${BLUE};border-radius:6px;padding:10px 14px;margin-bottom:14px;">
        <div style="font-size:11px;font-weight:700;color:${BLUE};">Executive Summary</div>
        <div style="font-size:9.5px;color:${TEXT};margin-top:4px;line-height:1.5;">
          This report summarizes the roof measurements for <strong>${esc(shortAddr)}</strong>.
          The roof consists of <strong>${facetCount} facets</strong> with a total sloped area of
          <strong>${num(totalSlopedArea)} sqft</strong> (<strong>${dec1(totalSquares)} squares</strong>).
          The predominant pitch is <strong>${esc(primaryPitch)}</strong>.
        </div>
      </div>

      <!-- Measurements table -->
      <div class="sec-title">All Measurements</div>
      <table class="tbl">
        <thead><tr>
          <th>Measurement</th>
          <th class="r">Value</th>
        </tr></thead>
        <tbody>${summaryRowsHTML}</tbody>
      </table>

      <!-- Waste Factor Table -->
      <div class="sec-title" style="margin-top:14px;">Waste Factors</div>
      <table class="tbl">
        <thead><tr>
          <th>Waste %</th>
          <th class="r">Adjusted Area (sqft)</th>
          <th class="r">Adjusted Squares</th>
        </tr></thead>
        <tbody>
          ${wasteData.map((w, i) => `
            <tr class="${i % 2 === 0 ? 'alt' : ''}">
              <td class="b">${w.pct}%${w.pct === 0 ? ' (No waste)' : ''}</td>
              <td class="r">${num(w.area)}</td>
              <td class="r b">${dec1(w.sq)} Sq</td>
            </tr>`).join('')}
        </tbody>
      </table>

      <!-- Signature Line -->
      <div class="sig-section">
        <div style="font-size:10px;font-weight:700;color:${DARK};margin-bottom:4px;">Contractor Approval</div>
        <div style="font-size:8.5px;color:${GRAY};margin-bottom:12px;">
          By signing below, the contractor confirms the accuracy of the measurements in this report.</div>
        <div class="sig-line">
          <div class="sig-field">Contractor Name</div>
          <div class="sig-field">Signature</div>
          <div class="sig-field" style="max-width:130px;">Date</div>
        </div>
      </div>
    </div>
    ${footer(6, TOTAL_PAGES, shortAddr)}
  </div>`;


  /* ═══════════════════════════════════════════════════════════════════
     PAGE 7 — MATERIAL CALCULATIONS
     ═══════════════════════════════════════════════════════════════════ */

  const matWaste = [0, 10, 15];

  const adjusted = matWaste.map(p => {
    const f = 1 + p / 100;
    return {
      pct: p,
      area: totalSlopedArea * f,
      sq:   (totalSlopedArea * f) / 100,
      erFt: erLen * f,
      iwFt: (eLen + vLen + wfLen) * f,
      synSq: (totalSlopedArea * f) / 100,
      capFt: hrLen * f,
    };
  });

  // Order List: key quantities
  const recAdj = adjusted.find(a => a.pct === 10) || adjusted[0];
  const shingleBundles = Math.ceil(recAdj.sq * 3);
  const starterRolls   = Math.ceil(recAdj.erFt / 105);
  const hipRidgeCaps   = Math.ceil(recAdj.capFt / 25);
  const underlayment   = Math.ceil(recAdj.synSq / 10);

  // Material categories with brand rows
  const matCategories = [
    {
      label: 'Shingle (total sqft)',
      headerValues: adjusted.map(a => `${num(a.area)} sqft`),
      brands: [
        { name: 'GAF - Timberline HDZ',         unit: 'bundle', calc: a => Math.ceil(a.area / 32.3) },
        { name: 'CertainTeed - Landmark',       unit: 'bundle', calc: a => Math.ceil(a.area / 32.3) },
        { name: 'IKO - Cambridge',              unit: 'bundle', calc: a => Math.ceil(a.sq * 3) },
        { name: 'Owens Corning - Duration',     unit: 'bundle', calc: a => Math.ceil(a.area / 32.3) },
      ],
    },
    {
      label: 'Starter (eaves + rakes)',
      headerValues: adjusted.map(a => `${Math.round(a.erFt)} ft`),
      brands: [
        { name: 'GAF - Pro-Start',              unit: 'bundle', calc: a => Math.ceil(a.erFt / 105) },
        { name: 'CertainTeed - SwiftStart',     unit: 'bundle', calc: a => Math.ceil(a.erFt / 104) },
        { name: 'IKO - Leading Edge Plus',      unit: 'bundle', calc: a => Math.ceil(a.erFt / 105) },
      ],
    },
    {
      label: 'Hip & Ridge Caps (hips + ridges)',
      headerValues: adjusted.map(a => `${Math.round(a.capFt)} ft`),
      brands: [
        { name: 'GAF - Seal-A-Ridge',           unit: 'bundle', calc: a => Math.ceil(a.capFt / 20) },
        { name: 'CertainTeed - Shadow Ridge',   unit: 'bundle', calc: a => Math.ceil(a.capFt / 20) },
        { name: 'IKO - Hip and Ridge 12',       unit: 'bundle', calc: a => Math.ceil(a.capFt / 31) },
      ],
    },
    {
      label: 'Underlayment (total sqft)',
      headerValues: adjusted.map(a => `${num(a.area)} sqft`),
      brands: [
        { name: 'GAF - Deck-Armor',             unit: 'roll', calc: a => Math.ceil(a.synSq / 10) },
        { name: 'CertainTeed - RoofRunner',     unit: 'roll', calc: a => Math.ceil(a.synSq / 10) },
        { name: 'IKO - Stormtite',              unit: 'roll', calc: a => Math.ceil(a.synSq / 10) },
      ],
    },
    {
      label: 'Ice & Water Shield (eaves + valleys)',
      headerValues: adjusted.map(a => `${Math.round(a.iwFt)} ft`),
      brands: [
        { name: 'GAF - WeatherWatch',           unit: 'roll', calc: a => Math.ceil(a.iwFt / 56) },
        { name: 'CertainTeed - WinterGuard',    unit: 'roll', calc: a => Math.ceil(a.iwFt / 56) },
        { name: 'IKO - StormShield',            unit: 'roll', calc: a => Math.ceil(a.iwFt / 65) },
      ],
    },
  ];

  // Build material table
  let matHTML = `
    <table class="tbl" style="font-size:9.5px;">
      <thead><tr>
        <th style="padding-left:10px;">Product</th>
        <th class="c">Unit</th>
        ${matWaste.map(p => `<th class="r">Waste ${p}%</th>`).join('')}
      </tr></thead>
      <tbody>`;

  matCategories.forEach(cat => {
    matHTML += `<tr class="mat-cat">
      <td style="padding:5px 10px;font-weight:700;" colspan="2">${cat.label}</td>
      ${cat.headerValues.map(v => `<td class="r" style="padding:5px 10px;font-weight:700;font-size:9px;">${v}</td>`).join('')}
    </tr>`;
    cat.brands.forEach((brand, bi) => {
      matHTML += `<tr class="${bi % 2 === 0 ? '' : 'alt'}">
        <td style="padding:4px 10px 4px 20px;font-size:9.5px;">${brand.name}</td>
        <td class="c" style="font-size:9px;">${brand.unit}</td>
        ${adjusted.map(a => `<td class="r" style="font-size:9.5px;">${brand.calc(a)}</td>`).join('')}
      </tr>`;
    });
  });

  // Other section
  matHTML += `<tr class="mat-cat"><td style="padding:5px 10px;font-weight:700;" colspan="${2 + matWaste.length}">Other</td></tr>`;
  matHTML += `<tr>
    <td style="padding:4px 10px 4px 20px;">8' Valley Sheet (no laps)</td>
    <td class="c" style="font-size:9px;">sheet</td>
    ${adjusted.map(a => `<td class="r">${Math.ceil((vLen * (1 + a.pct / 100)) / 8)}</td>`).join('')}
  </tr>`;
  matHTML += `<tr class="alt">
    <td style="padding:4px 10px 4px 20px;">10' Drip Edge (eaves + rakes)</td>
    <td class="c" style="font-size:9px;">sheet</td>
    ${adjusted.map(a => `<td class="r">${Math.ceil(a.erFt / 10)}</td>`).join('')}
  </tr>`;
  matHTML += '</tbody></table>';

  const page7 = `
  <div class="page">
    <div class="accent-bar"></div>
    <div class="page-inner">
      ${subHeader()}
      <div class="page-title">Material Calculations</div>
      <div class="page-address">${esc(address)}</div>
      <div class="divider"></div>

      <!-- Quick Order Summary -->
      <div style="display:flex;gap:10px;margin-bottom:14px;">
        <div style="flex:1;padding:8px 10px;border-radius:6px;background:${BLUE_LT};border:1px solid ${BLUE};text-align:center;">
          <div style="font-size:20px;font-weight:800;color:${BLUE};">${shingleBundles}</div>
          <div style="font-size:8px;color:${GRAY};text-transform:uppercase;font-weight:600;">Shingle Bundles</div>
        </div>
        <div style="flex:1;padding:8px 10px;border-radius:6px;background:${BLUE_LT};border:1px solid ${BLUE};text-align:center;">
          <div style="font-size:20px;font-weight:800;color:${BLUE};">${starterRolls}</div>
          <div style="font-size:8px;color:${GRAY};text-transform:uppercase;font-weight:600;">Starter Rolls</div>
        </div>
        <div style="flex:1;padding:8px 10px;border-radius:6px;background:${BLUE_LT};border:1px solid ${BLUE};text-align:center;">
          <div style="font-size:20px;font-weight:800;color:${BLUE};">${hipRidgeCaps}</div>
          <div style="font-size:8px;color:${GRAY};text-transform:uppercase;font-weight:600;">Hip & Ridge Caps</div>
        </div>
        <div style="flex:1;padding:8px 10px;border-radius:6px;background:${BLUE_LT};border:1px solid ${BLUE};text-align:center;">
          <div style="font-size:20px;font-weight:800;color:${BLUE};">${underlayment}</div>
          <div style="font-size:8px;color:${GRAY};text-transform:uppercase;font-weight:600;">Underlayment Rolls</div>
        </div>
      </div>

      <!-- Brand Options -->
      <div style="font-size:8px;color:${GRAY};margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">
        Quantities by brand at 10% waste. Full breakdown below.</div>

      <!-- Detailed Material Table -->
      ${matHTML}

      <div style="margin-top:6px;font-size:7px;color:${GRAY_LT};font-style:italic;line-height:1.5;">
        Calculations are estimates. Always verify before ordering. Based on total pitched area (flat area excluded).
        Brand quantities vary due to different coverage per bundle/roll.</div>
    </div>
    ${footer(7, TOTAL_PAGES, shortAddr)}
  </div>`;


  /* ═══════════════════════════════════════════════════════════════════
     ASSEMBLE FULL HTML DOCUMENT
     ═══════════════════════════════════════════════════════════════════ */
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Precision Roofing — Roof Report</title>
  <style>${css()}</style>
</head>
<body>
  ${page1}
  ${page2}
  ${page3}
  ${page4}
  ${page5}
  ${page6}
  ${page7}
</body>
</html>`;
}

module.exports = { buildReportHTML };
