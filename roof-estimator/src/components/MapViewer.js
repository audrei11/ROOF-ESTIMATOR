import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { MapContainer, TileLayer, FeatureGroup, Marker, Popup, useMap } from 'react-leaflet';
import { EDGE_DASHED_TYPES, slopeFactor } from '../utils/measurements';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/* ===================================================================
   TILE PROVIDERS
   =================================================================== */
export const TILE_PROVIDERS = {
  googleSatellite: {
    name: 'Google Satellite',
    url: 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    subdomains: '0123',
    attribution: '&copy; Google',
    maxNativeZoom: 21, maxZoom: 22,
  },
  googleHybrid: {
    name: 'Google Hybrid',
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: '0123',
    attribution: '&copy; Google',
    maxNativeZoom: 21, maxZoom: 22,
  },
  esriSatellite: {
    name: 'Esri Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
    maxNativeZoom: 19, maxZoom: 22,
  },
  bingSatellite: {
    name: 'Bing Aerial',
    isBing: true,
    attribution: '&copy; Microsoft',
    maxNativeZoom: 20, maxZoom: 22,
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxNativeZoom: 19, maxZoom: 22,
  },
  openTopo: {
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap contributors',
    maxNativeZoom: 17, maxZoom: 22,
  },
};

const LABELS_LAYER = {
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  maxNativeZoom: 19, maxZoom: 22,
};

/* ===================================================================
   BING TILE LAYER
   =================================================================== */
const BingTileLayer = L.TileLayer.extend({
  getTileUrl: function (coords) {
    const z = this._getZoomForUrl();
    let quadKey = '';
    for (let i = z; i > 0; i--) {
      let digit = 0;
      const mask = 1 << (i - 1);
      if ((coords.x & mask) !== 0) digit++;
      if ((coords.y & mask) !== 0) digit += 2;
      quadKey += digit;
    }
    const server = Math.abs(coords.x + coords.y) % 4;
    return `https://ecn.t${server}.tiles.virtualearth.net/tiles/a${quadKey}?g=14205&mkt=en-US`;
  },
});

/* ===================================================================
   HELPERS
   =================================================================== */
function createAddressIcon(label) {
  return L.divIcon({
    className: 'address-marker-icon',
    html: `<div class="address-marker-pin"><div class="address-marker-label">${label}</div></div>`,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
  });
}

function fmtFtIn(feet) {
  const ft = Math.floor(feet);
  const inches = Math.round((feet - ft) * 12);
  return `${ft}ft ${inches}in`;
}

function fmtArea(sqft) {
  if (sqft >= 1000) return sqft.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' sq ft';
  return sqft.toFixed(0) + ' sq ft';
}

function getCentroid(latlngs) {
  let latSum = 0, lngSum = 0;
  latlngs.forEach(([lat, lng]) => { latSum += lat; lngSum += lng; });
  return [latSum / latlngs.length, lngSum / latlngs.length];
}

/* ===================================================================
   INTERNAL MAP COMPONENTS
   =================================================================== */
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom || map.getZoom());
  }, [center, zoom, map]);
  return null;
}

/**
 * BearingController — Syncs React rotation state with leaflet-rotate's
 * projection-level bearing via map.setBearing(). No CSS transforms —
 * everything (tiles + overlays) rotates at the coordinate level so
 * hit-testing, drawing, and cursor alignment stay correct.
 */
function BearingController({ rotation, onBearingChange }) {
  const map = useMap();

  // React state -> map bearing
  useEffect(() => {
    if (map.setBearing) {
      map.setBearing(rotation);
    }
  }, [rotation, map]);

  // Map bearing -> React state (touch / gesture rotation syncs back)
  useEffect(() => {
    if (!onBearingChange) return;
    const onRotate = () => {
      const bearing = map.getBearing ? map.getBearing() : 0;
      onBearingChange(Math.round(bearing));
    };
    map.on('rotate', onRotate);
    return () => map.off('rotate', onRotate);
  }, [map, onBearingChange]);

  return null;
}

/**
 * Exposes zoom methods to parent via ref callback.
 */
function ZoomController({ zoomInRef, zoomOutRef }) {
  const map = useMap();
  useEffect(() => {
    if (zoomInRef) zoomInRef.current = () => map.zoomIn();
    if (zoomOutRef) zoomOutRef.current = () => map.zoomOut();
  }, [map, zoomInRef, zoomOutRef]);
  return null;
}

/**
 * Imperative edge renderer — creates Leaflet layers directly on the map
 * instead of using React-Leaflet's declarative <Polyline> components.
 *
 * This gives full control over:
 *   - Pane assignment (edgesPane, z-index 450, always above polygon fills)
 *   - Pointer-events on invisible hitbox paths (forced to 'all')
 *   - Click handler registration via native Leaflet events
 *   - Dark outline behind each edge so all colors (including white) stay visible
 */
function EdgeRenderer({ edges, showEdgeColors, activeEdgeTool, activeTab, selectedEdgeId, onEdgeClick }) {
  const map = useMap();
  const layersRef = useRef([]);
  const callbackRef = useRef(onEdgeClick);

  // Keep callback ref fresh without triggering layer re-creation
  useEffect(() => { callbackRef.current = onEdgeClick; }, [onEdgeClick]);

  // Hide edges on Facets tab — user only wants to see facet fills/colors there
  const shouldShow = !!(edges && edges.length > 0) && activeTab !== 'facets';
  // Edges are interactive (clickable) on the Edges tab AND during delete_edge mode.
  // On Draw tab they're visible for reference but MUST NOT intercept map clicks.
  const edgesInteractive = activeTab === 'edges' || activeEdgeTool === 'delete_edge';

  useEffect(() => {
    // Cleanup previous layers
    layersRef.current.forEach(l => { try { map.removeLayer(l); } catch (_) {} });
    layersRef.current = [];

    if (!shouldShow || !edges || edges.length === 0) return;

    // Ensure edgesPane exists (child of rotatePane so it rotates with the map)
    if (!map.getPane('edgesPane')) {
      const parentPane = map.getPane('rotatePane') || map.getPane('mapPane');
      const pane = map.createPane('edgesPane', parentPane);
      pane.style.zIndex = '450';
    }

    // On draw tab: disable pointer-events on entire edges pane so clicks pass through to map
    const edgesPane = map.getPane('edgesPane');
    if (edgesPane) {
      edgesPane.style.pointerEvents = edgesInteractive ? '' : 'none';
    }

    // Use Roofr-style cyan for Draw + Edges tabs
    const useCyanStyle = activeTab === 'draw' || activeTab === 'edges';
    const cyanColor = '#00d4ff';

    edges.forEach(edge => {
      const isDashed = EDGE_DASHED_TYPES.has(edge.type);
      const isSelected = selectedEdgeId === edge.id;
      const baseWeight = isSelected ? 8 : 4;
      const dimFactor = edgesInteractive ? 1 : (activeTab === 'facets' ? 0.85 : (useCyanStyle ? 0.95 : 0.5));
      // Cyan for unclassified edges; classified edges show their type color
      const displayColor = useCyanStyle
        ? (edge.type === 'unclassified' ? cyanColor : edge.color)
        : edge.color;
      const mid = [
        (edge.start[0] + edge.end[0]) / 2,
        (edge.start[1] + edge.end[1]) / 2,
      ];

      // 1. Glow ring behind selected edge (edges tab only)
      if (isSelected && edgesInteractive) {
        const glow = L.polyline([edge.start, edge.end], {
          color: '#ffffff', weight: 12, opacity: 0.35,
          interactive: false, pane: 'edgesPane',
        });
        glow.addTo(map);
        layersRef.current.push(glow);
      }

      // 2. Invisible wide hitbox — edges tab only (would block draw clicks otherwise)
      if (edgesInteractive) {
        const hitbox = L.polyline([edge.start, edge.end], {
          stroke: true, color: '#000000', weight: 20, opacity: 0,
          interactive: true, pane: 'edgesPane',
        });
        hitbox.addTo(map);
        if (hitbox._path) {
          hitbox._path.style.pointerEvents = 'all';
          hitbox._path.style.cursor = 'pointer';
        }
        hitbox.on('click', (e) => {
          L.DomEvent.stop(e);
          callbackRef.current?.(edge.id);
        });
        layersRef.current.push(hitbox);
      }

      // 3. Dark outline — ensures edge is visible over any background
      const shadow = L.polyline([edge.start, edge.end], {
        color: '#000000', weight: baseWeight + 2,
        opacity: 0.25 * dimFactor, interactive: false, pane: 'edgesPane',
      });
      shadow.addTo(map);
      layersRef.current.push(shadow);

      // 4. Visible colored edge line
      const line = L.polyline([edge.start, edge.end], {
        color: displayColor, weight: baseWeight,
        opacity: (isSelected ? 1 : 0.9) * dimFactor,
        dashArray: isDashed ? '8,5' : undefined,
        interactive: false, pane: 'edgesPane',
      });
      line.addTo(map);
      if (edgesInteractive) {
        line.options.interactive = true;
        line.on('click', (e) => {
          L.DomEvent.stop(e);
          callbackRef.current?.(edge.id);
        });
        line.on('mouseover', () => {
          line.setStyle({ weight: baseWeight + 3, opacity: 1 });
          shadow.setStyle({ weight: baseWeight + 5 });
          if (line._path) line._path.style.cursor = 'pointer';
        });
        line.on('mouseout', () => {
          line.setStyle({ weight: baseWeight, opacity: isSelected ? 1 : 0.9 });
          shadow.setStyle({ weight: baseWeight + 2 });
        });
      }
      layersRef.current.push(line);

      // 5. Label: cyan measurement-only for unclassified; type-colored for classified
      const isUnclassified = edge.type === 'unclassified';
      let labelHtml;
      if (useCyanStyle && isUnclassified) {
        // Unclassified on Draw/Edges: cyan measurement only
        labelHtml = `<span class="etl-inner etl-draw${isSelected ? ' etl-selected' : ''}" style="opacity:0.95">
            ${fmtFtIn(edge.length)}
          </span>`;
      } else {
        // Classified edge or Facets tab: show type color + measurement
        labelHtml = `<span class="etl-inner${isSelected ? ' etl-selected' : ''}" style="background:${displayColor};color:${['ridge', 'rake', 'unspecified'].includes(edge.type) ? '#1e293b' : '#fff'};${edgesInteractive ? 'cursor:pointer' : (activeTab === 'facets' ? 'opacity:0.85' : 'opacity:0.5')}">
            ${fmtFtIn(edge.length)}
          </span>`;
      }
      const label = L.marker(mid, {
        interactive: edgesInteractive,
        zIndexOffset: 900,
        icon: L.divIcon({
          className: 'edge-type-label',
          html: labelHtml,
          iconSize: [0, 0],
        }),
      });
      label.addTo(map);
      if (edgesInteractive) {
        label.on('click', (e) => {
          L.DomEvent.stop(e);
          callbackRef.current?.(edge.id);
        });
      }
      layersRef.current.push(label);
    });

    return () => {
      layersRef.current.forEach(l => { try { map.removeLayer(l); } catch (_) {} });
      layersRef.current = [];
      // Reset pane pointer-events on cleanup
      const pane = map.getPane('edgesPane');
      if (pane) pane.style.pointerEvents = '';
    };
  }, [map, edges, shouldShow, selectedEdgeId, edgesInteractive, activeTab]);

  return null;
}

