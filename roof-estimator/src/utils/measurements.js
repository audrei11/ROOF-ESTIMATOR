import * as turf from '@turf/turf';

/**
 * Convert square meters to square feet
 */
export function sqMetersToSqFeet(sqMeters) {
  return sqMeters * 10.7639;
}

/**
 * Convert meters to feet
 */
export function metersToFeet(meters) {
  return meters * 3.28084;
}

/**
 * Calculate the area of a polygon in square feet
 * @param {Array} latlngs - Array of [lat, lng] pairs
 */
export function calculateArea(latlngs) {
  if (!latlngs || latlngs.length < 3) return 0;
  const coords = latlngs.map(ll => [ll[1], ll[0]]); // turf uses [lng, lat]
  coords.push(coords[0]); // close the polygon
  const polygon = turf.polygon([coords]);
  const area = turf.area(polygon); // in square meters
  return sqMetersToSqFeet(area);
}

/**
 * Calculate the perimeter of a polygon in feet
 * @param {Array} latlngs - Array of [lat, lng] pairs
 */
export function calculatePerimeter(latlngs) {
  if (!latlngs || latlngs.length < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < latlngs.length; i++) {
    const next = (i + 1) % latlngs.length;
    const from = turf.point([latlngs[i][1], latlngs[i][0]]);
    const to = turf.point([latlngs[next][1], latlngs[next][0]]);
    perimeter += turf.distance(from, to, { units: 'feet' });
  }
  return perimeter;
}

/**
 * Get raw edges of a polygon (no classification yet).
 * @param {Array} latlngs - Array of [lat, lng] pairs
 * @param {string} polygonId - Unique polygon identifier for cross-polygon analysis
 * @returns {Array} raw edges with geometry data
 */
export function getEdges(latlngs, polygonId = '0') {
  if (!latlngs || latlngs.length < 2) return [];
  const edges = [];

  for (let i = 0; i < latlngs.length; i++) {
    const next = (i + 1) % latlngs.length;
    const from = turf.point([latlngs[i][1], latlngs[i][0]]);
    const to = turf.point([latlngs[next][1], latlngs[next][0]]);
    const length = turf.distance(from, to, { units: 'feet' });
    const bearing = turf.bearing(from, to);

    edges.push({
      id: `${polygonId}-edge-${i}`,
      polygonId,
      index: i,
      start: latlngs[i],
      end: latlngs[next],
      length: length,
      bearing: bearing,
      type: 'unclassified',
      color: '#3388ff',
    });
  }

  return edges;
}

/**
 * Classify ALL edges across ALL polygons using cross-polygon analysis.
 *
 * Smart classification logic:
 *   1. Detect SHARED edges (same edge in two adjacent polygons) → ridge or valley
 *   2. Non-shared edges on the outer perimeter → eave or rake
 *   3. Angle-based sub-classification:
 *      - Parallel to dominant bearing + shared → Ridge (roof peak)
 *      - Parallel to dominant bearing + outer  → Eave (lower edge)
 *      - Perpendicular to dominant             → Rake (gable side)
 *      - Diagonal + shared                     → Valley or Hip
 *      - Diagonal + outer                      → Hip
 */
export function classifyAllEdges(allEdges) {
  if (allEdges.length === 0) return [];

  // Step 1: Find shared edges between different polygons
  const sharedIds = findSharedEdges(allEdges);

  // Step 2: Find dominant bearing from the longest edge
  const sorted = [...allEdges].sort((a, b) => b.length - a.length);
  const dominantBearing = sorted[0].bearing;

  // Step 3: Classify each edge
  return allEdges.map(edge => {
    const bearingDiff = normalizeAngle(edge.bearing - dominantBearing);
    const isShared = sharedIds.has(edge.id);

    let type;
    if (bearingDiff < 20 || bearingDiff > 160) {
      // Parallel to dominant direction
      type = isShared ? 'ridge' : 'eave';
    } else if (bearingDiff > 70 && bearingDiff < 110) {
      // Perpendicular to dominant direction
      type = 'rake';
    } else {
      // Diagonal edge
      type = isShared ? 'valley' : 'hip';
    }

    return { ...edge, type, color: EDGE_COLOR_MAP[type] };
  });
}

