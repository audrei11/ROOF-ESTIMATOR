import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import HeaderBar from '../components/HeaderBar';
import MapViewer from '../components/MapViewer';
import ToolPanel, { FacetToolsOverlay } from '../components/ToolPanel';
import BottomToolbar from '../components/BottomToolbar';
import { computeFacetsFromEdges, transferPitchAssignments, EDGE_COLOR_MAP } from '../utils/measurements';
import { polygonToGeometry, removeEdgeAndOrphanVertices, createManualEdgeWithVertices, moveVertex, migrateProject } from '../utils/geometry';
import { saveProject, getProject, exportProjectsAsJSON } from '../utils/storage';
import { getProjectById } from '../data/projectData';
import { generatePDFReport } from '../utils/pdfReport';

// ── Window-global cache: survives HMR (React Fast Refresh resets useState,
//    but window properties persist across hot-reloads) ──
if (!window.__roofCache) window.__roofCache = { vertices: {}, edges: [], facets: [] };
// Ensure vertices field exists (old cache from polygon-based code may lack it)
if (!window.__roofCache.vertices) window.__roofCache.vertices = {};

export default function ProjectViewer() {
  const { id } = useParams();

  // Try loading from localStorage first, then fall back to mock data
  const savedProject = id && id !== 'new' ? getProject(id) : null;
  const projectData = savedProject || (id && id !== 'new' ? getProjectById(id) : null);

  // Map state
  const [center, setCenter] = useState(projectData?.center || projectData?.coords || [39.7684, -86.1581]);
  const [zoom, setZoom] = useState(20);
  const [tileProvider, setTileProvider] = useState(projectData?.tileProvider || 'googleSatellite');
  const [address, setAddress] = useState(projectData?.address || '');

  // Tab state
  const [activeTab, setActiveTab] = useState('draw');

  // Geometry state — vertices + edges are the source of truth (faces derived from edges)
  const [vertices, setVertices] = useState(() => {
    if (Object.keys(window.__roofCache.vertices).length > 0) return window.__roofCache.vertices;
    return {};
  });
  const [edges, setEdges] = useState(() => {
    if (window.__roofCache.edges.length > 0) return window.__roofCache.edges;
    return [];
  });
  const [showEdgeColors, setShowEdgeColors] = useState(true);
  const [showFacetLabels, setShowFacetLabels] = useState(true);

  // ── Facets: separate state, auto-computed from edges (never mixed with polygons) ──
  const [facets, setFacets] = useState(() => {
    if (window.__roofCache.facets.length > 0) return window.__roofCache.facets;
    return [];
  });

  // Pitch
  const [pitch, setPitch] = useState(projectData?.pitch || '4/12');

  // Undo/redo
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Map drawing triggers
  const mapRef = useRef(null);
  const [activeTool, setActiveTool] = useState(null);
  // Roofr-style edge drawing mode (activated by "+" / "Measure it for me")
  const [drawModeActive, setDrawModeActive] = useState(false);

  // Map rotation (degrees)
  const [mapRotation, setMapRotation] = useState(0);
  // Grid overlay
  const [showGrid, setShowGrid] = useState(false);
  // Units (ft or m)
  const [unit, setUnit] = useState('ft');

  // Edge classification tool — which edge type brush is selected (Roofr-style)
  const [activeEdgeTool, setActiveEdgeTool] = useState(null);
  // Currently selected edge on the map (edge-first workflow)
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  // Facets tab: pitch-first assignment brush (Roofr-style)
  // User selects a pitch first, then clicks sections to assign it
  const [facetPitchBrush, setFacetPitchBrush] = useState(null);

  // Currently selected facet (for blue highlight)
  const [selectedFacetId, setSelectedFacetId] = useState(null);

  // Facets overlay panel open/close (auto-opens when switching to facets tab)
  const [facetsPanelOpen, setFacetsPanelOpen] = useState(true);

  // Auto-save timer
  const autoSaveRef = useRef(null);

  // ── Sync vertices, edges & facets to window cache (survives HMR) ──
  // Ref so closures can access latest edges without re-creating callbacks
  const edgesRef = useRef(edges);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  const verticesRef = useRef(vertices);
  useEffect(() => { verticesRef.current = vertices; }, [vertices]);

  useEffect(() => {
    if (Object.keys(vertices).length > 0) window.__roofCache.vertices = vertices;
  }, [vertices]);
  useEffect(() => {
    if (edges.length > 0) window.__roofCache.edges = edges;
  }, [edges]);
  useEffect(() => {
    window.__roofCache.facets = facets;
  }, [facets]);

  // ── Real-time facet recomputation: auto-detect closed regions whenever edges change ──
  // Facets live in their OWN state array — never mixed with polygons.
  const facetTimerRef = useRef(null);
  useEffect(() => {
    clearTimeout(facetTimerRef.current);
    if (edges.length < 3) {
      // Not enough edges for any closed region — clear facets
      setFacets(prev => prev.length === 0 ? prev : []);
      return;
    }

    facetTimerRef.current = setTimeout(() => {
      const computed = computeFacetsFromEdges(edges);
      if (computed.length === 0) {
        setFacets(prev => prev.length === 0 ? prev : []);
        return;
      }

      setFacets(prev => {
        // Quick check: same count and same geometry → no change needed
        if (prev.length === computed.length) {
          const same = computed.every((nf, i) => {
            const of_ = prev[i];
            return of_ && nf.latlngs.length === of_.latlngs.length
              && Math.abs(nf.area - of_.area) < 1;
          });
          if (same) return prev;
        }

        // Transfer pitch assignments from old facets to new (by centroid match)
        const withPitch = transferPitchAssignments(prev, computed);
        console.log('[Facets] recomputed', withPitch.length, 'facets from', edges.length, 'edges');
        return withPitch;
      });
    }, 300); // 300ms debounce

    return () => clearTimeout(facetTimerRef.current);
  }, [edges]);

  // Load project when ID changes — migrate old polygon format to edge-based
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    // If window cache already has data (HMR recovery), skip re-loading
    if (Object.keys(window.__roofCache.vertices).length > 0) {
      console.log('[ProjectViewer] HMR recovery — vertices:', Object.keys(window.__roofCache.vertices).length, 'edges:', window.__roofCache.edges.length);
      hasLoadedRef.current = true;
      return;
    }
    const freshProject = id && id !== 'new' ? getProject(id) : null;
    let data = freshProject || projectData;
    if (data) {
      // Migrate old polygon-based projects → edge-based
      data = migrateProject(data);

      // Restore project settings (address, center, pitch, tile provider)
      setCenter(data.center || data.coords || [39.7684, -86.1581]);
      setAddress(data.address || '');
      setPitch(data.pitch || '4/12');
      setTileProvider(data.tileProvider || 'googleSatellite');

      // Do NOT restore edges/vertices/facets on page refresh — start with a clean canvas.
      // Drawing data is only preserved across HMR via window.__roofCache (above).
      console.log('[ProjectViewer] loaded project settings (drawings cleared on refresh)');
    }
    hasLoadedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Listen for pitch selection from the pitch tool tab
  useEffect(() => {
    const bc = new BroadcastChannel('roof-pitch-channel');
    bc.onmessage = (e) => {
      if (e.data?.type === 'pitch-selected' && e.data.pitch) {
        setPitch(e.data.pitch);
      }
    };
    return () => bc.close();
  }, []);

  const openPitchTool = useCallback(() => {
    const [lat, lng] = center;
    window.open(`/pitch?lat=${lat}&lng=${lng}`, '_blank');
  }, [center]);

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (edges.length > 0 || facets.length > 0 || address) {
        doSave(true);
      }
    }, 30000);
    return () => clearInterval(autoSaveRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vertices, edges, facets, address, center, pitch, tileProvider]);

  // ── Undo/redo — snapshots { vertices, edges } ──
  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), { vertices: verticesRef.current, edges: edgesRef.current }]);
    setRedoStack([]);
  }, []);

  // ── Shape created (from DrawControl polygon close) → decompose into vertices + edges ──
  const handlePolygonCreated = useCallback(({ id: layerId, latlngs }) => {
    pushUndo();
    const fakePolygon = { id: layerId.toString(), latlngs };
    const { vertices: newVerts, edges: newEdges } = polygonToGeometry(fakePolygon, { ...verticesRef.current });
    setVertices(newVerts);
    // Deduplicate: skip new edges that overlap an existing edge (same vertices ±EPS)
    const DEDUP_EPS = 0.000005; // ~0.5m
    const sameCoord = (a, b) => Math.abs(a - b) < DEDUP_EPS;
    const samePoint = (a, b) => sameCoord(a[0], b[0]) && sameCoord(a[1], b[1]);
    setEdges(prev => {
      const unique = newEdges.filter(ne => {
        return !prev.some(pe =>
          (samePoint(pe.start, ne.start) && samePoint(pe.end, ne.end)) ||
          (samePoint(pe.start, ne.end) && samePoint(pe.end, ne.start))
        );
      });
      console.log('[handlePolygonCreated] decomposed polygon into', newEdges.length, 'edges,',
        (newEdges.length - unique.length), 'duplicates skipped,', Object.keys(newVerts).length, 'total vertices');
      return [...prev, ...unique];
    });
  }, [pushUndo]);

  const handleDeleteAll = useCallback(() => {
    if (edges.length === 0 && facets.length === 0) return;
    if (window.confirm('Delete all roof sections and edges?')) {
      pushUndo();
      setVertices({});
      setEdges([]);
      setFacets([]);
      setSelectedFacetId(null);
    }
  }, [edges, facets, pushUndo]);

  const handleEdgeTypeChange = useCallback((edgeId, newType) => {
    setEdges(prev => prev.map(e =>
      e.id === edgeId ? { ...e, type: newType, color: EDGE_COLOR_MAP[newType] || '#94a3b8' } : e
    ));
  }, []);

  // Manual edge drawing — user clicks points on the map to chain edges
  const handleManualEdgeCreated = useCallback((start, end, id) => {
    const { vertices: newVerts, edge } = createManualEdgeWithVertices({ ...verticesRef.current }, start, end, id);
    setVertices(newVerts);
    if (edge) {
      // Deduplicate: skip if an edge already exists at the same location
      const DEDUP_EPS = 0.000005;
      const sameCoord = (a, b) => Math.abs(a - b) < DEDUP_EPS;
      const samePoint = (a, b) => sameCoord(a[0], b[0]) && sameCoord(a[1], b[1]);
      setEdges(prev => {
        const exists = prev.some(pe =>
          (samePoint(pe.start, edge.start) && samePoint(pe.end, edge.end)) ||
          (samePoint(pe.start, edge.end) && samePoint(pe.end, edge.start))
        );
        if (exists) return prev;
        return [...prev, edge];
      });
    }
  }, []);

  // Delete a single edge by id — removes orphan vertices too
  const handleDeleteEdge = useCallback((edgeId) => {
    pushUndo();
    const { vertices: newVerts, edges: newEdges } = removeEdgeAndOrphanVertices(verticesRef.current, edgesRef.current, edgeId);
    setVertices(newVerts);
    setEdges(newEdges);
  }, [pushUndo]);

  // Facet click: ALWAYS select/toggle the facet. If brush is active, also assign pitch.
  const handleFacetAssign = useCallback((facetId) => {
    // If brush is active, assign the pitch too
    if (facetPitchBrush) {
      setFacets(prev => prev.map(f =>
        f.id === facetId ? { ...f, pitch: facetPitchBrush } : f
      ));
    }
    // Always toggle selection so the sidebar activates
    setSelectedFacetId(prev => prev === facetId ? null : facetId);
  }, [facetPitchBrush]);

  const handleDeleteFacetPitch = useCallback((facetId) => {
    if (!facetId) return;
    console.log('[Facets] Delete pitch for facet:', facetId);
    setFacets(prev => prev.map(f =>
      f.id === facetId ? { ...f, pitch: null } : f
    ));
  }, []);

  const handleDeleteAllPitches = useCallback(() => {
    console.log('[Facets] Delete ALL pitches');
    setFacets(prev => prev.map(f => ({ ...f, pitch: null })));
  }, []);

  // Delete a specific facet (remove it entirely)
  const handleDeleteSelectedFacet = useCallback((facetId) => {
    console.log('[Facets] Delete facet:', facetId);
    if (!facetId) { console.log('[Facets] No facetId — skipping delete'); return; }
    setFacets(prev => prev.filter(f => f.id !== facetId));
    if (selectedFacetId === facetId) setSelectedFacetId(null);
  }, [selectedFacetId]);

  // Toggle a label on a facet (Dormer, Two story, etc.) — labels is an array
  const handleFacetLabelToggle = useCallback((facetId, label) => {
    if (!facetId || !label) return;
    setFacets(prev => prev.map(f => {
      if (f.id !== facetId) return f;
      const current = Array.isArray(f.labels) ? f.labels : (f.label ? [f.label] : []);
      const has = current.includes(label);
      return { ...f, labels: has ? current.filter(l => l !== label) : [...current, label] };
    }));
  }, []);

  // Direct pitch assignment: click pitch in sidebar → assign to selected facet
  const handleAssignPitchToFacet = useCallback((pitchValue) => {
    console.log('[Facets] Pitch clicked:', pitchValue, '| selectedFacetId:', selectedFacetId);
    if (!selectedFacetId) {
      // No facet selected — set the brush so user can click facets on the map
      setFacetPitchBrush(prev => prev === pitchValue ? null : pitchValue);
      return;
    }
    // Facet is selected — assign pitch directly
    console.log('[Facets] Assigning pitch', pitchValue, 'directly to facet', selectedFacetId);
    setFacets(prev => prev.map(f =>
      f.id === selectedFacetId ? { ...f, pitch: pitchValue } : f
    ));
  }, [selectedFacetId]);

  // Vertex drag: when a user drags an edge endpoint, update vertex + all connected edges
  const handleVertexMoved = useCallback((oldLatLng, newLatLng) => {
    const { vertices: newVerts, edges: newEdges } = moveVertex(verticesRef.current, edgesRef.current, oldLatLng, newLatLng);
    setVertices(newVerts);
    setEdges(newEdges);
  }, []);

  // When user clicks an edge on the map:
  //   - If draw_edge tool is active → ignore (map clicks handled by EdgeDrawer)
  //   - If a classification tool is active → assign the tool's type directly
  //   - If delete_edge tool is active → delete the edge
  //   - If no tool → just select the edge (edge-first workflow)
  const handleMapEdgeClick = useCallback((edgeId) => {
    if (activeEdgeTool === 'draw_edge') return; // handled by EdgeDrawer
    if (activeEdgeTool === 'delete_edge') {
      handleDeleteEdge(edgeId);
      return;
    }
    if (activeEdgeTool) {
      handleEdgeTypeChange(edgeId, activeEdgeTool);
    } else {
      setSelectedEdgeId(prev => prev === edgeId ? null : edgeId);
    }
  }, [activeEdgeTool, handleEdgeTypeChange, handleDeleteEdge]);

  // When user picks a tool from the panel:
  //   - Cancel any active draw/edit mode so clicks go to edges, not new vertices
  //   - If an edge is already selected → assign immediately, keep tool active
  //   - Otherwise → just toggle the tool
  const handleEdgeToolSelect = useCallback((type) => {
    // Gracefully finish drawing so map clicks go to edges, not vertices
    if (activeTool) {
      mapRef.current?.finishAndExit();
    }
    // draw_edge and delete_edge are action tools, don't assign to selected edge
    if (type !== 'draw_edge' && type !== 'delete_edge' && selectedEdgeId && type) {
      handleEdgeTypeChange(selectedEdgeId, type);
      setSelectedEdgeId(null);
    }
    setActiveEdgeTool(prev => prev === type ? null : type);
  }, [selectedEdgeId, handleEdgeTypeChange, activeTool]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(rs => [...rs, { vertices, edges }]);
    setUndoStack(us => us.slice(0, -1));
    setVertices(prev.vertices);
    setEdges(prev.edges);
  }, [undoStack, vertices, edges]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(us => [...us, { vertices, edges }]);
    setRedoStack(rs => rs.slice(0, -1));
    setVertices(next.vertices);
    setEdges(next.edges);
  }, [redoStack, vertices, edges]);

  // Global Ctrl+Z / Ctrl+Y undo/redo (works outside draw mode too)
  useEffect(() => {
    const onGlobalKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y' || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))) {
        e.preventDefault();
        handleRedo();
      }
    };
    document.addEventListener('keydown', onGlobalKey);
    return () => document.removeEventListener('keydown', onGlobalKey);
  }, [handleUndo, handleRedo]);

  const handleGeocode = useCallback((coords) => {
    setCenter(coords);
    setZoom(20);
  }, []);

  // Instant-save on every vertex/edge/facet change so data survives HMR state resets
  useEffect(() => {
    if (!id || id === 'new') return;
    if (edges.length === 0 && facets.length === 0) return;
    const project = {
      id,
      address, center, pitch, tileProvider,
      vertices,
      edges: edges.map(e => ({ id: e.id, v1: e.v1, v2: e.v2, start: e.start, end: e.end, length: e.length, bearing: e.bearing, type: e.type, color: e.color, manual: e.manual || false })),
      facets: facets.map(f => ({ id: f.id, latlngs: f.latlngs, area: f.area, pitch: f.pitch, labels: f.labels || [] })),
      totalArea: facets.reduce((sum, f) => sum + (f.area || 0), 0),
      status: 'in_progress',
      type: 'DIY',
      updatedAt: new Date().toISOString(),
    };
    saveProject(project);
  }, [vertices, edges, facets, id, address, center, pitch, tileProvider]);

  const doSave = useCallback((silent) => {
    const totalArea = facets.reduce((sum, f) => sum + (f.area || 0), 0);
    const project = {
      id: id || Date.now().toString(),
      address, center, pitch, tileProvider,
      vertices,
      edges: edges.map(e => ({ id: e.id, v1: e.v1, v2: e.v2, start: e.start, end: e.end, length: e.length, bearing: e.bearing, type: e.type, color: e.color, manual: e.manual || false })),
      facets: facets.map(f => ({ id: f.id, latlngs: f.latlngs, area: f.area, pitch: f.pitch, labels: f.labels || [] })),
      totalArea,
      status: 'in_progress',
      type: 'DIY',
      updatedAt: new Date().toISOString(),
    };
    saveProject(project);
    if (!silent) {
      alert('Project saved!');
    }
  }, [vertices, edges, facets, address, center, pitch, tileProvider, id]);

  const handleSave = useCallback(() => {
    doSave(false);
  }, [doSave]);

  // "Mark as Done" — save the project, then generate and download the PDF report
  const handleMarkDone = useCallback(async () => {
    doSave(true); // silent save first

    // Find the Leaflet map container for the screenshot
    const mapEl = document.querySelector('.pv-map .leaflet-container');

    // Temporarily reset map rotation to 0° so satellite screenshot matches
    // the North-up diagrams in the PDF (Roofr standard)
    const savedRotation = mapRotation;
    if (savedRotation !== 0) {
      setMapRotation(0);
      // Wait for map to re-render with 0° bearing + tiles to settle
      await new Promise(r => setTimeout(r, 1500));
    }

    try {
      await generatePDFReport({
        address,
        facets,
        edges,
        mapElement: mapEl,
        projectId: id,
        mapBearing: savedRotation || 0,
      });
    } catch (err) {
      console.error('[PDF] Report generation failed:', err);
      alert('PDF generation failed: ' + err.message);
    }

    // Restore original map rotation
    if (savedRotation !== 0) {
      setMapRotation(savedRotation);
    }
  }, [doSave, address, id, facets, edges, mapRotation]);

  return (
    <div className="project-viewer">
      <Sidebar />
      <div className="pv-main">
      {/* Header */}
      <div className="pv-header-wrap">
        <HeaderBar
          address={address}
          onAddressChange={setAddress}
          onGeocode={handleGeocode}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            // Gracefully finish polygon drawing when switching tabs
            if (activeTool) {
              mapRef.current?.finishAndExit();
            }
            // Clear active tools when switching tabs — each tab has its own tools
            setActiveEdgeTool(null);
            setSelectedEdgeId(null);
            setFacetPitchBrush(null);
            // Clear selections when entering facets tab, auto-open panel
            if (tab === 'facets') {
              setSelectedFacetId(null);
              setFacetsPanelOpen(true);
            }
          }}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSave}
          onMarkDone={handleMarkDone}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
        />
      </div>

      {/* Body */}
      <div className="pv-body">
        {/* Map */}
        <div className="pv-map">
          <MapViewer
            ref={mapRef}
            projectId={id}
            center={center}
            zoom={zoom}
            tileProvider={tileProvider}
            onPolygonCreated={handlePolygonCreated}
            edges={edges}
            showEdgeColors={showEdgeColors}
            addressLabel={address}
            onActiveToolChange={setActiveTool}
            facets={facets}
            activeEdgeTool={activeEdgeTool}
            drawModeActive={drawModeActive}
            selectedEdgeId={selectedEdgeId}
            onEdgeClick={handleMapEdgeClick}
            mapRotation={mapRotation}
            onBearingChange={setMapRotation}
            activeTab={activeTab}
            showFacetLabels={showFacetLabels}
            onManualEdgeCreated={handleManualEdgeCreated}
            onDeleteEdge={handleDeleteEdge}
            onFacetAssign={handleFacetAssign}
            facetPitchBrush={facetPitchBrush}
            selectedFacetId={selectedFacetId}
            onVertexMoved={handleVertexMoved}
          />

          {/* Floating Layer Manager (Roofr-style, on map) — hidden on Facets tab */}
          <div className="map-layer-mgr" style={activeTab === 'facets' ? { display: 'none' } : undefined}>
            <div className="mlm-title">All layers</div>
            <button
              className="mlm-add"
              onClick={() => setDrawModeActive(true)}
              title="Add new roof section"
            >+</button>
            {facets.map((f, i) => (
              <button
                key={f.id}
                className="mlm-chip"
                title={`Face ${String.fromCharCode(65 + i)} — ${(f.area || 0).toFixed(0)} sq ft`}
              >
                {String.fromCharCode(65 + i)}
              </button>
            ))}
          </div>

          {/* Grid overlay */}
          {showGrid && <div className="map-grid-overlay" />}

          {/* "Measure it for me" button (Roofr-style, on map) */}
          <button
            className="map-measure-btn"
            onClick={() => setDrawModeActive(true)}
          >
            Measure it for me
          </button>

          <BottomToolbar
            center={center}
            tileProvider={tileProvider}
            onTileChange={setTileProvider}
            onOpenPitchOverlay={openPitchTool}
            onTriggerDraw={() => setDrawModeActive(true)}
            activeTool={activeTool}
            mapRotation={mapRotation}
            onRotateLeft={() => {
              if (edges.length > 0) { alert('Rotate the map before drawing.'); return; }
              setMapRotation(r => Math.round(r - 2));
            }}
            onRotateRight={() => {
              if (edges.length > 0) { alert('Rotate the map before drawing.'); return; }
              setMapRotation(r => Math.round(r + 2));
            }}
            onFineRotateLeft={() => {
              if (edges.length > 0) { alert('Rotate the map before drawing.'); return; }
              setMapRotation(r => Math.round((r - 0.25) * 100) / 100);
            }}
            onFineRotateRight={() => {
              if (edges.length > 0) { alert('Rotate the map before drawing.'); return; }
              setMapRotation(r => Math.round((r + 0.25) * 100) / 100);
            }}
            onResetRotation={() => {
              if (edges.length > 0) { alert('Rotate the map before drawing.'); return; }
              setMapRotation(0);
            }}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(g => !g)}
            unit={unit}
            onToggleUnit={() => setUnit(u => u === 'ft' ? 'm' : 'ft')}
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
          />

        </div>

        {/* Facet Tools Overlay — rendered OUTSIDE pv-map to avoid Leaflet click interception */}
        {activeTab === 'facets' && facetsPanelOpen && (
          <FacetToolsOverlay
            facets={facets}
            facetPitchBrush={facetPitchBrush}
            onFacetPitchBrushChange={setFacetPitchBrush}
            onFacetAssign={handleFacetAssign}
            onDeleteFacetPitch={handleDeleteFacetPitch}
            onDeleteAllPitches={handleDeleteAllPitches}
            selectedFacetId={selectedFacetId}
            onDeleteSelectedFacet={handleDeleteSelectedFacet}
            onFacetLabelToggle={handleFacetLabelToggle}
            onAssignPitchToFacet={handleAssignPitchToFacet}
            onClose={() => setFacetsPanelOpen(false)}
          />
        )}

        {/* Sidebar — hidden on facets tab (overlay replaces it) */}
        {activeTab !== 'facets' && <ToolPanel
          activeTab={activeTab}
          facets={facets}
          onDeleteAll={handleDeleteAll}
          edges={edges}
          onEdgeTypeChange={handleEdgeTypeChange}
          showEdgeColors={showEdgeColors}
          onToggleEdgeColors={setShowEdgeColors}
          pitch={pitch}
          onPitchChange={setPitch}
          center={center}
          onExport={exportProjectsAsJSON}
          onOpenPitchOverlay={openPitchTool}
          onTriggerDraw={() => setDrawModeActive(true)}
          onTriggerEdit={() => mapRef.current?.triggerEdit()}
          onTriggerDelete={() => mapRef.current?.triggerDelete()}
          onTriggerDeleteEdge={() => handleEdgeToolSelect('delete_edge')}
          onResumeDraw={() => mapRef.current?.resumeDraw()}
          onDeleteAllEdges={() => { handleDeleteAll(); mapRef.current?.deleteAllEdges(); }}
          onSaveEdit={() => mapRef.current?.save()}
          onCancelEdit={() => mapRef.current?.cancel()}
          activeTool={activeTool}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          activeEdgeTool={activeEdgeTool}
          onActiveEdgeToolChange={handleEdgeToolSelect}
          selectedEdgeId={selectedEdgeId}
          showFacetLabels={showFacetLabels}
          onToggleFacetLabels={setShowFacetLabels}
          facetPitchBrush={facetPitchBrush}
          onFacetPitchBrushChange={setFacetPitchBrush}
          onFacetAssign={handleFacetAssign}
          onDeleteFacetPitch={handleDeleteFacetPitch}
          onDeleteAllPitches={handleDeleteAllPitches}
          selectedFacetId={selectedFacetId}
          onDeleteSelectedFacet={handleDeleteSelectedFacet}
          onFacetLabelToggle={handleFacetLabelToggle}
        />}
      </div>
      </div>{/* end pv-main */}
    </div>
  );
}