/**
 * EdgeDrawer — Roofr-style continuous line drawing tool.
 *
 * When activeEdgeTool === 'draw_edge':
 *   - Click to place vertices; edges chain continuously between them
 *   - Full crosshair overlay follows cursor (Roofr style)
 *   - Live measurement preview on the current segment
 *   - Vertex snapping to existing edge endpoints
 *   - Auto edge-angle snap (parallel/perpendicular to existing edges)
 *   - Shift = force snap to nearest edge angle
 *   - Double-click or Enter = finish current chain, ready for next
 *   - Escape = cancel current chain, stay in draw mode
 *   - Ctrl+Z = undo last vertex (and remove its edge from state)
 */
function EdgeDrawer({ activeEdgeTool, drawModeActive, onManualEdgeCreated, onDeleteEdge, edges: existingEdges }) {
  const map = useMap();
  const callbackRef = useRef(onManualEdgeCreated);
  const deleteRef = useRef(onDeleteEdge);
  const edgesRef = useRef(existingEdges);

  useEffect(() => { callbackRef.current = onManualEdgeCreated; }, [onManualEdgeCreated]);
  useEffect(() => { deleteRef.current = onDeleteEdge; }, [onDeleteEdge]);
  useEffect(() => { edgesRef.current = existingEdges; }, [existingEdges]);

  // Activate when edge tool is 'draw_edge' OR when draw mode is triggered (Roofr-style)
  const isActive = activeEdgeTool === 'draw_edge' || drawModeActive;

  useEffect(() => {
    if (!isActive) {
      map.getContainer().classList.remove('edge-draw-mode');
      return;
    }

    // ═══════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════
    let vertices = [];           // L.LatLng array for current chain
    let vertexMarkers = [];      // circle markers at each placed vertex
    let chainEdgeIds = [];       // IDs of edges created in this chain (for undo)
    let previewLine = null;      // dashed line from last vertex → cursor
    let midpointLabel = null;    // measurement on preview line
    let crosshairOverlay = null; // full-screen crosshair element
    let containerRect = null;    // cached bounding rect for crosshair
    let snapHighlight = null;    // blue ring when near snap target
    let snapGuide = null;        // guide line when aligned
    let closeZoneRing = null;    // green dashed ring around first vertex (3+ vertices)
    let closingIndicator = null; // green dashed line cursor → first vertex
    let closeTooltip = null;     // "Click to close" label
    let shiftHeld = false;
    let altHeld = false;
    let justFinished = false;    // double-click protection

    // ═══════════════════════════════════════════
    // MATH HELPERS — screen-pixel space (rotation-safe)
    // ═══════════════════════════════════════════
    const distFeet = (a, b) => L.latLng(a).distanceTo(L.latLng(b)) * 3.28084;

    const fmtFtIn = (feet) => {
      const ft = Math.floor(feet);
      const inches = Math.round((feet - ft) * 12);
      return `${ft}ft ${inches}in`;
    };

    // Screen-space bearing: 0°=up, 90°=right, 180°=down, 270°=left
    const getBearing = (p1, p2) => {
      const px1 = map.latLngToContainerPoint(L.latLng(p1));
      const px2 = map.latLngToContainerPoint(L.latLng(p2));
      const dx = px2.x - px1.x;
      const dy = px1.y - px2.y; // screen Y inverted
      return (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
    };

    // Project in screen-pixel space, convert back to latLng
    const projectPt = (origin, angleDeg, pxDist) => {
      const px = map.latLngToContainerPoint(L.latLng(origin));
      const rad = angleDeg * Math.PI / 180;
      return map.containerPointToLatLng(L.point(
        px.x + Math.sin(rad) * pxDist,
        px.y - Math.cos(rad) * pxDist
      ));
    };

    // Pixel distance between two latLng points
    const pxDist = (a, b) => {
      return map.latLngToContainerPoint(L.latLng(a))
        .distanceTo(map.latLngToContainerPoint(L.latLng(b)));
    };

    // ═══════════════════════════════════════════
    // EDGE-ANGLE SNAPPING
    // Snap to parallel / perpendicular of existing edges.
    // No fixed H/V — adapts to actual roof geometry.
    // ═══════════════════════════════════════════
    const getExistingBearings = () => {
      const bearings = [];
      (edgesRef.current || []).forEach(e => {
        const from = L.latLng(e.start[0], e.start[1]);
        const to = L.latLng(e.end[0], e.end[1]);
        bearings.push(getBearing(from, to));
      });
      for (let i = 0; i < vertices.length - 1; i++) {
        bearings.push(getBearing(vertices[i], vertices[i + 1]));
      }
      return bearings;
    };

    // Build candidate angles: cardinal H/V + each edge bearing + 90° perpendicular
    const getSnapCandidates = () => {
      const candidates = new Set([0, 90, 180, 270]); // always include cardinal H/V
      for (const eb of getExistingBearings()) {
        candidates.add(eb);
        candidates.add((eb + 90) % 360);
        candidates.add((eb + 180) % 360);
        candidates.add((eb + 270) % 360);
      }
      return [...candidates];
    };

    // Auto edge-angle alignment (replaces cardinal H/V check)
    const checkAlignment = (last, cursor, thresholdDeg = 8) => {
      const candidates = getSnapCandidates();
      if (candidates.length === 0) return { aligned: false, snappedAngle: null };
      const bearing = getBearing(last, cursor);
      let bestAngle = null;
      let smallestDiff = Infinity;
      for (const c of candidates) {
        const diff = Math.abs(bearing - c);
        const nd = Math.min(diff, 360 - diff);
        if (nd < smallestDiff) { smallestDiff = nd; bestAngle = c; }
      }
      if (smallestDiff < thresholdDeg) {
        return { aligned: true, snappedAngle: bestAngle };
      }
      return { aligned: false, snappedAngle: null };
    };

    // Forced snap (Shift held) — snap to nearest edge angle, no threshold
    const getSnappedPoint = (last, cursor) => {
      const candidates = getSnapCandidates();
      if (candidates.length === 0) return cursor; // no edges yet — free draw
      const bearing = getBearing(last, cursor);
      const dist = pxDist(last, cursor);
      let bestAngle = candidates[0];
      let smallestDiff = Infinity;
      for (const c of candidates) {
        const diff = Math.abs(bearing - c);
        const nd = Math.min(diff, 360 - diff);
        if (nd < smallestDiff) { smallestDiff = nd; bestAngle = c; }
      }
      return projectPt(last, bestAngle, dist);
    };

    // ═══════════════════════════════════════════
    // VERTEX SNAPPING (generous threshold for easy connections)
    // ═══════════════════════════════════════════
    const SNAP_PX = 25;
    const findSnapTarget = (cursor, thresholdPx = SNAP_PX) => {
      const cursorPx = map.latLngToContainerPoint(cursor);
      const pts = [];
      (edgesRef.current || []).forEach(e => {
        pts.push(L.latLng(e.start[0], e.start[1]));
        pts.push(L.latLng(e.end[0], e.end[1]));
      });
      vertices.forEach(v => pts.push(L.latLng(v)));
      map.eachLayer(layer => {
        if (layer.getLatLngs && layer.options && layer.options.fillColor) {
          try {
            const lls = layer.getLatLngs();
            const ring = Array.isArray(lls[0]) ? lls[0] : lls;
            ring.forEach(ll => { if (ll.lat !== undefined) pts.push(ll); });
          } catch (_) {}
        }
      });
      let nearest = null;
      let nearestDist = Infinity;
      for (const v of pts) {
        const vPx = map.latLngToContainerPoint(v);
        const d = cursorPx.distanceTo(vPx);
        if (d < thresholdPx && d < nearestDist) {
          nearest = L.latLng(v.lat, v.lng);
          nearestDist = d;
        }
      }
      return nearest;
    };

    // ═══════════════════════════════════════════
    // CROSSHAIR OVERLAY (Roofr-style)
    // ═══════════════════════════════════════════
    const onNativeMouseMove = (e) => {
      if (!crosshairOverlay) return;
      if (!containerRect) containerRect = map.getContainer().getBoundingClientRect();
      crosshairOverlay.style.setProperty('--cx', (e.clientX - containerRect.left) + 'px');
      crosshairOverlay.style.setProperty('--cy', (e.clientY - containerRect.top) + 'px');
    };

    const refreshRect = () => { containerRect = map.getContainer().getBoundingClientRect(); };

    const createCrosshairOverlay = () => {
      if (crosshairOverlay) return;
      const container = map.getContainer();
      containerRect = container.getBoundingClientRect();
      crosshairOverlay = document.createElement('div');
      crosshairOverlay.className = 'roofr-crosshair-overlay';
      crosshairOverlay.innerHTML = `
        <div class="rch-hl"></div>
        <div class="rch-hr"></div>
        <div class="rch-vt"></div>
        <div class="rch-vb"></div>
        <div class="rch-square"></div>
      `;
      container.appendChild(crosshairOverlay);
      container.addEventListener('mousemove', onNativeMouseMove, { passive: true });
      map.on('move', refreshRect);
      map.on('resize', refreshRect);
    };

    const removeCrosshairOverlay = () => {
      const container = map.getContainer();
      container.removeEventListener('mousemove', onNativeMouseMove);
      map.off('move', refreshRect);
      map.off('resize', refreshRect);
      if (crosshairOverlay && crosshairOverlay.parentNode) {
        crosshairOverlay.parentNode.removeChild(crosshairOverlay);
      }
      crosshairOverlay = null;
      containerRect = null;
    };

    // ═══════════════════════════════════════════
    // CHAIN MANAGEMENT
    // ═══════════════════════════════════════════
    const cleanupVisuals = () => {
      vertexMarkers.forEach(m => { try { map.removeLayer(m); } catch (_) {} });
      if (previewLine) { try { map.removeLayer(previewLine); } catch (_) {} }
      if (midpointLabel) { try { map.removeLayer(midpointLabel); } catch (_) {} }
      if (snapHighlight) { try { map.removeLayer(snapHighlight); } catch (_) {} }
      if (snapGuide) { try { map.removeLayer(snapGuide); } catch (_) {} }
      if (closeZoneRing) { try { map.removeLayer(closeZoneRing); } catch (_) {} }
      if (closingIndicator) { try { map.removeLayer(closingIndicator); } catch (_) {} }
      if (closeTooltip) { try { map.removeLayer(closeTooltip); } catch (_) {} }
      vertexMarkers = [];
      previewLine = null;
      midpointLabel = null;
      snapHighlight = null;
      snapGuide = null;
      closeZoneRing = null;
      closingIndicator = null;
      closeTooltip = null;
    };

    const finishChain = () => {
      cleanupVisuals();
      vertices = [];
      chainEdgeIds = [];
      // Stay in draw mode — crosshair + listeners remain active
    };

    const undoLastVertex = () => {
      if (vertices.length === 0) return;
      vertices.pop();
      const m = vertexMarkers.pop();
      if (m) { try { map.removeLayer(m); } catch (_) {} }
      // If an edge was created with this vertex, remove it from state
      if (chainEdgeIds.length > 0 && chainEdgeIds.length >= vertices.length) {
        const lastId = chainEdgeIds.pop();
        if (lastId) deleteRef.current?.(lastId);
      }
    };

    // ═══════════════════════════════════════════
    // MAP CLICK — place vertex & chain edges
    // ═══════════════════════════════════════════
    const onClick = (e) => {
      if (justFinished) return;
      let point = e.latlng;

      // ── Close detection: click near first vertex to close the shape ──
      if (vertices.length >= 3) {
        const firstPx = map.latLngToContainerPoint(vertices[0]);
        const clickPx = map.latLngToContainerPoint(point);
        if (firstPx.distanceTo(clickPx) < 40) {
          // Create closing edge (last vertex → first vertex)
          const last = vertices[vertices.length - 1];
          const first = vertices[0];
          const id = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          callbackRef.current?.([last.lat, last.lng], [first.lat, first.lng], id);
          chainEdgeIds.push(id);
          justFinished = true;
          setTimeout(() => { justFinished = false; }, 300);
          finishChain();
          return;
        }
      }

      // 1) Vertex snap — only within 10px so it doesn't hijack your click
      const snapTarget = findSnapTarget(point, 10);
      if (snapTarget) {
        point = snapTarget;
      }
      // 2) Shift-snap to nearest edge angle (only when Shift held)
      else if (shiftHeld && vertices.length > 0) {
        const last = vertices[vertices.length - 1];
        point = getSnappedPoint(last, point);
      }

      // Deduplicate (same-pixel protection)
      if (vertices.length > 0) {
        const lastPx = map.latLngToContainerPoint(vertices[vertices.length - 1]);
        const clickPx = map.latLngToContainerPoint(point);
        if (lastPx.distanceTo(clickPx) < 5) return;
      }

      vertices.push(point);

      // First vertex: large green bullseye marker
      if (vertices.length === 1) {
        const marker = L.circleMarker(point, {
          radius: 8, fillColor: '#22c55e', fillOpacity: 1,
          color: '#ffffff', weight: 3, opacity: 1,
          interactive: false, pane: 'overlayPane',
        });
        marker.addTo(map);
        vertexMarkers.push(marker);
      } else {
        // Subsequent vertices: small white dot
        const marker = L.circleMarker(point, {
          radius: 4, fillColor: '#ffffff', fillOpacity: 1,
          color: '#ffffff', weight: 2, opacity: 0.9,
          interactive: false, pane: 'overlayPane',
        });
        marker.addTo(map);
        vertexMarkers.push(marker);
      }

      // Show close-zone ring around first vertex when 3+ vertices
      if (vertices.length === 3) {
        closeZoneRing = L.circleMarker(vertices[0], {
          radius: 40, color: '#22c55e', fillColor: '#22c55e',
          fillOpacity: 0.08, weight: 2, dashArray: '5,4',
          interactive: false, pane: 'overlayPane',
        });
        closeZoneRing.addTo(map);
      }

      // If 2+ vertices, create an edge in state
      if (vertices.length >= 2) {
        const start = vertices[vertices.length - 2];
        const end = vertices[vertices.length - 1];
        const id = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        callbackRef.current?.([start.lat, start.lng], [end.lat, end.lng], id);
        chainEdgeIds.push(id);
      }
    };

    // ═══════════════════════════════════════════
    // MOUSE MOVE — preview, measurements, snapping
    // ═══════════════════════════════════════════
    const onMouseMove = (e) => {
      // Always keep crosshair updated
      if (!crosshairOverlay) createCrosshairOverlay();

      if (vertices.length === 0) return;

      let cursor = e.latlng;
      const last = vertices[vertices.length - 1];
      let isSnapped = false;
      let isAligned = false;
      let alignAngle = null;

      // 1) Vertex snap — only within 10px (tight, won't hijack your cursor)
      const snapTarget = findSnapTarget(cursor, 10);
      if (snapTarget) {
        cursor = snapTarget;
        isSnapped = true;
        const alignment = checkAlignment(last, cursor, 10);
        isAligned = alignment.aligned;
        alignAngle = alignment.snappedAngle;
      }
      // 2) Shift-snap to nearest edge angle
      else if (shiftHeld) {
        cursor = getSnappedPoint(last, cursor);
        isAligned = true;
        alignAngle = getBearing(last, cursor);
      }
      // 3) Visual-only alignment check (cursor stays free, line color changes)
      else {
        const alignment = checkAlignment(last, cursor, 5);
        isAligned = alignment.aligned;
        alignAngle = alignment.snappedAngle;
      }

      // ── Snap highlight ring (green = connection point) ──
      if (snapHighlight) { map.removeLayer(snapHighlight); snapHighlight = null; }
      if (isSnapped) {
        snapHighlight = L.circleMarker(cursor, {
          radius: 14, color: '#22c55e', fillColor: '#22c55e',
          fillOpacity: 0.2, weight: 3,
          interactive: false, pane: 'overlayPane',
        });
        snapHighlight.addTo(map);
      }

      // Toggle snapped/aligned class on crosshair
      if (crosshairOverlay) {
        crosshairOverlay.classList.toggle('snapped', isSnapped);
        crosshairOverlay.classList.toggle('aligned', isAligned && !isSnapped);
      }

      // ── Preview line (white = aligned/snapped, red = free) ──
      const lineColor = isAligned ? '#ffffff' : '#ef4444';
      if (previewLine) map.removeLayer(previewLine);
      previewLine = L.polyline([last, cursor], {
        color: lineColor, weight: 2.5,
        opacity: 0.9, interactive: false,
      });
      previewLine.addTo(map);

      // ── Midpoint measurement label ──
      if (midpointLabel) { map.removeLayer(midpointLabel); midpointLabel = null; }
      const dist = distFeet(last, cursor);
      if (dist > 0.5) {
        const mid = L.latLng((last.lat + cursor.lat) / 2, (last.lng + cursor.lng) / 2);
        midpointLabel = L.marker(mid, {
          icon: L.divIcon({
            className: 'draw-midpoint-label',
            html: `<span>${fmtFtIn(dist)}</span>`,
            iconSize: [0, 0],
          }),
          interactive: false, zIndexOffset: 2000,
        });
        midpointLabel.addTo(map);
      }

      // ── Snap guide line ──
      if (snapGuide) { map.removeLayer(snapGuide); snapGuide = null; }
      if (isAligned && alignAngle !== null && !isSnapped) {
        const ext = Math.max(pxDist(last, cursor) * 2, 50);
        const p1 = projectPt(last, alignAngle, ext * 1.5);
        const p2 = projectPt(last, (alignAngle + 180) % 360, ext * 0.3);
        snapGuide = L.polyline([p2, last, p1], {
          color: '#3b82f6', weight: 1.5, dashArray: '6,4', opacity: 0.5, interactive: false,
        });
        snapGuide.addTo(map);
      }

      // ── Close indicator: green dashed line + tooltip when near first vertex ──
      if (closingIndicator) { map.removeLayer(closingIndicator); closingIndicator = null; }
      if (closeTooltip) { map.removeLayer(closeTooltip); closeTooltip = null; }
      if (vertices.length >= 3) {
        const firstPx = map.latLngToContainerPoint(vertices[0]);
        const cursorPx = map.latLngToContainerPoint(cursor);
        const distToFirst = firstPx.distanceTo(cursorPx);
        if (distToFirst < 45) {
          // Green dashed line from cursor to first vertex
          closingIndicator = L.polyline([cursor, vertices[0]], {
            color: '#22c55e', weight: 3, dashArray: '6,4', opacity: 0.95, interactive: false,
          });
          closingIndicator.addTo(map);
          // "Click to close" tooltip
          closeTooltip = L.marker(vertices[0], {
            icon: L.divIcon({
              className: 'draw-close-tooltip',
              html: '<span>Click to close</span>',
              iconSize: [0, 0], iconAnchor: [0, -18],
            }),
            interactive: false, zIndexOffset: 3000,
          });
          closeTooltip.addTo(map);
          // Override preview line color to green
          if (previewLine) {
            previewLine.setStyle({ color: '#22c55e' });
          }
        }
      }
    };

    // ═══════════════════════════════════════════
    // DOUBLE-CLICK — finish chain
    // ═══════════════════════════════════════════
    const onDblClick = (e) => {
      L.DomEvent.stop(e);
      // The single-click fires first, adding an extra vertex+edge — undo it
      if (vertices.length > 1 && chainEdgeIds.length > 0) {
        undoLastVertex();
      }
      justFinished = true;
      setTimeout(() => { justFinished = false; }, 300);
      finishChain();
    };

    // ═══════════════════════════════════════════
    // KEYBOARD
    // ═══════════════════════════════════════════
    const onKeyDown = (e) => {
      if (e.key === 'Shift') shiftHeld = true;
      if (e.key === 'Alt') { altHeld = true; e.preventDefault(); }
      if (e.key === 'Escape') finishChain();
      if (e.key === 'Enter') finishChain();
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        undoLastVertex();
      }
    };

    const onKeyUp = (e) => {
      if (e.key === 'Shift') shiftHeld = false;
      if (e.key === 'Alt') altHeld = false;
    };

    const onWindowBlur = () => { shiftHeld = false; altHeld = false; };

    // ═══════════════════════════════════════════
    // SETUP
    // ═══════════════════════════════════════════
    map.getContainer().classList.add('edge-draw-mode');
    map.doubleClickZoom.disable();
    createCrosshairOverlay();
    map.on('click', onClick);
    map.on('mousemove', onMouseMove);
    map.on('dblclick', onDblClick);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);

    // ═══════════════════════════════════════════
    // CLEANUP (when tool deactivated)
    // ═══════════════════════════════════════════
    return () => {
      map.off('click', onClick);
      map.off('mousemove', onMouseMove);
      map.off('dblclick', onDblClick);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      cleanupVisuals();
      removeCrosshairOverlay();
      map.getContainer().classList.remove('edge-draw-mode');
      map.doubleClickZoom.enable();
    };
  }, [map, isActive]);

  return null;
}