/**
 * Find edges that are shared (overlapping) between different polygons.
 * Two edges are "shared" if their endpoints are very close (within ~2m),
 * meaning two roof sections meet at that edge (ridge, valley, or hip).
 */
function findSharedEdges(allEdges) {
  const shared = new Set();
  const threshold = 0.00003; // ~3 meters in lat/lng degrees at mid-latitudes

  for (let i = 0; i < allEdges.length; i++) {
    for (let j = i + 1; j < allEdges.length; j++) {
      // Only compare edges from DIFFERENT polygons
      if (allEdges[i].polygonId === allEdges[j].polygonId) continue;

      if (edgesOverlap(allEdges[i], allEdges[j], threshold)) {
        shared.add(allEdges[i].id);
        shared.add(allEdges[j].id);
      }
    }
  }

  return shared;
}

/**
 * Check if two edges overlap (share approximately the same endpoints).
 */
function edgesOverlap(e1, e2, threshold) {
  // Forward match: A.start≈B.start AND A.end≈B.end
  const fwd = ptClose(e1.start, e2.start, threshold) && ptClose(e1.end, e2.end, threshold);
  // Reverse match: A.start≈B.end AND A.end≈B.start
  const rev = ptClose(e1.start, e2.end, threshold) && ptClose(e1.end, e2.start, threshold);
  return fwd || rev;
}

function ptClose(a, b, threshold) {
  return Math.abs(a[0] - b[0]) < threshold && Math.abs(a[1] - b[1]) < threshold;
}

/**
 * Roofr-standard edge color map (matches Roofr Measurements UI)
 */
export const EDGE_COLOR_MAP = {
  eave:           '#22c55e', // green
  valley:         '#f97316', // orange
  hip:            '#a855f7', // violet
  ridge:          '#ffffff', // white
  rake:           '#eab308', // yellow
  wall_flashing:  '#1e88e5', // dark blue
  step_flashing:  '#e65100', // dark orange
  parapet_wall:   '#8d6e63', // brown
  transition:     '#ab47bc', // purple
  unspecified:    '#90caf9', // light blue
  unclassified:   '#94a3b8', // slate gray (fallback)
};

/** Dashed types render with dashed lines on the map */
export const EDGE_DASHED_TYPES = new Set([
  'wall_flashing', 'step_flashing', 'parapet_wall', 'transition',
]);

/** Display labels for edge types */
export const EDGE_TYPE_LABELS = {
  eave:           'Eaves',
  valley:         'Valleys',
  hip:            'Hips',
  ridge:          'Ridges',
  rake:           'Rakes',
  wall_flashing:  'Wall flashing',
  step_flashing:  'Step flashing',
  parapet_wall:   'Parapet wall',
  transition:     'Transition',
  unspecified:    'Unspecified',
  unclassified:   'Unclassified',
};

/** Ordered list matching Roofr's Edges tools panel */
export const EDGE_TYPES = [
  'eave', 'valley', 'hip', 'ridge', 'rake',
  'wall_flashing', 'step_flashing', 'parapet_wall', 'transition', 'unspecified',
];

/**
 * Legacy single-polygon classifier (fallback).
 * Used internally by classifyAllEdges when only 1 polygon exists.
 */
export function classifyEdges(edges) {
  if (edges.length === 0) return edges;

  const sorted = [...edges].sort((a, b) => b.length - a.length);
  const dominantBearing = sorted[0].bearing;

  return edges.map(edge => {
    const bearingDiff = normalizeAngle(edge.bearing - dominantBearing);

    let type;
    if (bearingDiff < 20 || bearingDiff > 160) {
      // Parallel to dominant — default to eave for outer edges
      type = 'eave';
    } else if (bearingDiff > 70 && bearingDiff < 110) {
      type = 'rake';
    } else {
      type = 'hip';
    }

    return { ...edge, type, color: EDGE_COLOR_MAP[type] };
  });
}

