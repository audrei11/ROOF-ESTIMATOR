/**
 * geometry.js — Edge-based geometry model for the roof estimator.
 *
 * Source of truth: vertices (map) + edges (array).
 * Faces are derived from edges by computeFacetsFromEdges().
 * Leaflet is purely a rendering layer.
 */
import * as turf from '@turf/turf';
import { EDGE_COLOR_MAP } from './measurements';

const EPS = 0.0000005; // ~5 cm vertex dedup (just for floating-point; real snap is pixel-based)

// ── Vertex helpers ───────────────────────────────

export function generateVertexId() {
  return `v-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Find an existing vertex within EPS, or create a new one.
 * MUTATES the `vertices` object (caller passes a mutable copy).
 * Returns the vertex ID.
 */
export function findOrCreateVertex(vertices, lat, lng) {
  for (const [id, v] of Object.entries(vertices)) {
    if (Math.abs(v.lat - lat) < EPS && Math.abs(v.lng - lng) < EPS) {
      return id;
    }
  }
  const newId = generateVertexId();
  vertices[newId] = { lat, lng };
  return newId;
}

// ── Edge helpers ─────────────────────────────────

function calcEdgeMeasurements(start, end) {
  const from = turf.point([start[1], start[0]]);
  const to = turf.point([end[1], end[0]]);
  return {
    length: turf.distance(from, to, { units: 'feet' }),
    bearing: turf.bearing(from, to),
  };
}

// ── Polygon → vertices + edges ───────────────────

/**
 * Decompose a polygon's latlngs into vertices + edges.
 * @param {{ id: string, latlngs: number[][] }} polygon
 * @param {Object} existingVertices — mutable map, new vertices are added in-place
 * @returns {{ vertices: Object, edges: Array }}
 */
export function polygonToGeometry(polygon, existingVertices) {
  const verts = { ...existingVertices };
  const { id: polyId, latlngs } = polygon;
  if (!latlngs || latlngs.length < 3) return { vertices: verts, edges: [] };

  const vids = latlngs.map(ll => findOrCreateVertex(verts, ll[0], ll[1]));
  const newEdges = [];

  for (let i = 0; i < vids.length; i++) {
    const next = (i + 1) % vids.length;
    const v1 = vids[i];
    const v2 = vids[next];
    if (v1 === v2) continue; // skip zero-length edges (merged vertices)
    const start = [verts[v1].lat, verts[v1].lng];
    const end = [verts[v2].lat, verts[v2].lng];
    const { length, bearing } = calcEdgeMeasurements(start, end);

    newEdges.push({
      id: `${polyId}-edge-${i}`,
      v1, v2, start, end,
      length, bearing,
      type: 'unclassified',
      color: EDGE_COLOR_MAP['unclassified'],
      manual: false,
    });
  }

  return { vertices: verts, edges: newEdges };
}

// ── Edge deletion with orphan cleanup ────────────

/**
 * Remove an edge by ID and delete any vertices that become isolated.
 * Pure function — returns new state objects.
 */
export function removeEdgeAndOrphanVertices(vertices, edges, edgeId) {
  const target = edges.find(e => e.id === edgeId);
  if (!target) return { vertices, edges };

  const newEdges = edges.filter(e => e.id !== edgeId);
  const newVertices = { ...vertices };

  // Check v1 and v2 — if no remaining edge references them, remove
  [target.v1, target.v2].forEach(vid => {
    if (!vid) return;
    const stillUsed = newEdges.some(e => e.v1 === vid || e.v2 === vid);
    if (!stillUsed) {
      delete newVertices[vid];
    }
  });

  console.log('[DeleteEdge] removed edge:', edgeId,
    '| edges before:', edges.length, '→ after:', newEdges.length,
    '| vertices before:', Object.keys(vertices).length, '→ after:', Object.keys(newVertices).length);

  return { vertices: newVertices, edges: newEdges };
}

// ── Manual edge creation with vertex registration ──

export function createManualEdgeWithVertices(vertices, start, end, existingId) {
  const newVertices = { ...vertices };
  const v1 = findOrCreateVertex(newVertices, start[0], start[1]);
  const v2 = findOrCreateVertex(newVertices, end[0], end[1]);

  // Skip zero-length edges (vertices merged to same point)
  if (v1 === v2) return { vertices: newVertices, edge: null };

  const resolvedStart = [newVertices[v1].lat, newVertices[v1].lng];
  const resolvedEnd = [newVertices[v2].lat, newVertices[v2].lng];
  const { length, bearing } = calcEdgeMeasurements(resolvedStart, resolvedEnd);

  const id = existingId || `manual-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`;

  const edge = {
    id, v1, v2,
    start: resolvedStart, end: resolvedEnd,
    length, bearing,
    type: 'unclassified',
    color: EDGE_COLOR_MAP['unclassified'],
    manual: true,
  };

  return { vertices: newVertices, edge };
}

// ── Vertex move ──────────────────────────────────

/**
 * Move a vertex and update all connected edges' geometry.
 */
export function moveVertex(vertices, edges, oldLatLng, newLatLng) {
  // Find the vertex by proximity (use slightly larger threshold for drag matching)
  const MOVE_EPS = 0.000005; // ~0.5m — generous enough for drag callbacks
  let matchedId = null;
  for (const [id, v] of Object.entries(vertices)) {
    if (Math.abs(v.lat - oldLatLng[0]) < MOVE_EPS && Math.abs(v.lng - oldLatLng[1]) < MOVE_EPS) {
      matchedId = id;
      break;
    }
  }
  if (!matchedId) return { vertices, edges };

  const newVertices = {
    ...vertices,
    [matchedId]: { lat: newLatLng[0], lng: newLatLng[1] },
  };

  // Re-resolve start/end + recalc length/bearing on connected edges
  const newEdges = edges.map(e => {
    if (e.v1 !== matchedId && e.v2 !== matchedId) return e;
    const sv = newVertices[e.v1];
    const ev = newVertices[e.v2];
    if (!sv || !ev) return e;
    const start = [sv.lat, sv.lng];
    const end = [ev.lat, ev.lng];
    const { length, bearing } = calcEdgeMeasurements(start, end);
    return { ...e, start, end, length, bearing };
  });

  return { vertices: newVertices, edges: newEdges };
}

// ── Project migration (old polygon format → new edge-based) ──

/**
 * Migrate a saved project from polygon-based to edge-based format.
 * Idempotent — if already migrated, returns unchanged.
 */
export function migrateProject(savedProject) {
  // Already migrated?
  if (savedProject.vertices && Object.keys(savedProject.vertices).length > 0) {
    return savedProject;
  }

  const vertices = {};
  let allEdges = [];

  // Convert polygons → vertices + edges
  if (savedProject.polygons && savedProject.polygons.length > 0) {
    savedProject.polygons.forEach(p => {
      const { edges: polyEdges } = polygonToGeometry(p, vertices);
      allEdges.push(...polyEdges);
    });
  }

  // Merge with saved edges — preserve user-assigned types & manual edges
  if (savedProject.edges && savedProject.edges.length > 0) {
    const geoKey = (s, e) =>
      `${s[0].toFixed(7)},${s[1].toFixed(7)}|${e[0].toFixed(7)},${e[1].toFixed(7)}`;
    const geoMap = new Map();
    savedProject.edges.forEach(e => {
      if (e.start && e.end) {
        geoMap.set(geoKey(e.start, e.end), e);
        geoMap.set(geoKey(e.end, e.start), e);
      }
    });

    // Transfer types from saved edges to polygon-derived edges
    allEdges = allEdges.map(edge => {
      const saved = geoMap.get(geoKey(edge.start, edge.end));
      if (saved && saved.type !== 'unclassified') {
        return { ...edge, type: saved.type, color: saved.color || EDGE_COLOR_MAP[saved.type] };
      }
      return edge;
    });

    // Add manual edges that weren't in any polygon
    savedProject.edges.filter(e => e.manual).forEach(me => {
      // Skip if we already have this edge
      if (allEdges.some(e => e.id === me.id)) return;
      const v1 = findOrCreateVertex(vertices, me.start[0], me.start[1]);
      const v2 = findOrCreateVertex(vertices, me.end[0], me.end[1]);
      if (v1 === v2) return; // skip zero-length edges
      const resolvedStart = [vertices[v1].lat, vertices[v1].lng];
      const resolvedEnd = [vertices[v2].lat, vertices[v2].lng];
      allEdges.push({
        ...me, v1, v2,
        start: resolvedStart, end: resolvedEnd,
      });
    });
  }

  console.log('[migrateProject] converted', savedProject.polygons?.length || 0,
    'polygons →', Object.keys(vertices).length, 'vertices +', allEdges.length, 'edges');

  return { ...savedProject, vertices, edges: allEdges };
}