/**
 * FacetLabels — Roofr-style labels at each polygon centroid on the Facets tab.
 *
 * Matching Roofr reference:
 *   - Unassigned (no pitch): show flat area "522 sqft" on red overlay
 *   - Assigned (has pitch): show "5/12" + adjusted sqft on transparent facet
 */
function FacetLabels({ polygons, activeTab }) {
  const map = useMap();
  const layersRef = useRef([]);

  useEffect(() => {
    // Cleanup previous labels
    layersRef.current.forEach(l => { try { map.removeLayer(l); } catch (_) {} });
    layersRef.current = [];

    if (activeTab !== 'facets' || !polygons || polygons.length === 0) return;

    polygons.forEach((p) => {
      const centroid = getCentroid(p.latlngs);
      const hasPitch = !!p.pitch && p.pitch !== '0/12';

      // Build label tags line from labels array (backward-compat with old single label)
      const labelsArr = Array.isArray(p.labels) ? p.labels : (p.label ? [p.label] : []);
      const labelsHtml = labelsArr.length > 0
        ? `<span class="fal-tags">${labelsArr.join(' &middot; ')}</span>`
        : '';

      let html;
      if (hasPitch) {
        const mult = slopeFactor(p.pitch);
        const flatArea = Math.round(p.area);
        const trueArea = Math.round(p.area * mult);
        html = `<span class="fal-inner fal-pitched">
          <span class="fal-pitch">${p.pitch}</span>
          <span class="fal-area">${trueArea} sqft</span>
          <span class="fal-flat">${flatArea} flat &times; ${mult.toFixed(3)}</span>
          ${labelsHtml}
        </span>`;
      } else {
        const flatArea = Math.round(p.area || 0);
        const facetNum = polygons.indexOf(p) + 1;
        html = `<span class="fal-inner fal-unassigned">
          <span class="fal-name">Facet ${facetNum}</span>
          <span class="fal-area">${flatArea} sqft</span>
          ${labelsHtml}
        </span>`;
      }

      const label = L.marker(centroid, {
        interactive: false,
        zIndexOffset: 800,
        icon: L.divIcon({
          className: 'facet-area-label',
          html,
          iconSize: [0, 0],
        }),
      });
      label.addTo(map);
      layersRef.current.push(label);

      // Side measurement labels for pitched facets (Roofr-style)
      if (hasPitch && p.latlngs && p.latlngs.length >= 3) {
        for (let i = 0; i < p.latlngs.length; i++) {
          const a = p.latlngs[i];
          const b = p.latlngs[(i + 1) % p.latlngs.length];
          const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          const distMeters = L.latLng(a).distanceTo(L.latLng(b));
          const distFeet = distMeters * 3.28084;
          const sideLabel = L.marker(mid, {
            interactive: false,
            zIndexOffset: 790,
            icon: L.divIcon({
              className: 'facet-side-label',
              html: `<span class="fsl-inner">${fmtFtIn(distFeet)}</span>`,
              iconSize: [0, 0],
            }),
          });
          sideLabel.addTo(map);
          layersRef.current.push(sideLabel);
        }
      }
    });

    return () => {
      layersRef.current.forEach(l => { try { map.removeLayer(l); } catch (_) {} });
      layersRef.current = [];
    };
  }, [map, polygons, activeTab]);

  return null;
}