/**
 * Compute enclosed facet polygons from a set of edges.
 * Uses planar face enumeration via half-edge data structure:
 *   0. Split edges at T-junctions (vertex on interior of another edge)
 *   1. Deduplicate vertices by proximity
 *   2. Build directed half-edges (each segment → fwd + rev)
 *   3. Sort outgoing half-edges at each vertex by angle
 *   4. Build "next" pointers (clockwise turn rule)
 *   5. Trace minimal faces, discard the outer (unbounded) face
 *
 * @param {Array} edges - Array of edge objects with start/end [lat,lng]
 * @returns {Array} Array of polygon objects { id, latlngs, area, perimeter }
 */
export function computeFacetsFromEdges(edges) {
  if (!edges || edges.length < 3) return [];

  const EPS = 0.00002; // ~2 m matching threshold

  // ── Step 0: Split edges at T-junctions ──
  // Collect all unique endpoint positions first
  let segments = edges.map(e => ({ start: [...e.start], end: [...e.end] }));

  const ptEq = (a, b) => Math.abs(a[0] - b[0]) < EPS && Math.abs(a[1] - b[1]) < EPS;

  // Gather every unique vertex from all segment endpoints
  const gatherPts = (segs) => {
    const pts = [];
    segs.forEach(s => {
      if (!pts.some(p => ptEq(p, s.start))) pts.push(s.start);
      if (!pts.some(p => ptEq(p, s.end))) pts.push(s.end);
    });
    return pts;
  };

  // Repeat splitting until stable (handles cascading splits)
  for (let iter = 0; iter < 5; iter++) {
    const pts = gatherPts(segments);
    const newSegs = [];
    let didSplit = false;

    for (const seg of segments) {
      // Find all points that lie on this segment's interior
      const dx = seg.end[0] - seg.start[0];
      const dy = seg.end[1] - seg.start[1];
      const lenSq = dx * dx + dy * dy;
      if (lenSq < EPS * EPS) { newSegs.push(seg); continue; }

      const splits = [];
      for (const pt of pts) {
        if (ptEq(pt, seg.start) || ptEq(pt, seg.end)) continue;
        // Project pt onto segment line
        const t = ((pt[0] - seg.start[0]) * dx + (pt[1] - seg.start[1]) * dy) / lenSq;
        if (t <= 0.02 || t >= 0.98) continue;
        const projLat = seg.start[0] + t * dx;
        const projLng = seg.start[1] + t * dy;
        const distSq = (pt[0] - projLat) ** 2 + (pt[1] - projLng) ** 2;
        if (distSq < EPS * EPS) splits.push({ t, pt });
      }

      if (splits.length > 0) {
        splits.sort((a, b) => a.t - b.t);
        didSplit = true;
        let prev = seg.start;
        splits.forEach(sp => { newSegs.push({ start: prev, end: sp.pt }); prev = sp.pt; });
        newSegs.push({ start: prev, end: seg.end });
      } else {
        newSegs.push(seg);
      }
    }

    segments = newSegs;
    if (!didSplit) break;
  }

  console.log('[computeFacets] after T-junction split:', segments.length, 'segments from', edges.length, 'edges');

  // ── Step 1: Deduplicate vertices by proximity ──
  const verts = [];
  const vertIdx = (pt) => {
    for (let i = 0; i < verts.length; i++) {
      if (Math.abs(verts[i][0] - pt[0]) < EPS && Math.abs(verts[i][1] - pt[1]) < EPS) return i;
    }
    verts.push([pt[0], pt[1]]);
    return verts.length - 1;
  };

  // Map each segment to vertex-index pair, filter degenerate
  const segPairs = [];
  segments.forEach(s => {
    const a = vertIdx(s.start);
    const b = vertIdx(s.end);
    if (a !== b) segPairs.push({ a, b });
  });

  // Remove duplicate segments (same vertex pair in either direction)
  const segSet = new Set();
  const uniquePairs = [];
  segPairs.forEach(({ a, b }) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (!segSet.has(key)) { segSet.add(key); uniquePairs.push({ a, b }); }
  });

  // ── Step 2: Build half-edge list (pairs: 2k = fwd, 2k+1 = rev) ──
  const halfEdges = [];
  uniquePairs.forEach(({ a, b }) => {
    halfEdges.push({ from: a, to: b });
    halfEdges.push({ from: b, to: a });
  });

  console.log('[computeFacets]', verts.length, 'vertices,', uniquePairs.length, 'segments,', halfEdges.length, 'half-edges');

  // ── Step 3: Sort outgoing half-edges at each vertex by angle ──
  const adjOut = new Map();
  halfEdges.forEach((he, idx) => {
    if (!adjOut.has(he.from)) adjOut.set(he.from, []);
    adjOut.get(he.from).push(idx);
  });

  const heAngle = (he) => Math.atan2(
    verts[he.to][1] - verts[he.from][1],
    verts[he.to][0] - verts[he.from][0]
  );

  adjOut.forEach((list) => {
    list.sort((a, b) => heAngle(halfEdges[a]) - heAngle(halfEdges[b]));
  });

  // ── Step 4: "next" pointer — for half-edge (u→v), the next in the face cycle ──
  // Twin of half-edge at index i is at i^1 (XOR) because we push fwd/rev pairs.
  const nextHE = (heIdx) => {
    const he = halfEdges[heIdx];
    const v = he.to;
    const twin = heIdx ^ 1; // twin of fwd(2k) is rev(2k+1) and vice versa
    const outList = adjOut.get(v);
    if (!outList || outList.length === 0) return -1;

    const twinPos = outList.indexOf(twin);
    if (twinPos === -1) return outList[0]; // fallback
    // Previous in angle-sorted list = next clockwise turn
    return outList[(twinPos - 1 + outList.length) % outList.length];
  };

  // ── Step 5: Trace all faces ──
  const used = new Set();
  const faces = [];

  for (let startIdx = 0; startIdx < halfEdges.length; startIdx++) {
    if (used.has(startIdx)) continue;

    const faceHEs = [];
    let cur = startIdx;
    let safe = 0;

    while (safe < 200) {
      if (used.has(cur)) break;
      used.add(cur);
      faceHEs.push(cur);
      cur = nextHE(cur);
      if (cur === -1 || cur === startIdx) break;
      safe++;
    }

    if (faceHEs.length >= 3) {
      const latlngs = faceHEs.map(i => verts[halfEdges[i].from]);
      const area = calculateArea(latlngs);
      const perimeter = calculatePerimeter(latlngs);

      // Skip tiny slivers and unreasonably huge shapes
      if (area > 10 && area < 100000) {
        faces.push({ latlngs, area, perimeter });
      }
    }
  }

  console.log('[computeFacets] found', faces.length, 'candidate faces');

  // Remove the outer (unbounded) face — the largest one
  if (faces.length > 1) {
    let maxIdx = 0;
    for (let i = 1; i < faces.length; i++) {
      if (faces[i].area > faces[maxIdx].area) maxIdx = i;
    }
    const inner = faces.filter((_, i) => i !== maxIdx);
    if (inner.length > 0) {
      console.log('[computeFacets] returning', inner.length, 'interior facets (removed outer face of', faces[maxIdx].area.toFixed(0), 'sqft)');
      return inner.map((f, i) => ({
        id: `facet-${i}`,
        latlngs: f.latlngs,
        area: f.area,
        perimeter: f.perimeter,
      }));
    }
  }

  return faces.map((f, i) => ({
    id: `facet-${i}`,
    latlngs: f.latlngs,
    area: f.area,
    perimeter: f.perimeter,
  }));
}

