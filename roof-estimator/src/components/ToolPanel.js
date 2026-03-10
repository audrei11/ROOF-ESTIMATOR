import React from 'react';
import { EDGE_COLOR_MAP, EDGE_TYPES, EDGE_DASHED_TYPES, EDGE_TYPE_LABELS } from '../utils/measurements';

function formatFeetInches(feet) {
  const ft = Math.floor(feet);
  const inches = Math.round((feet - ft) * 12);
  return `${ft}ft ${inches}in`;
}

export default function ToolPanel({
  activeTab,
  facets,
  edges,
  onEdgeTypeChange,
  showEdgeColors,
  onToggleEdgeColors,
  onTriggerEdit,
  onTriggerDeleteEdge,
  onResumeDraw,
  onDeleteAllEdges,
  onSaveEdit,
  onCancelEdit,
  activeTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  activeEdgeTool,
  onActiveEdgeToolChange,
  selectedEdgeId,
}) {
  return (
    <div className="sidebar">
      {/* Draw Tools - visible when Draw tab active */}
      {activeTab === 'draw' && (
        <>
          <DrawToolsSection
            facets={facets}
            edges={edges}
            onTriggerEdit={onTriggerEdit}
            onTriggerDeleteEdge={onTriggerDeleteEdge}
            onResumeDraw={onResumeDraw}
            onDeleteAllEdges={onDeleteAllEdges}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            activeTool={activeTool}
            activeEdgeTool={activeEdgeTool}
            onActiveEdgeToolChange={onActiveEdgeToolChange}
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
          {/* Face list in draw tab */}
          <FacesPanel facets={facets} />
        </>
      )}

      {/* Edge Classification - visible when Edges tab active */}
      {activeTab === 'edges' && (
        <EdgesSection
          edges={edges}
          onEdgeTypeChange={onEdgeTypeChange}
          showEdgeColors={showEdgeColors}
          onToggleEdgeColors={onToggleEdgeColors}
          activeEdgeTool={activeEdgeTool}
          onActiveEdgeToolChange={onActiveEdgeToolChange}
          selectedEdgeId={selectedEdgeId}
        />
      )}

      {/* Always visible: Edge Summary Output (hidden on facets tab — facets has its own overlay) */}
      {activeTab !== 'facets' && edges.length > 0 && (
        <EdgeSummaryOutput edges={edges} />
      )}

    </div>
  );
}