/**
 * FacetOverlay — imperative red/transparent polygon overlay for the Facets tab.
 *
 * Reads from React `polygons` state (NOT from FeatureGroup layers) so it works
 * regardless of whether polygons were drawn in this session or loaded from storage.
 *
 * Renders on a dedicated facetsPane (z-index 401) above the default overlayPane (400)
 * but below the edgesPane (450).
 */
function FacetOverlay({ polygons, activeTab, onFacetAssign, selectedFacetId, facetPitchBrush }) {
  const map = useMap();
  const layersRef = useRef([]);
  const rendererRef = useRef(null);
  const domHandlersRef = useRef([]);
  const callbackRef = useRef(onFacetAssign);
  useEffect(() => { callbackRef.current = onFacetAssign; }, [onFacetAssign]);

  useEffect(() => {
    // Cleanup previous polygon layers
    layersRef.current.forEach(l => { try { map.removeLayer(l); } catch (_) {} });
    layersRef.current = [];
    // Cleanup native DOM click handlers from previous render
    domHandlersRef.current.forEach(({ el, fn }) => {
      try { el.removeEventListener('click', fn); } catch (_) {}
    });
    domHandlersRef.current = [];

    if (!polygons || polygons.length === 0) return;

    const isFacets = activeTab === 'facets';

    // ── Create facetsPane (child of rotatePane so it rotates with the map) ──
    if (!map.getPane('facetsPane')) {
      const parentPane = map.getPane('rotatePane') || map.getPane('mapPane');
      map.createPane('facetsPane', parentPane);
    }
    const facetsPane = map.getPane('facetsPane');
    // On facets tab: z-index 451 (ABOVE edgesPane at 450); otherwise 401
    facetsPane.style.zIndex = isFacets ? '451' : '401';
    // Ensure the pane itself allows pointer events on facets tab
    facetsPane.style.pointerEvents = isFacets ? 'auto' : 'none';

    // ── Dedicated SVG renderer pinned to facetsPane (persists across re-renders) ──
    if (!rendererRef.current) {
      rendererRef.current = L.svg({ pane: 'facetsPane' });
    }

    // Cursor: crosshair when pitch brush is active on Facets tab
    const container = map.getContainer();
    if (isFacets && facetPitchBrush) {
      container.classList.add('facet-brush-cursor');
    } else {
      container.classList.remove('facet-brush-cursor');
    }

    polygons.forEach(p => {
      const hasPitch = !!p.pitch && p.pitch !== '0/12';
      const isSelected = selectedFacetId === p.id;

      // ── Style per tab & state ──
      let style;
      if (!isFacets) {
        // Don't render facet overlays on non-facets tabs (no more dashed lines)
        return;
      } else if (isSelected) {
        style = {
          fillColor: hasPitch ? '#fbbf24' : '#dc2626',
          fillOpacity: hasPitch ? 0.08 : 0.25,
          color: hasPitch ? '#fbbf24' : '#ef4444', weight: 3, opacity: 1,
          dashArray: null, interactive: true,
        };
      } else if (hasPitch) {
        // Completely invisible — stroke:false + fill:false so SVG renders nothing at all
        style = {
          stroke: false, fill: false,
          interactive: true,
        };
      } else {
        // No pitch — slightly visible so user knows to assign
        style = {
          fillColor: '#dc2626', fillOpacity: 0.15,
          color: '#ef4444', weight: 2, opacity: 0.9,
          dashArray: null, interactive: true,
        };
      }

      const poly = L.polygon(p.latlngs, {
        ...style,
        pane: 'facetsPane',
        renderer: rendererRef.current,
      });

      // ── Hover effects via Leaflet events (these don't cause double-fire) ──
      if (isFacets) {
        poly.on('mouseover', () => {
          if (isSelected) return;
          poly.setStyle(hasPitch
            ? { fillOpacity: 0.10, weight: 2.5, color: '#fbbf24', opacity: 1 }
            : { fillOpacity: 0.20, fillColor: '#f87171', color: '#f87171' });
        });
        poly.on('mouseout', () => {
          if (isSelected) return;
          poly.setStyle(hasPitch
            ? { stroke: false, fill: false }
            : { fillOpacity: 0.15, fillColor: '#dc2626', color: '#ef4444', weight: 2 });
        });
      }

      poly.addTo(map);
      layersRef.current.push(poly);

      // ── SINGLE click handler via native DOM (no Leaflet .on('click')) ──
      // Using ONLY native DOM handler prevents the double-fire bug:
      // Leaflet's .on('click') + native addEventListener both fire for the same
      // browser click, causing setSelectedFacetId to toggle ON→OFF (net: nothing).
      if (isFacets) {
        requestAnimationFrame(() => {
          const pathEl = poly._path || (poly.getElement && poly.getElement());
          if (pathEl) {
            pathEl.style.pointerEvents = 'all';
            pathEl.style.cursor = 'pointer';
            const handler = (e) => {
              e.stopPropagation();
              e.preventDefault();
              callbackRef.current?.(p.id);
            };
            pathEl.addEventListener('click', handler);
            domHandlersRef.current.push({ el: pathEl, fn: handler });
          }
        });
      }

      // Corner dots for pitched facets
      if (isFacets && hasPitch && p.latlngs) {
        p.latlngs.forEach(pt => {
          const dot = L.circleMarker(pt, {
            radius: 4, fillColor: '#ffffff', fillOpacity: 1,
            color: '#6b7280', weight: 2, opacity: 0.9,
            interactive: false, pane: 'facetsPane',
            renderer: rendererRef.current,
          });
          dot.addTo(map);
          layersRef.current.push(dot);
        });
      }
    });

    return () => {
      container.classList.remove('facet-brush-cursor');
      layersRef.current.forEach(l => { try { map.removeLayer(l); } catch (_) {} });
      layersRef.current = [];
      domHandlersRef.current.forEach(({ el, fn }) => {
        try { el.removeEventListener('click', fn); } catch (_) {}
      });
      domHandlersRef.current = [];
    };
  }, [map, polygons, activeTab, selectedFacetId, facetPitchBrush]);

  return null;
}

/**
 * VertexDragLayer — Renders draggable circle markers at every unique edge endpoint.
 * Visible on the Edges tab when no draw tool is active.
 * Dragging a vertex updates all connected edges in real-time.
 */