/**
 * Compute the centroid (average lat/lng) of a polygon.
 */
export function getCentroid(latlngs) {
  if (!latlngs || latlngs.length === 0) return [0, 0];
  let lat = 0, lng = 0;
  latlngs.forEach(p => { lat += p[0]; lng += p[1]; });
  return [lat / latlngs.length, lng / latlngs.length];
}

/**
 * Transfer pitch assignments from old facets to new facets by matching centroids.
 * When facets are recomputed (e.g. after adding an edge), this preserves existing
 * pitch values by finding the nearest old facet for each new facet.
 *
 * @param {Array} oldFacets - Previous facet list (may have .pitch)
 * @param {Array} newFacets - Newly computed facet list (no .pitch yet)
 * @param {number} threshold - Max centroid distance for a match (~0.0001 ≈ 11m)
 * @returns {Array} newFacets with pitch values transferred from old
 */
export function transferPitchAssignments(oldFacets, newFacets, threshold = 0.0001) {
  if (!oldFacets || oldFacets.length === 0) return newFacets;
  const oldCentroids = oldFacets.map(f => ({ c: getCentroid(f.latlngs), pitch: f.pitch, labels: f.labels }));

  return newFacets.map(nf => {
    const nc = getCentroid(nf.latlngs);
    let bestDist = Infinity;
    let bestMatch = null;
    for (const oc of oldCentroids) {
      if (!oc.pitch && (!oc.labels || oc.labels.length === 0)) continue;
      const d = Math.sqrt((nc[0] - oc.c[0]) ** 2 + (nc[1] - oc.c[1]) ** 2);
      if (d < bestDist && d < threshold) { bestDist = d; bestMatch = oc; }
    }
    if (!bestMatch) return nf;
    const result = { ...nf };
    if (bestMatch.pitch) result.pitch = bestMatch.pitch;
    if (bestMatch.labels && bestMatch.labels.length > 0) result.labels = bestMatch.labels;
    return result;
  });
}