/* ===================== DRAW TOOLS ===================== */
function DrawToolsSection({ facets, edges, onTriggerDraw, onTriggerEdit, onTriggerDeleteEdge, onResumeDraw, onDeleteAllEdges, onSaveEdit, onCancelEdit, activeTool, activeEdgeTool, onActiveEdgeToolChange, onUndo, onRedo, canUndo, canRedo }) {
  return (
    <div className="sidebar-section">
      {/* Quick action bar with undo/redo */}
      <div className="draw-quick-bar">
        <button className="draw-quick-btn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        </button>
        <button className="draw-quick-btn" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/>
          </svg>
        </button>
        <div className="draw-quick-sep" />
        <span className="draw-quick-info">
          {edges.length} edge{edges.length !== 1 ? 's' : ''} &middot; {facets.length} face{facets.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="sidebar-section-header">
        <h3>Draw tools</h3>
      </div>
      <ul className="draw-tools-list">
        <DrawToolItem
          icon="pencil"
          label="Draw"
          hint="Trace lines on the roof"
          onClick={() => onActiveEdgeToolChange?.('draw_edge')}
          active={activeEdgeTool === 'draw_edge'}
          primary
        />
        <DrawToolItem
          icon="move"
          label="Edit"
          hint="Move anchor points"
          onClick={() => { onActiveEdgeToolChange?.(null); onTriggerEdit(); }}
          active={activeTool === 'edit'}
        />
        <DrawToolItem
          icon="scissors"
          label="Delete edge"
          hint="Click edge to remove"
          onClick={() => onTriggerDeleteEdge?.()}
          active={activeEdgeTool === 'delete_edge'}
        />
        <DrawToolItem
          icon="trash"
          label="Clear all"
          hint="Remove everything"
          onClick={onDeleteAllEdges}
          destructive
        />
      </ul>

      {/* Save/Cancel bar when in edit or delete mode */}
      {(activeTool === 'edit' || activeTool === 'delete') && (
        <div className="draw-action-bar">
          <button className="draw-action-save" onClick={onSaveEdit}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Save changes
          </button>
          <button className="draw-action-cancel" onClick={onCancelEdit}>
            Cancel
          </button>
        </div>
      )}

      {/* Done bar when in delete_edge mode */}
      {activeEdgeTool === 'delete_edge' && (
        <div className="draw-action-bar">
          <button className="draw-action-save" onClick={() => onActiveEdgeToolChange?.(null)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Done
          </button>
        </div>
      )}

      {activeEdgeTool === 'draw_edge' && (
        <div className="draw-mode-hint">
          Drawing — click to place connected lines. Double-click to finish.
        </div>
      )}

      {activeEdgeTool === 'delete_edge' && (
        <div className="draw-mode-hint">
          Click on an edge to delete it. Press "Done" when finished.
        </div>
      )}
    </div>
  );
}

function DrawToolItem({ icon, label, hint, onClick, destructive, active, primary }) {
  return (
    <li
      className={`draw-tool-item ${destructive ? 'destructive' : ''} ${active ? 'active' : ''} ${primary ? 'primary' : ''}`}
      onClick={onClick}
    >
      <span className="draw-tool-icon">
        <SvgIcon type={icon} />
      </span>
      <div className="draw-tool-text">
        <span className="draw-tool-label">{label}</span>
        {hint && <span className="draw-tool-hint">{hint}</span>}
      </div>
      {active && <span className="draw-tool-active-dot" />}
    </li>
  );
}

/* ===================== FACES PANEL ===================== */
function FacesPanel({ facets }) {
  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header">
        <h3>Faces ({facets.length})</h3>
      </div>
      {facets.length === 0 ? (
        <p className="sidebar-hint">Draw edges to create roof faces.</p>
      ) : (
        <ul className="layers-list">
          {facets.map((f, i) => (
            <li key={f.id} className="layer-item">
              <span className="layer-letter">{String.fromCharCode(65 + i)}</span>
              <div className="layer-info">
                <span className="layer-name">Face {String.fromCharCode(65 + i)}</span>
                <span className="layer-area">{(f.area || 0).toFixed(0)} sq ft</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ===================== EDGES — Roofr-style Tool Selector ===================== */
function EdgesSection({ edges, onEdgeTypeChange, showEdgeColors, onToggleEdgeColors, activeEdgeTool, onActiveEdgeToolChange, selectedEdgeId, onDeleteEdge }) {
  const selectedEdge = selectedEdgeId ? edges.find(e => e.id === selectedEdgeId) : null;

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header">
        <h3>Edges tools</h3>
        <label className="sidebar-toggle">
          <input
            type="checkbox"
            checked={showEdgeColors}
            onChange={(e) => onToggleEdgeColors(e.target.checked)}
          />
          Show
        </label>
      </div>

      {/* Selected edge indicator — shows when user clicked an edge on the map */}
      {selectedEdge && (
        <div className="edge-selected-banner">
          <span className="edge-selected-dot" style={{ background: selectedEdge.color }} />
          <span className="edge-selected-text">
            Edge selected ({formatFeetInches(selectedEdge.length)}) — now pick a type below
          </span>
        </div>
      )}

      {/* Roofr-style clickable tool list */}
      <ul className="edge-tools-list">
        {EDGE_TYPES.map(type => {
          const isActive = activeEdgeTool === type;
          const isDashed = EDGE_DASHED_TYPES.has(type);
          const label = EDGE_TYPE_LABELS[type] || type;
          const color = EDGE_COLOR_MAP[type];
          return (
            <li
              key={type}
              className={`edge-tool-item ${isActive ? 'active' : ''} ${selectedEdgeId ? 'has-selection' : ''}`}
              onClick={() => onActiveEdgeToolChange?.(type)}
            >
              <span className="edge-tool-line-icon">
                <svg width="24" height="12" viewBox="0 0 24 12">
                  <line
                    x1="0" y1="6" x2="24" y2="6"
                    stroke={color}
                    strokeWidth="3"
                    strokeDasharray={isDashed ? '4,3' : 'none'}
                  />
                </svg>
              </span>
              <span className="edge-tool-name">{label}</span>
            </li>
          );
        })}
      </ul>

      {activeEdgeTool && activeEdgeTool !== 'draw_edge' && activeEdgeTool !== 'delete_edge' && !selectedEdgeId && (
        <div className="draw-mode-hint">
          Click any edge on the map to classify it as <strong style={{ color: EDGE_COLOR_MAP[activeEdgeTool] }}>{EDGE_TYPE_LABELS[activeEdgeTool]}</strong>. Click the tool again to deselect.
        </div>
      )}

      {!activeEdgeTool && !selectedEdgeId && edges.length === 0 && (
        <p className="sidebar-hint">Go to the Draw tab to draw edges first, then come here to classify them.</p>
      )}

      {!activeEdgeTool && !selectedEdgeId && edges.length > 0 && (
        <p className="sidebar-hint">Pick a type below, then click edges on the map to classify them.</p>
      )}

      {/* Edge list — secondary view showing each edge with dropdown override */}
      {edges.length > 0 && (
        <>
          <div className="sidebar-section-header" style={{ marginTop: 12 }}>
            <h3>Edge list</h3>
          </div>
          <ul className="edge-items-list">
            {edges.map((edge) => (
              <li key={edge.id} className={`edge-row ${selectedEdgeId === edge.id ? 'edge-row-selected' : ''}`}>
                <span className="edge-bar" style={{ background: edge.color }} />
                <span className="edge-len">{formatFeetInches(edge.length)}</span>
                <select
                  className="edge-select"
                  value={edge.type}
                  onChange={(e) => onEdgeTypeChange(edge.id, e.target.value)}
                >
                  {[...EDGE_TYPES, 'unclassified'].filter((v, i, a) => a.indexOf(v) === i).map(t => (
                    <option key={t} value={t}>{EDGE_TYPE_LABELS[t] || t}</option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Summary by type */}
      {edges.length > 0 && (
        <div className="edge-summary-grid">
          {EDGE_TYPES.map(type => {
            const total = edges.filter(e => e.type === type).reduce((s, e) => s + e.length, 0);
            if (total === 0) return null;
            return (
              <div key={type} className="edge-summary-chip">
                <span className="edge-dot" style={{ background: EDGE_COLOR_MAP[type] }} />
                {EDGE_TYPE_LABELS[type] || type}: {formatFeetInches(total)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ===================== FACETS OVERLAY PANEL — ROOFr-style floating sidebar ===================== */
/*
 * Professional sidebar for the Facets tab. Rendered as a flex sibling of pv-map
 * inside pv-body (NOT inside the Leaflet container). This avoids ALL Leaflet
 * click-interception issues.
 *
 * Design: always fully visible (NO opacity-50 disabled state on the whole panel).
 * When no facet is selected, labels/pitch text are light gray and clicks are guarded.
 * When a facet IS selected, text turns dark and everything is interactive.
 */
export function FacetToolsOverlay({ facets, facetPitchBrush, onFacetPitchBrushChange, onFacetAssign, onDeleteFacetPitch, onDeleteAllPitches, selectedFacetId, onDeleteSelectedFacet, onFacetLabelToggle, onAssignPitchToFacet, onClose }) {
  const allFacets = facets || [];
  const selectedFacet = selectedFacetId ? allFacets.find(p => p.id === selectedFacetId) : null;
  const hasSel = !!selectedFacet;

  const FACET_LABELS = ['Dormer', 'Two story', 'Two layer', 'Flat roof'];

  const allPitchValues = [];
  for (let i = 0; i <= 24; i++) allPitchValues.push(`${i}/12`);

  // Selected facet's labels array (backward-compat with old single `label` string)
  const facetLabels = selectedFacet
    ? (Array.isArray(selectedFacet.labels) ? selectedFacet.labels : (selectedFacet.label ? [selectedFacet.label] : []))
    : [];

  return (
    <div className="fto-panel" onClick={(e) => e.stopPropagation()}>
      {/* ── Header ── */}
      <div className="fto-header">
        <span className="fto-title">Facet Tools</span>
        <button className="fto-close-btn" onClick={onClose} title="Close panel">&times;</button>
      </div>

      {/* ── Selection Status Bar ── */}
      {hasSel ? (
        <div className="fto-status fto-status-active">
          <div className="fto-status-dot" />
          <span>Facet selected &mdash; {Math.round(selectedFacet.area)} sqft</span>
          {selectedFacet.pitch && selectedFacet.pitch !== '0/12' && (
            <span className="fto-status-pitch">&nbsp;&middot;&nbsp;{selectedFacet.pitch}</span>
          )}
        </div>
      ) : (
        <div className="fto-status fto-status-empty">
          {allFacets.length > 0
            ? 'Click a facet on the map to select it'
            : 'No facets detected — draw edges to create facets'}
        </div>
      )}

      {/* ── Delete Actions ── */}
      <div className="fto-actions">
        <button
          className={`fto-action-btn ${!hasSel ? 'fto-action-muted' : ''}`}
          onClick={() => { if (hasSel) onDeleteSelectedFacet?.(selectedFacetId); }}
        >
          <span className="fto-action-icon fto-icon-red">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </span>
          <span className="fto-action-label">Delete facet</span>
        </button>

        <button
          className={`fto-action-btn ${!hasSel ? 'fto-action-muted' : ''}`}
          onClick={() => { if (hasSel) onDeleteFacetPitch?.(selectedFacetId); }}
        >
          <span className="fto-action-icon fto-icon-red">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </span>
          <span className="fto-action-label">Delete pitch</span>
        </button>

        <button
          className="fto-action-btn"
          onClick={() => onDeleteAllPitches?.()}
        >
          <span className="fto-action-icon fto-icon-amber">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </span>
          <span className="fto-action-label">Delete all pitches</span>
        </button>
      </div>

      {/* ── Labels (toggle array) ── */}
      <div className="fto-section">
        <div className="fto-section-title">Labels</div>
        <div className="fto-label-list">
          {FACET_LABELS.map(label => {
            const isActive = facetLabels.includes(label);
            return (
              <div
                key={label}
                className={`fto-label-item ${isActive ? 'active' : ''} ${!hasSel ? 'muted' : ''}`}
                onClick={() => { if (hasSel) onFacetLabelToggle?.(selectedFacetId, label); }}
              >
                <span className="fto-label-text">{label}</span>
                {isActive && (
                  <svg className="fto-label-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pitch (Vertical Scrollable List) ── */}
      <div className="fto-section fto-pitch-section">
        <div className="fto-section-title">
          Pitch
          {facetPitchBrush && !hasSel && (
            <span className="fto-brush-hint">&nbsp;&mdash; brush: {facetPitchBrush}</span>
          )}
        </div>
        <div className="fto-pitch-list">
          {allPitchValues.map(p => {
            const isBrush = !hasSel && facetPitchBrush === p;
            const isAssigned = selectedFacet?.pitch === p;
            return (
              <div
                key={p}
                className={`fto-pitch-item ${isBrush ? 'brush' : ''} ${isAssigned ? 'assigned' : ''}`}
                onClick={() => onAssignPitchToFacet?.(p)}
              >
                <span className="fto-pitch-value">{p}</span>
                {isAssigned && (
                  <svg className="fto-pitch-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ===================== EDGE SUMMARY OUTPUT ===================== */
function EdgeSummaryOutput({ edges }) {
  // Group edges by type and sum
  const summary = {};
  const types = EDGE_TYPES;
  types.forEach(type => {
    const matching = edges.filter(e => e.type === type);
    if (matching.length > 0) {
      summary[type] = {
        count: matching.length,
        total: matching.reduce((s, e) => s + e.length, 0),
        edges: matching,
      };
    }
  });

  const totalLength = edges.reduce((s, e) => s + e.length, 0);

  if (Object.keys(summary).length === 0) return null;

  return (
    <div className="sidebar-section edge-summary-section">
      <div className="sidebar-section-header">
        <h3>Roof Edge Summary</h3>
      </div>
      <div className="edge-output-list">
        {types.map(type => {
          if (!summary[type]) return null;
          const { count, total } = summary[type];
          return (
            <div key={type} className="edge-output-row">
              <div className="edge-output-color" style={{ backgroundColor: EDGE_COLOR_MAP[type] }} />
              <div className="edge-output-info">
                <span className="edge-output-label">{EDGE_TYPE_LABELS[type] || type}</span>
                <span className="edge-output-count">{count} segment{count > 1 ? 's' : ''}</span>
              </div>
              <span className="edge-output-value">{formatFeetInches(total)}</span>
            </div>
          );
        })}
        <div className="edge-output-total">
          <span>Total Perimeter</span>
          <span className="edge-output-total-val">{formatFeetInches(totalLength)}</span>
        </div>
      </div>
    </div>
  );
}

/* ===================== SVG ICONS ===================== */
function SvgIcon({ type }) {
  const icons = {
    pencil: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    polygon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 22 8.5 18 20 6 20 2 8.5"/>
      </svg>
    ),
    move: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/>
        <polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/>
        <line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>
      </svg>
    ),
    scissors: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
    trash: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    ),
    reset: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
      </svg>
    ),
    refresh: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/>
      </svg>
    ),
    upload: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
      </svg>
    ),
    download: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    globe: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    home: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    chart: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  };
  return icons[type] || null;
}