function VertexDragLayer({ edges, activeTab, activeEdgeTool, onVertexMoved }) {
  const map = useMap();
  const markersRef = useRef([]);
  const callbackRef = useRef(onVertexMoved);
  useEffect(() => { callbackRef.current = onVertexMoved; }, [onVertexMoved]);

  useEffect(() => {
    // Cleanup
    markersRef.current.forEach(m => { try { map.removeLayer(m); } catch (_) {} });
    markersRef.current = [];

    // Only show on Edges tab when NOT drawing
    if (activeTab !== 'edges' || activeEdgeTool === 'draw_edge') return;
    if (!edges || edges.length === 0) return;

    // Ensure vertexPane exists (child of rotatePane, above edges at z-index 460)
    if (!map.getPane('vertexPane')) {
      const parentPane = map.getPane('rotatePane') || map.getPane('mapPane');
      const pane = map.createPane('vertexPane', parentPane);
      pane.style.zIndex = '460';
    }

    // Collect unique vertices (small EPS for floating-point dedup only)
    const EPS = 0.0000005;
    const uniqueVerts = [];
    edges.forEach(e => {
      [e.start, e.end].forEach(pt => {
        if (!uniqueVerts.some(v => Math.abs(v[0] - pt[0]) < EPS && Math.abs(v[1] - pt[1]) < EPS)) {
          uniqueVerts.push([pt[0], pt[1]]);
        }
      });
    });

    uniqueVerts.forEach(v => {
      const marker = L.marker(v, {
        draggable: true,
        pane: 'vertexPane',
        icon: L.divIcon({
          className: 'vertex-drag-marker',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
          html: '<div style="width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid #334155;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>',
        }),
      });

      const origLatLng = [...v];
      marker.on('dragend', () => {
        const newPos = marker.getLatLng();
        callbackRef.current?.([origLatLng[0], origLatLng[1]], [newPos.lat, newPos.lng]);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach(m => { try { map.removeLayer(m); } catch (_) {} });
      markersRef.current = [];
    };
  }, [map, edges, activeTab, activeEdgeTool]);

  return null;
}

function BingLayer({ tile }) {
  const map = useMap();
  useEffect(() => {
    const layer = new BingTileLayer('', {
      maxNativeZoom: tile.maxNativeZoom,
      maxZoom: tile.maxZoom,
      attribution: tile.attribution,
    });
    map.addLayer(layer);
    return () => map.removeLayer(layer);
  }, [map, tile]);
  return null;
}

/**
 * LabelsOverlay — Renders road/place labels in a dedicated labelsPane (z-index 395)
 * so they never cover the polygon SVG in the overlayPane (z-index 400).
 */
function LabelsOverlay() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane('labelsPane')) {
      const parentPane = map.getPane('rotatePane') || map.getPane('mapPane');
      const pane = map.createPane('labelsPane', parentPane);
      pane.style.zIndex = '395';
    }
    const layer = L.tileLayer(LABELS_LAYER.url, {
      maxNativeZoom: LABELS_LAYER.maxNativeZoom,
      maxZoom: LABELS_LAYER.maxZoom,
      pane: 'labelsPane',
    });
    map.addLayer(layer);
    return () => map.removeLayer(layer);
  }, [map]);
  return null;
}

/* ===================================================================
   CUSTOM DRAWING ENGINE
   Replaces L.Draw.Polygon with a professional click-based system.
   Features:
   - Live edge measurement labels ("53ft 11in")
   - Shift = force snap to nearest edge angle (parallel/perpendicular)
   - Closing indicator (green) when near first vertex
   - Live area preview while drawing
   - Keyboard: Escape=cancel, Enter=close, Ctrl+Z=undo vertex
   - Double-click to close
   =================================================================== */