/**
 * Slope factor from pitch string "N/12".
 * Formula: sqrt(1 + (rise/run)^2)  where run = 12.
 * This is the multiplier to convert flat (projected) area to true (slope) area.
 */
export function slopeFactor(pitch) {
  if (!pitch) return 1;
  const match = pitch.match(/^(\d+(?:\.\d+)?)\/12$/);
  if (!match) return PITCH_MULTIPLIERS[pitch] || 1;
  const rise = parseFloat(match[1]);
  return Math.sqrt(1 + (rise / 12) ** 2);
}

/**
 * Normalize angle to 0-180 range
 */
function normalizeAngle(angle) {
  let a = angle % 360;
  if (a < 0) a += 360;
  if (a > 180) a = 360 - a;
  return a;
}

/**
 * Pitch multiplier table: maps pitch (rise/12) to area multiplier
 */
export const PITCH_MULTIPLIERS = {
  '0/12': 1.000,
  '1/12': 1.003,
  '2/12': 1.014,
  '3/12': 1.031,
  '4/12': 1.054,
  '5/12': 1.083,
  '6/12': 1.118,
  '7/12': 1.158,
  '8/12': 1.202,
  '9/12': 1.250,
  '10/12': 1.302,
  '11/12': 1.357,
  '12/12': 1.414,
  '13/12': 1.474,
  '14/12': 1.537,
  '15/12': 1.601,
  '16/12': 1.667,
  '17/12': 1.734,
  '18/12': 1.803,
  '19/12': 1.873,
  '20/12': 1.944,
};

/**
 * Apply pitch multiplier to flat area
 */
export function applyPitchMultiplier(flatArea, pitch) {
  const multiplier = PITCH_MULTIPLIERS[pitch] || 1.0;
  return flatArea * multiplier;
}

/**
 * Calculate number of squares (1 square = 100 sq ft)
 */
export function calculateSquares(areaInSqFt) {
  return areaInSqFt / 100;
}

/**
 * Create a manual edge from two [lat, lng] points.
 * Manual edges are drawn by the user directly (not derived from polygons).
 */
export function createManualEdge(start, end, existingId) {
  const id = existingId || `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const from = turf.point([start[1], start[0]]);
  const to = turf.point([end[1], end[0]]);
  const length = turf.distance(from, to, { units: 'feet' });
  const bearing = turf.bearing(from, to);
  return {
    id,
    polygonId: 'manual',
    index: -1,
    start,
    end,
    length,
    bearing,
    type: 'unclassified',
    color: EDGE_COLOR_MAP['unclassified'],
    manual: true,
  };
}