function DrawControl({ featureGroupRef, onPolygonCreated, drawControlRef, onActiveToolChange, activeEdgeTool, activeTab }) {
  const map = useMap();

  // Ref so the closure inside useEffect always sees the latest value
  const edgeToolRef = useRef(null);
  const activeTabRef = useRef('draw');
  useEffect(() => { edgeToolRef.current = activeEdgeTool; }, [activeEdgeTool]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  useEffect(() => {
    if (!featureGroupRef.current) return;
    const fg = featureGroupRef.current;

    // ── Drawing state ──────────────────────────────
    let mode = null; // null | 'draw' | 'edit' | 'delete'
    let vertices = [];
    let vertexMarkers = [];
    let edgeLines = [];
    let edgeLabels = [];
    let previewLine = null;
    let midpointLabel = null;    // red label at segment midpoint
    let snapHighlight = null;   // circle highlighting snap target
    let cursorDot = null;       // preview dot following cursor
    let snapGuide = null;
    let closingIndicator = null;
    let closeZoneRing = null;    // persistent ring around first vertex showing close zone
    let closeTooltip = null;     // "Click to close" tooltip
    let areaTooltip = null;
    let shiftHeld = false;
    let altHeld = false;
    let activeEditHandler = null;
    let crosshairOverlay = null; // full-screen crosshair lines (Roofr style)

    // ── Create / destroy full-screen crosshair overlay ──
    let containerRect = null;
    const createCrosshairOverlay = () => {
      if (crosshairOverlay) return;
      const container = map.getContainer();
      containerRect = container.getBoundingClientRect();
      crosshairOverlay = document.createElement('div');
      crosshairOverlay.className = 'roofr-crosshair-overlay';
      crosshairOverlay.innerHTML = `
        <div class="rch-hl"></div>
        <div class="rch-hr"></div>
        <div class="rch-vt"></div>
        <div class="rch-vb"></div>
        <div class="rch-square"></div>
      `;
      container.appendChild(crosshairOverlay);
      // Direct native listener — updates CSS vars immediately for smooth tracking
      container.addEventListener('mousemove', onNativeMouseMove, { passive: true });
      // Keep cached rect fresh when map moves or window resizes
      map.on('move', refreshRect);
      map.on('resize', refreshRect);
    };

    const onNativeMouseMove = (e) => {
      if (!crosshairOverlay) return;
      if (!containerRect) containerRect = map.getContainer().getBoundingClientRect();
      crosshairOverlay.style.setProperty('--cx', (e.clientX - containerRect.left) + 'px');
      crosshairOverlay.style.setProperty('--cy', (e.clientY - containerRect.top) + 'px');
    };

    // Refresh cached rect on map move/resize
    const refreshRect = () => { containerRect = map.getContainer().getBoundingClientRect(); };

    const updateCrosshairPosition = (clientX, clientY) => {
      if (!crosshairOverlay) return;
      if (!containerRect) containerRect = map.getContainer().getBoundingClientRect();
      crosshairOverlay.style.setProperty('--cx', (clientX - containerRect.left) + 'px');
      crosshairOverlay.style.setProperty('--cy', (clientY - containerRect.top) + 'px');
    };

    const removeCrosshairOverlay = () => {
      const container = map.getContainer();
      container.removeEventListener('mousemove', onNativeMouseMove);
      map.off('move', refreshRect);
      map.off('resize', refreshRect);
      if (crosshairOverlay && crosshairOverlay.parentNode) {
        crosshairOverlay.parentNode.removeChild(crosshairOverlay);
      }
      crosshairOverlay = null;
      containerRect = null;
    };
    let justClosed = false;
    let wasDrawingBeforeDeleteEdge = false;

    // ── Math helpers — screen-pixel space (rotation-safe) ──
    const distFeet = (a, b) => L.latLng(a).distanceTo(L.latLng(b)) * 3.28084;

    // Screen-space bearing: 0°=up, 90°=right, 180°=down, 270°=left
    const getBearing = (p1, p2) => {
      const px1 = map.latLngToContainerPoint(L.latLng(p1));
      const px2 = map.latLngToContainerPoint(L.latLng(p2));
      const dx = px2.x - px1.x;
      const dy = px1.y - px2.y; // screen Y inverted
      return (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
    };

    // Project in screen-pixel space, convert back to latLng
    const projectPt = (origin, angleDeg, pxDist) => {
      const px = map.latLngToContainerPoint(L.latLng(origin));
      const rad = angleDeg * Math.PI / 180;
      return map.containerPointToLatLng(L.point(
        px.x + Math.sin(rad) * pxDist,
        px.y - Math.cos(rad) * pxDist
      ));
    };

    // Pixel distance between two latLng points
    const pxDist = (a, b) => {
      return map.latLngToContainerPoint(L.latLng(a))
        .distanceTo(map.latLngToContainerPoint(L.latLng(b)));
    };

    // ═══════════════════════════════════════════
    // EDGE-ANGLE SNAPPING
    // Snap to parallel / perpendicular of existing edges.
    // No fixed H/V — adapts to actual roof geometry.
    // ═══════════════════════════════════════════
    const calcAreaSqFt = (latlngs) => {
      try {
        if (L.GeometryUtil && L.GeometryUtil.geodesicArea) {
          return L.GeometryUtil.geodesicArea(latlngs) * 10.7639;
        }
      } catch (_) { /* fallback */ }
      return 0;
    };

    // ── Vertex snapping — snap to any existing vertex ──
    const getAllExistingVertices = () => {
      const verts = [];
      fg.eachLayer(layer => {
        if (layer.getLatLngs) {
          try {
            const lls = layer.getLatLngs();
            const ring = Array.isArray(lls[0]) ? lls[0] : lls;
            ring.forEach(ll => { if (ll.lat !== undefined) verts.push(ll); });
          } catch (_) { /* skip */ }
        }
      });
      return verts;
    };

    const findSnapTarget = (cursor, thresholdPx = 25) => {
      const cursorPx = map.latLngToContainerPoint(cursor);
      const existingVerts = getAllExistingVertices();
      const allVerts = [...existingVerts, ...vertices.map(v => L.latLng(v))];
      let nearest = null;
      let nearestDist = Infinity;
      for (const v of allVerts) {
        const vPx = map.latLngToContainerPoint(v);
        const d = cursorPx.distanceTo(vPx);
        if (d < thresholdPx && d < nearestDist) {
          nearest = L.latLng(v.lat, v.lng);
          nearestDist = d;
        }
      }
      return nearest;
    };

    // ── Get bearings of all existing edges (screen-space) ──
    const getExistingEdgeBearings = () => {
      const bearings = [];
      fg.eachLayer(layer => {
        if (layer.getLatLngs) {
          try {
            const lls = layer.getLatLngs();
            const ring = Array.isArray(lls[0]) ? lls[0] : lls;
            for (let i = 0; i < ring.length; i++) {
              const a = ring[i];
              const b = ring[(i + 1) % ring.length];
              if (a.lat !== undefined && b.lat !== undefined) {
                bearings.push(getBearing(a, b));
              }
            }
          } catch (_) { /* skip */ }
        }
      });
      for (let i = 0; i < vertices.length - 1; i++) {
        bearings.push(getBearing(vertices[i], vertices[i + 1]));
      }
      return bearings;
    };

    // Build candidate angles: cardinal H/V + each edge bearing + 90° perpendicular
    const getSnapCandidates = () => {
      const candidates = new Set([0, 90, 180, 270]); // always include cardinal H/V
      for (const eb of getExistingEdgeBearings()) {
        candidates.add(eb);
        candidates.add((eb + 90) % 360);
        candidates.add((eb + 180) % 360);
        candidates.add((eb + 270) % 360);
      }
      return [...candidates];
    };

    // Auto edge-angle alignment (replaces cardinal H/V check)
    const checkAlignment = (last, cursor, thresholdDeg = 8) => {
      const candidates = getSnapCandidates();
      if (candidates.length === 0) return { aligned: false, snappedAngle: null };
      const bearing = getBearing(last, cursor);
      let bestAngle = null;
      let smallestDiff = Infinity;
      for (const c of candidates) {
        const diff = Math.abs(bearing - c);
        const nd = Math.min(diff, 360 - diff);
        if (nd < smallestDiff) { smallestDiff = nd; bestAngle = c; }
      }
      if (smallestDiff < thresholdDeg) {
        return { aligned: true, snappedAngle: bestAngle };
      }
      return { aligned: false, snappedAngle: null };
    };

    // Forced snap (Shift held) — snap to nearest edge angle, no threshold
    const getSnappedPoint = (last, cursor) => {
      const candidates = getSnapCandidates();
      if (candidates.length === 0) return cursor; // no edges yet — free draw
      const bearing = getBearing(last, cursor);
      const dist = pxDist(last, cursor);
      let bestAngle = candidates[0];
      let smallestDiff = Infinity;
      for (const c of candidates) {
        const diff = Math.abs(bearing - c);
        const nd = Math.min(diff, 360 - diff);
        if (nd < smallestDiff) { smallestDiff = nd; bestAngle = c; }
      }
      return projectPt(last, bestAngle, dist);
    };

    // ── Clear all drawing elements from map ────────
    const clearDrawElements = () => {
      vertexMarkers.forEach(m => map.removeLayer(m));
      edgeLines.forEach(l => map.removeLayer(l));
      edgeLabels.forEach(l => map.removeLayer(l));
      if (previewLine) map.removeLayer(previewLine);
      if (midpointLabel) map.removeLayer(midpointLabel);
      if (snapHighlight) map.removeLayer(snapHighlight);
      if (cursorDot) map.removeLayer(cursorDot);
      if (snapGuide) map.removeLayer(snapGuide);
      if (closingIndicator) map.removeLayer(closingIndicator);
      if (closeZoneRing) map.removeLayer(closeZoneRing);
      if (closeTooltip) map.removeLayer(closeTooltip);
      if (areaTooltip) map.removeLayer(areaTooltip);
      removeCrosshairOverlay();
      vertexMarkers = []; edgeLines = []; edgeLabels = [];
      previewLine = null; midpointLabel = null; snapHighlight = null;
      cursorDot = null; snapGuide = null;
      closingIndicator = null; closeZoneRing = null; closeTooltip = null;
      areaTooltip = null;
      vertices = [];
    };

    // ── Add a vertex ───────────────────────────────
    const addVertex = (latlng) => {
      vertices.push(latlng);

      // First vertex: large bullseye target (easy close-shape indicator)
      // Other vertices: hidden for clean view (visible only in Edit Vertices mode)
      const isFirst = vertices.length === 1;
      const marker = L.circleMarker(latlng, {
        radius: isFirst ? 10 : 0,
        color: isFirst ? '#22c55e' : 'transparent',
        fillColor: isFirst ? '#ffffff' : 'transparent',
        fillOpacity: isFirst ? 1 : 0,
        weight: isFirst ? 3 : 0,
        interactive: false,
        pane: 'overlayPane',
      });
      if (isFirst) marker.setStyle({ className: 'draw-first-vertex' });
      marker.addTo(map);
      vertexMarkers.push(marker);

      // Add a close zone ring around first vertex (appears after 3+ vertices)
      // This is a persistent ring that shows the snap zone for closing the polygon
      if (isFirst) {
        // We'll show the ring later when 3+ vertices exist (in addVertex for vertex 3+)
      }
      if (vertices.length >= 3 && !closeZoneRing) {
        closeZoneRing = L.circleMarker(vertices[0], {
          radius: 40,
          color: '#22c55e',
          fillColor: '#22c55e',
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: '5,4',
          opacity: 0.5,
          interactive: false,
          pane: 'overlayPane',
        });
        closeZoneRing.addTo(map);
      }

      // Edge line + measurement label (from previous vertex)
      if (vertices.length >= 2) {
        const prev = vertices[vertices.length - 2];
        const curr = vertices[vertices.length - 1];

        // Placed edge: white line (Roofr style)
        const line = L.polyline([prev, curr], {
          color: '#ffffff', weight: 2.5, opacity: 0.95, interactive: false,
        });
        line.addTo(map);
        edgeLines.push(line);

        const dist = distFeet(prev, curr);
        const mid = L.latLng((prev.lat + curr.lat) / 2, (prev.lng + curr.lng) / 2);
        const label = L.marker(mid, {
          icon: L.divIcon({
            className: 'edge-measure-label',
            html: `<span>${fmtFtIn(dist)}</span>`,
            iconSize: [0, 0],
          }),
          interactive: false, zIndexOffset: 1000,
        });
        label.addTo(map);
        edgeLabels.push(label);
      }
    };

    // ── Undo last vertex ───────────────────────────
    const undoLastVertex = () => {
      if (vertices.length === 0) return;
      vertices.pop();
      const m = vertexMarkers.pop();
      if (m) map.removeLayer(m);
      if (edgeLines.length > 0 && vertices.length >= 1) {
        const l = edgeLines.pop(); if (l) map.removeLayer(l);
        const lb = edgeLabels.pop(); if (lb) map.removeLayer(lb);
      }
    };

    // ── Clean up vertices — remove near-duplicates that cause 0-length edges ──
    // Uses geographic distance (meters) so it's zoom-independent
    const cleanVertices = (verts) => {
      if (verts.length < 3) return verts;
      const MIN_DIST = 0.5; // 0.5 meters ≈ 1.6 feet — any edge shorter is degenerate
      const cleaned = [verts[0]];
      for (let i = 1; i < verts.length; i++) {
        if (map.distance(cleaned[cleaned.length - 1], verts[i]) >= MIN_DIST) {
          cleaned.push(verts[i]);
        }
      }
      // Also check last→first for near-duplicate closing vertex
      if (cleaned.length > 3) {
        if (map.distance(cleaned[0], cleaned[cleaned.length - 1]) < MIN_DIST) {
          cleaned.pop();
        }
      }
      return cleaned.length >= 3 ? cleaned : verts;
    };

    // ── Close polygon ──────────────────────────────
    const closePolygon = () => {
      if (vertices.length < 3) return;
      justClosed = true;
      setTimeout(() => { justClosed = false; }, 300);

      // Remove degenerate near-duplicate vertices (0-length edges)
      const corrected = cleanVertices(vertices);
      const latlngs = corrected.map(v => [v.lat, v.lng]);

      // Create Leaflet polygon layer & add to FeatureGroup
      const polygon = L.polygon(latlngs, {
        color: '#ffffff', weight: 2.5,
        fillOpacity: 0.30, fillColor: '#ef4444',
      });
      fg.addLayer(polygon);

      // Fire callback (triggers area/perimeter calc)
      onPolygonCreated({ id: L.stamp(polygon), latlngs, layer: polygon });

      // Clear temp drawing elements but STAY in draw mode —
      // user can immediately start the next shape
      vertexMarkers.forEach(m => map.removeLayer(m));
      edgeLines.forEach(l => map.removeLayer(l));
      edgeLabels.forEach(l => map.removeLayer(l));
      if (previewLine) map.removeLayer(previewLine);
      if (midpointLabel) map.removeLayer(midpointLabel);
      if (snapHighlight) map.removeLayer(snapHighlight);
      if (cursorDot) map.removeLayer(cursorDot);
      if (snapGuide) map.removeLayer(snapGuide);
      if (closingIndicator) map.removeLayer(closingIndicator);
      if (closeZoneRing) map.removeLayer(closeZoneRing);
      if (closeTooltip) map.removeLayer(closeTooltip);
      if (areaTooltip) map.removeLayer(areaTooltip);
      vertexMarkers = []; edgeLines = []; edgeLabels = [];
      previewLine = null; midpointLabel = null; snapHighlight = null;
      cursorDot = null; snapGuide = null;
      closingIndicator = null; closeZoneRing = null; closeTooltip = null;
      areaTooltip = null;
      vertices = [];
      // Crosshair + event listeners stay active — ready for next polygon
    };

    // ── Event: Map click (place vertex) ────────────
    const onDrawClick = (e) => {
      if (mode !== 'draw' || justClosed) return;
      // If an edge tool is active or we're on the Edges tab, don't place vertices
      if (edgeToolRef.current || activeTabRef.current === 'edges') return;

      let point = e.latlng;

      // 1) Vertex snap — only within 10px (tight, won't hijack your click)
      const snapTarget = findSnapTarget(point, 10);
      if (snapTarget) {
        point = snapTarget;
      }
      // 2) Shift-snap to nearest edge angle (only when Shift held)
      else if (shiftHeld && vertices.length > 0) {
        const last = vertices[vertices.length - 1];
        point = getSnappedPoint(last, point);
      }

      // Deduplicate (double-click protection)
      if (vertices.length > 0) {
        const lastPx = map.latLngToContainerPoint(vertices[vertices.length - 1]);
        const clickPx = map.latLngToContainerPoint(point);
        if (lastPx.distanceTo(clickPx) < 5) return;
      }

      // Close if clicking near first vertex (generous 40px radius for easy closing)
      if (vertices.length >= 3) {
        const firstPx = map.latLngToContainerPoint(vertices[0]);
        const clickPx = map.latLngToContainerPoint(point);
        if (firstPx.distanceTo(clickPx) < 40) {
          closePolygon();
          return;
        }
      }

      addVertex(point);
    };

    // ── Event: Mouse move (preview + snap + alignment color + closing) ─
    const onDrawMouseMove = (e) => {
      if (mode !== 'draw') return;
      // If edge tool is active, hide crosshair and skip draw preview
      if (edgeToolRef.current || activeTabRef.current === 'edges') {
        if (crosshairOverlay) removeCrosshairOverlay();
        map.getContainer().classList.remove('drawing-mode');
        return;
      }

      // Always update crosshair position (even before first vertex)
      if (!crosshairOverlay) createCrosshairOverlay();
      const clientX = e.originalEvent?.clientX ?? e.clientX;
      const clientY = e.originalEvent?.clientY ?? e.clientY;
      if (clientX != null && clientY != null) {
        updateCrosshairPosition(clientX, clientY);
      }

      // No vertices yet — just track the crosshair, nothing else to do
      if (vertices.length === 0) return;

      let cursor = e.latlng;
      const last = vertices[vertices.length - 1];
      let isSnapped = false;
      let isAligned = false;
      let alignAngle = null;

      // 1) Vertex snap — only within 10px (tight, won't hijack your cursor)
      const snapTarget = findSnapTarget(cursor, 10);
      if (snapTarget) {
        cursor = snapTarget;
        isSnapped = true;
        const alignment = checkAlignment(last, cursor, 10);
        isAligned = alignment.aligned;
        alignAngle = alignment.snappedAngle;
      }
      // 2) Shift-snap to nearest edge angle
      else if (shiftHeld) {
        cursor = getSnappedPoint(last, cursor);
        isAligned = true;
        alignAngle = getBearing(last, cursor);
      }
      // 3) Visual-only alignment check (cursor stays free, line color changes)
      else {
        const alignment = checkAlignment(last, cursor, 5);
        isAligned = alignment.aligned;
        alignAngle = alignment.snappedAngle;
      }

      // ── Snap highlight ring ──
      if (snapHighlight) { map.removeLayer(snapHighlight); snapHighlight = null; }
      if (isSnapped) {
        snapHighlight = L.circleMarker(cursor, {
          radius: 12, color: '#3b82f6', fillColor: '#3b82f6',
          fillOpacity: 0.15, weight: 2, dashArray: '4,3',
          interactive: false, pane: 'overlayPane',
        });
        snapHighlight.addTo(map);
      }

      // Toggle snapped/aligned class on crosshair
      if (crosshairOverlay) {
        crosshairOverlay.classList.toggle('snapped', isSnapped);
        crosshairOverlay.classList.toggle('aligned', isAligned && !isSnapped);
      }

      // ── Preview line — WHITE when aligned, RED when not (Roofr style) ──
      const lineColor = isAligned ? '#ffffff' : '#ef4444';
      if (previewLine) map.removeLayer(previewLine);
      previewLine = L.polyline([last, cursor], {
        color: lineColor, weight: 2.5,
        opacity: 0.9, interactive: false,
      });
      previewLine.addTo(map);

      // ── Midpoint measurement label (white text, dark outline) ──
      if (midpointLabel) { map.removeLayer(midpointLabel); midpointLabel = null; }
      const distFt = distFeet(last, cursor);
      if (distFt > 0.5) {
        const mid = L.latLng((last.lat + cursor.lat) / 2, (last.lng + cursor.lng) / 2);
        midpointLabel = L.marker(mid, {
          icon: L.divIcon({
            className: 'draw-midpoint-label',
            html: `<span>${fmtFtIn(distFt)}</span>`,
            iconSize: [0, 0],
          }),
          interactive: false, zIndexOffset: 2000,
        });
        midpointLabel.addTo(map);
      }

      // ── Snap guide line (when aligned or Shift/Alt held) ──
      if (snapGuide) { map.removeLayer(snapGuide); snapGuide = null; }
      if (isAligned && alignAngle !== null && !isSnapped) {
        const ext = Math.max(pxDist(last, cursor) * 2, 50);
        const p1 = projectPt(last, alignAngle, ext * 1.5);
        const p2 = projectPt(last, (alignAngle + 180) % 360, ext * 0.3);
        snapGuide = L.polyline([p2, last, p1], {
          color: '#3b82f6', weight: 1.5, dashArray: '6,4', opacity: 0.5, interactive: false,
        });
        snapGuide.addTo(map);
      }

      // ── Closing indicator (green line + tooltip) when near first vertex ──
      if (closingIndicator) { map.removeLayer(closingIndicator); closingIndicator = null; }
      if (closeTooltip) { map.removeLayer(closeTooltip); closeTooltip = null; }
      if (vertices.length >= 3) {
        const firstPx = map.latLngToContainerPoint(vertices[0]);
        const cursorPx = map.latLngToContainerPoint(cursor);
        const distToFirst = firstPx.distanceTo(cursorPx);
        if (distToFirst < 45) {
          // Green dashed line to first vertex
          closingIndicator = L.polyline([cursor, vertices[0]], {
            color: '#22c55e', weight: 3, dashArray: '6,4', opacity: 0.95, interactive: false,
          });
          closingIndicator.addTo(map);
          // "Click to close" tooltip above the first vertex
          closeTooltip = L.marker(vertices[0], {
            icon: L.divIcon({
              className: 'close-tooltip-label',
              html: '<span>Click to close</span>',
              iconSize: [0, 0],
              iconAnchor: [0, 30],
            }),
            interactive: false, zIndexOffset: 3000,
          });
          closeTooltip.addTo(map);
        }
        // Pulse the close zone ring when cursor is in range
        if (closeZoneRing) {
          closeZoneRing.setStyle({
            opacity: distToFirst < 45 ? 0.8 : 0.5,
            fillOpacity: distToFirst < 45 ? 0.15 : 0.08,
            weight: distToFirst < 45 ? 2.5 : 1.5,
          });
        }
      }

      // ── Area preview ──
      if (areaTooltip) { map.removeLayer(areaTooltip); areaTooltip = null; }
      if (vertices.length >= 2) {
        const tempVerts = [...vertices, cursor];
        const latlngs = tempVerts.map(v => L.latLng(v));
        const area = calcAreaSqFt(latlngs);
        if (area > 1) {
          const bounds = L.polygon(tempVerts).getBounds();
          areaTooltip = L.marker(bounds.getCenter(), {
            icon: L.divIcon({
              className: 'area-preview-label',
              html: `<span>${fmtArea(area)}</span>`,
              iconSize: [0, 0],
            }),
            interactive: false, zIndexOffset: 1500,
          });
          areaTooltip.addTo(map);
        }
      }
    };

    // ── Event: Double-click (close polygon) ────────
    const onDblClick = (e) => {
      if (mode !== 'draw' || vertices.length < 3) return;
      if (edgeToolRef.current || activeTabRef.current === 'edges') return;
      L.DomEvent.stop(e);
      // Remove duplicate vertex that click event may have added
      if (vertices.length > 3) {
        const last = vertices[vertices.length - 1];
        const prev = vertices[vertices.length - 2];
        const d = map.latLngToContainerPoint(last).distanceTo(map.latLngToContainerPoint(prev));
        if (d < 10) undoLastVertex();
      }
      closePolygon();
    };

    // ── Event: Keyboard ────────────────────────────
    const onKeyDown = (e) => {
      if (e.key === 'Shift') shiftHeld = true;
      if (e.key === 'Alt') { altHeld = true; e.preventDefault(); }

      if (mode === 'draw') {
        if (e.key === 'Escape') { clearDrawElements(); exitDrawMode(); }
        if (e.key === 'Enter' && vertices.length >= 3) closePolygon();
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
          e.preventDefault();
          undoLastVertex();
        }
      }
    };

    const onKeyUp = (e) => {
      if (e.key === 'Shift') shiftHeld = false;
      if (e.key === 'Alt') altHeld = false;
    };

    const onWindowBlur = () => { shiftHeld = false; altHeld = false; };

    // ── Enter / Exit draw mode ─────────────────────
    const exitDrawMode = () => {
      clearDrawElements();
      map.off('click', onDrawClick);
      map.off('mousemove', onDrawMouseMove);
      map.off('dblclick', onDblClick);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      map.getContainer().classList.remove('drawing-mode');
      map.doubleClickZoom.enable();
      removeCrosshairOverlay();
      mode = null;
      shiftHeld = false;
      altHeld = false;
      onActiveToolChange?.(null);
    };

    const disableActive = () => {
      if (mode === 'draw') exitDrawMode();
      if (mode === 'deleteEdge') {
        // Restore in-progress drawing edges if any
        edgeLines.forEach(line => {
          if (!line) return;
          line.setStyle({ interactive: false, weight: 2.5, color: '#ffffff' });
          line.off('mouseover'); line.off('mouseout'); line.off('click');
        });
      }
      if (activeEditHandler) {
        if (activeEditHandler.disable) activeEditHandler.disable();
        activeEditHandler = null;
        onActiveToolChange?.(null);
      }
      mode = null;
    };

    // (Polygon edge overlays removed — edge deletion now handled by EdgeRenderer + activeEdgeTool)

    // ── Exposed API ────────────────────────────────
    if (drawControlRef) {
      drawControlRef.current = {
        map, featureGroup: fg,

        startDraw: () => {
          disableActive();
          mode = 'draw';
          vertices = [];
          justClosed = false;
          onActiveToolChange?.('draw');
          map.doubleClickZoom.disable();
          map.getContainer().classList.add('drawing-mode');
          createCrosshairOverlay();
          map.on('click', onDrawClick);
          map.on('mousemove', onDrawMouseMove);
          map.on('dblclick', onDblClick);
          document.addEventListener('keydown', onKeyDown);
          document.addEventListener('keyup', onKeyUp);
          window.addEventListener('blur', onWindowBlur);
        },

        startEdit: () => {
          disableActive();
          const handler = new L.EditToolbar.Edit(map, { featureGroup: fg });
          handler.enable();
          activeEditHandler = handler;
          mode = 'edit';
          onActiveToolChange?.('edit');
        },

        startDelete: () => {
          disableActive();
          const handler = new L.EditToolbar.Delete(map, { featureGroup: fg });
          handler.enable();
          activeEditHandler = handler;
          mode = 'delete';
          onActiveToolChange?.('delete');
        },

        save: () => {
          if (activeEditHandler && activeEditHandler.save) activeEditHandler.save();
          disableActive();
        },

        cancel: () => {
          if (mode === 'draw') { clearDrawElements(); exitDrawMode(); return; }
          if (mode === 'deleteEdge') { drawControlRef.current.resumeDraw(); return; }
          if (activeEditHandler && activeEditHandler.revertLayers) activeEditHandler.revertLayers();
          disableActive();
        },

        // Gracefully finish drawing and exit — auto-close if 3+ vertices, else discard.
        // Use this instead of cancel() when switching tabs to preserve work.
        finishAndExit: () => {
          if (mode === 'draw') {
            // Auto-close polygon if user has enough vertices
            if (vertices.length >= 3) {
              closePolygon();
            }
            // Exit draw mode cleanly (crosshair, listeners, etc.)
            exitDrawMode();
            return;
          }
          if (mode === 'deleteEdge') { drawControlRef.current.resumeDraw(); return; }
          if (activeEditHandler && activeEditHandler.revertLayers) activeEditHandler.revertLayers();
          disableActive();
        },

        // ── Delete Edge mode ──
        // Works in two contexts:
        // 1) During drawing: click in-progress edges to remove them
        // 2) From idle: click completed polygon edges to remove them
        startDeleteEdge: () => {
          wasDrawingBeforeDeleteEdge = (mode === 'draw');

          if (wasDrawingBeforeDeleteEdge && edgeLines.length > 0) {
            // ── In-progress drawing edges: "undo to here" by clicking ──
            map.off('click', onDrawClick);
            map.off('mousemove', onDrawMouseMove);
            map.off('dblclick', onDblClick);
            // Clean preview elements
            [previewLine, midpointLabel, cursorDot, snapHighlight, snapGuide, closingIndicator, areaTooltip]
              .forEach(el => { if (el) map.removeLayer(el); });
            previewLine = null; midpointLabel = null; cursorDot = null;
            snapHighlight = null; snapGuide = null; closingIndicator = null; areaTooltip = null;
            if (closeZoneRing) { map.removeLayer(closeZoneRing); closeZoneRing = null; }
            if (closeTooltip) { map.removeLayer(closeTooltip); closeTooltip = null; }

            edgeLines.forEach((line, i) => {
              if (!line) return;
              line.setStyle({ interactive: true, weight: 5 });
              line.on('mouseover', () => line.setStyle({ color: '#ef4444', weight: 6 }));
              line.on('mouseout', () => line.setStyle({ color: '#ffffff', weight: 5 }));
              line.on('click', (ev) => {
                L.DomEvent.stop(ev);
                for (let j = i; j < edgeLines.length; j++) {
                  if (edgeLines[j]) { map.removeLayer(edgeLines[j]); edgeLines[j] = null; }
                  if (edgeLabels[j]) { map.removeLayer(edgeLabels[j]); edgeLabels[j] = null; }
                }
                for (let j = i + 1; j < vertexMarkers.length; j++) {
                  if (vertexMarkers[j]) { map.removeLayer(vertexMarkers[j]); vertexMarkers[j] = null; }
                }
              });
            });
          } else {
            // Completed edges: handled by EdgeRenderer + activeEdgeTool='delete_edge'
            disableActive();
          }

          mode = 'deleteEdge';
          onActiveToolChange?.('deleteEdge');
          map.getContainer().classList.remove('drawing-mode');
        },

        // ── Resume / Done from delete-edge ──
        resumeDraw: () => {
          if (mode !== 'deleteEdge') return;

          if (wasDrawingBeforeDeleteEdge) {
            // Restore drawn edges to non-interactive
            edgeLines.forEach(line => {
              if (!line) return;
              line.setStyle({ interactive: false, weight: 2.5, color: '#ffffff' });
              line.off('mouseover'); line.off('mouseout'); line.off('click');
            });
            edgeLines = edgeLines.filter(l => l !== null);
            edgeLabels = edgeLabels.filter(l => l !== null);
            vertexMarkers = vertexMarkers.filter(m => m !== null);
            vertices = vertexMarkers.map(m => m.getLatLng());

            mode = 'draw';
            onActiveToolChange?.('draw');
            map.getContainer().classList.add('drawing-mode');
            createCrosshairOverlay();
            map.on('click', onDrawClick);
            map.on('mousemove', onDrawMouseMove);
            map.on('dblclick', onDblClick);
          } else {
            // Exit back to idle
            mode = null;
            onActiveToolChange?.(null);
            map.getContainer().classList.remove('drawing-mode');
          }
          wasDrawingBeforeDeleteEdge = false;
        },

        // ── Delete all edges: clear everything including completed polygons ──
        deleteAllEdges: () => {
          clearDrawElements();
          // Remove all completed polygon layers from the FeatureGroup
          fg.clearLayers();
          if (mode === 'draw') {
            map.off('click', onDrawClick);
            map.off('mousemove', onDrawMouseMove);
            map.off('dblclick', onDblClick);
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('blur', onWindowBlur);
            map.doubleClickZoom.enable();
          }
          mode = null;
          shiftHeld = false; altHeld = false;
          map.getContainer().classList.remove('drawing-mode');
          onActiveToolChange?.(null);
        },
      };
    }

    // ── Cleanup ────────────────────────────────────
    return () => {
      disableActive();
      clearDrawElements();
      if (drawControlRef) drawControlRef.current = null;
    };
  }, [map, featureGroupRef, onPolygonCreated, drawControlRef, onActiveToolChange]);

  return null;
}

/* ===================================================================
   MAP VIEWER (main component)
   =================================================================== */
const MapViewer = forwardRef(function MapViewer({
  projectId,
  center,
  zoom,
  tileProvider,
  onPolygonCreated,
  edges,
  showEdgeColors,
  addressLabel,
  onActiveToolChange,
  facets,
  activeEdgeTool,
  drawModeActive,
  selectedEdgeId,
  onEdgeClick,
  mapRotation = 0,
  onBearingChange,
  activeTab,
  showFacetLabels = true,
  onManualEdgeCreated,
  onDeleteEdge,
  onFacetAssign,
  facetPitchBrush,
  selectedFacetId,
  onVertexMoved,
}, ref) {
  const featureGroupRef = useRef(null);
  const drawControlRef = useRef(null);
  const zoomInRef = useRef(null);
  const zoomOutRef = useRef(null);
  const tile = TILE_PROVIDERS[tileProvider] || TILE_PROVIDERS.googleSatellite;
  const isSatellite = ['googleSatellite', 'googleHybrid', 'esriSatellite', 'bingSatellite'].includes(tileProvider);

  useImperativeHandle(ref, () => ({
    triggerDraw: () => drawControlRef.current?.startDraw(),
    triggerEdit: () => drawControlRef.current?.startEdit(),
    triggerDelete: () => drawControlRef.current?.startDelete(),
    resumeDraw: () => drawControlRef.current?.resumeDraw(),
    deleteAllEdges: () => drawControlRef.current?.deleteAllEdges(),
    save: () => drawControlRef.current?.save(),
    cancel: () => drawControlRef.current?.cancel(),
    finishAndExit: () => drawControlRef.current?.finishAndExit(),
    zoomIn: () => zoomInRef.current?.(),
    zoomOut: () => zoomOutRef.current?.(),
  }), []);

  const handleCreated = useCallback((data) => {
    if (onPolygonCreated) onPolygonCreated(data);
  }, [onPolygonCreated]);

  const houseNumber = addressLabel ? addressLabel.split(',')[0].split(' ')[0] : '';

  // When an edge tool is selected, gracefully finish any active drawing
  // (auto-close if 3+ vertices) so map clicks go to edges, not vertices
  useEffect(() => {
    if (activeEdgeTool && drawControlRef.current) {
      drawControlRef.current.finishAndExit();
    }
  }, [activeEdgeTool]);

  // Unified polygon styling per tab — handles interactivity, fill, borders
  // Facets tab: polygons turn RED (unassigned) or transparent (assigned)
  const edgeMode = activeTab === 'edges' || !!activeEdgeTool;

  // Track facet click handlers so we can remove them on cleanup
  const facetClickHandlers = useRef(new Map());

  useEffect(() => {
    const fg = featureGroupRef.current;
    if (!fg) return;
    const isFacets = activeTab === 'facets';

    // DEBUG: Count layers in FeatureGroup
    let layerCount = 0;
    fg.eachLayer(() => { layerCount++; });
    console.log('[UnifiedStyle] tab:', activeTab, 'featureGroup layers:', layerCount);

    // Clean up previous facet click handlers
    facetClickHandlers.current.forEach((handler, layer) => {
      layer.off('click', handler);
    });
    facetClickHandlers.current.clear();

    fg.eachLayer(layer => {
      if (!layer.setStyle || !layer.getLatLngs) return;
      const path = layer._path || (layer.getElement && layer.getElement());

      if (isFacets) {
        // FACETS TAB: Hide FeatureGroup layers — FacetOverlay Canvas handles all rendering
        layer.setStyle({ fillOpacity: 0, fillColor: 'transparent', color: 'transparent', weight: 0, opacity: 0, interactive: false });
        if (path) {
          path.style.pointerEvents = 'none';
          path.classList.remove('leaflet-interactive');
        }
      } else if (edgeMode) {
        // Edges tab: show polygons but disable pointer events
        if (path) {
          path.style.display = '';
          // Clear any leftover inline styles from previous facets tab
          path.style.fill = '';
          path.style.fillOpacity = '';
          path.style.stroke = '';
          path.style.strokeWidth = '';
          path.style.strokeOpacity = '';
        }
        layer.setStyle({
          fillColor: '#ef4444', fillOpacity: 0.15,
          color: '#ffffff', weight: 2.5, opacity: 0.95,
        });
        if (path) {
          path.style.pointerEvents = 'none';
          path.classList.remove('leaflet-interactive');
        }
      } else {
        // Draw tab: default appearance
        if (path) {
          path.style.display = '';
          // Clear any leftover inline styles from previous facets tab
          path.style.fill = '';
          path.style.fillOpacity = '';
          path.style.stroke = '';
          path.style.strokeWidth = '';
          path.style.strokeOpacity = '';
        }
        layer.setStyle({
          interactive: true,
          fillColor: '#ef4444', fillOpacity: 0.30,
          color: '#ffffff', weight: 2.5, opacity: 0.95,
        });
        if (path) {
          path.style.pointerEvents = '';
          path.classList.add('leaflet-interactive');
        }
      }
    });
  }, [activeTab, edgeMode, onFacetAssign]);

  // (Legacy brute-force DOM coloring removed — FacetOverlay Canvas handles all facet rendering)

  return (
    <MapContainer
      center={center || [39.7684, -86.1581]}
      zoom={zoom || 20}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      maxZoom={22}
      rotate={true}
      touchRotate={true}
      rotateControl={false}
      bearing={0}
    >
      {/* Tile layer */}
      {tile.isBing ? (
        <BingLayer tile={tile} />
      ) : (
        <TileLayer
          key={tileProvider}
          url={tile.url}
          subdomains={tile.subdomains || 'abc'}
          attribution={tile.attribution}
          maxNativeZoom={tile.maxNativeZoom}
          maxZoom={tile.maxZoom}
        />
      )}

      {/* Labels overlay for satellite views — uses labelsPane (z-index 395) so
           polygon SVG in overlayPane (400) always renders on top */}
      {isSatellite && tileProvider !== 'googleHybrid' && (
        <LabelsOverlay />
      )}

      <MapController center={center} zoom={zoom} />
      <BearingController rotation={mapRotation} onBearingChange={onBearingChange} />
      <ZoomController zoomInRef={zoomInRef} zoomOutRef={zoomOutRef} />
      {/* Edge rendering is handled by EdgeRenderer below the FeatureGroup */}

      {/* Address pin */}
      {addressLabel && center && (
        <Marker position={center} icon={createAddressIcon(houseNumber || '?')}>
          <Popup>{addressLabel}</Popup>
        </Marker>
      )}

      {/* Drawing feature group (edit/delete operate on this) */}
      <FeatureGroup ref={featureGroupRef}>
        <DrawControl
          featureGroupRef={featureGroupRef}
          drawControlRef={drawControlRef}
          onPolygonCreated={handleCreated}
          onActiveToolChange={onActiveToolChange}
          activeEdgeTool={activeEdgeTool}
          activeTab={activeTab}
        />
      </FeatureGroup>

      {/* Imperative edge rendering — uses native Leaflet layers for reliable
           click handling, proper edgesPane z-ordering, and dark outlines */}
      <EdgeRenderer
        edges={edges}
        showEdgeColors={showEdgeColors}
        activeEdgeTool={activeEdgeTool}
        activeTab={activeTab}
        selectedEdgeId={selectedEdgeId}
        onEdgeClick={onEdgeClick}
      />

      {/* Continuous edge drawing — click to chain lines on the roof */}
      <EdgeDrawer
        activeEdgeTool={activeEdgeTool}
        drawModeActive={drawModeActive}
        onManualEdgeCreated={onManualEdgeCreated}
        onDeleteEdge={onDeleteEdge}
        edges={edges}
      />

      {/* Imperative facet overlay — renders red/transparent polygons from React state.
           Works regardless of whether FeatureGroup has layers (drawn vs loaded). */}
      <FacetOverlay
        polygons={facets}
        activeTab={activeTab}
        onFacetAssign={onFacetAssign}
        selectedFacetId={selectedFacetId}
        facetPitchBrush={facetPitchBrush}
      />

      {/* Facet area labels — shown only on Facets tab (Roofr style: "522 sqft") */}
      <FacetLabels
        polygons={facets}
        activeTab={activeTab}
      />

      <VertexDragLayer
        edges={edges}
        activeTab={activeTab}
        activeEdgeTool={activeEdgeTool}
        onVertexMoved={onVertexMoved}
      />
    </MapContainer>
  );
});

export default MapViewer;
