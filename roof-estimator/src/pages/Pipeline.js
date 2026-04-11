import { useState, useMemo } from 'react';

const CONTACTS_KEY = 'precision-contacts';
const PIPELINE_KEY = 'precision-pipeline';

const DEFAULT_CONTACTS = [
  { id: '1', name: 'Biak Lian',       email: '',                    phone: '',              job: '7634 Cynthia Dr, Indianapolis, IN' },
  { id: '2', name: 'Crystal Wheeler', email: '',                    phone: '',              job: '2722 Station St, Indianapolis, IN' },
  { id: '3', name: 'Hazel Utley',     email: '',                    phone: '',              job: '2745 Station Rd, Avon, IN' },
  { id: '4', name: 'Ira&Kath',        email: 'Ira_kathc@yahoo.com', phone: '(812) 350-7490',job: '5530 Smoketree Ln, Greenwood, IN' },
  { id: '5', name: 'Kelly Moore',     email: '',                    phone: '',              job: '515 Delbrick Ln, Brownsburg, IN' },
  { id: '6', name: 'Paul Dorian',     email: '',                    phone: '',              job: '8701 North Rd, Indianapolis, IN' },
];

const STAGES = [
  { id: 'new_lead',              label: 'New Lead',        color: '#64748b', bg: '#f8fafc',  desc: 'Just came in' },
  { id: 'appointment_scheduled', label: 'Appointment',     color: '#3b82f6', bg: '#eff6ff',  desc: 'Visit scheduled' },
  { id: 'proposal_sent',         label: 'Proposal Sent',   color: '#f59e0b', bg: '#fffbeb',  desc: 'Awaiting response' },
  { id: 'proposal_signed',       label: 'Signed',          color: '#8b5cf6', bg: '#f5f3ff',  desc: 'Ready to start' },
  { id: 'work_in_progress',      label: 'In Progress',     color: '#06b6d4', bg: '#ecfeff',  desc: 'Job underway' },
  { id: 'completed',             label: 'Completed',       color: '#10b981', bg: '#f0fdf4',  desc: 'Job done' },
];

function loadContacts() {
  try { const d = localStorage.getItem(CONTACTS_KEY); return d ? JSON.parse(d) : DEFAULT_CONTACTS; } catch { return DEFAULT_CONTACTS; }
}

function loadPipeline() {
  try { const d = localStorage.getItem(PIPELINE_KEY); return d ? JSON.parse(d) : {}; } catch { return {}; }
}

function savePipeline(data) { localStorage.setItem(PIPELINE_KEY, JSON.stringify(data)); }

export default function Pipeline() {
  const [contacts]       = useState(loadContacts);
  const [pipeline, setPipeline] = useState(loadPipeline);
  const [dragId, setDragId]     = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [search, setSearch]     = useState('');
  const [detailCard, setDetailCard] = useState(null);
  const [moveModal, setMoveModal]   = useState(null);

  // Each contact has a stage — default new_lead
  const getStage = (id) => pipeline[id] || 'new_lead';

  const moveContact = (contactId, stageId) => {
    const updated = { ...pipeline, [contactId]: stageId };
    setPipeline(updated);
    savePipeline(updated);
  };

  const filtered = useMemo(() =>
    contacts.filter(c =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.job || '').toLowerCase().includes(search.toLowerCase())
    ), [contacts, search]);

  const byStage = useMemo(() => {
    const map = {};
    STAGES.forEach(s => { map[s.id] = []; });
    filtered.forEach(c => {
      const s = getStage(c.id);
      if (map[s]) map[s].push(c);
      else map['new_lead'].push(c);
    });
    return map;
  }, [filtered, pipeline]);

  const totalValue = contacts.length;

  // Drag handlers
  const onDragStart = (e, id) => { setDragId(id); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver  = (e, stageId) => { e.preventDefault(); setDragOver(stageId); };
  const onDrop      = (e, stageId) => { e.preventDefault(); if (dragId) moveContact(dragId, stageId); setDragId(null); setDragOver(null); };
  const onDragEnd   = () => { setDragId(null); setDragOver(null); };

  return (
    <div className="pipeline-page">

      {/* Header */}
      <div className="pipeline-header">
        <div>
          <h1 className="pipeline-title">Pipeline</h1>
          <p className="pipeline-sub">Track every lead through your sales stages</p>
        </div>
        <div className="pipeline-header-right">
          <div className="pipeline-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="pipeline-search"
              placeholder="Search leads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="pipeline-total">{totalValue} leads total</span>
        </div>
      </div>

      {/* Stage summary bar */}
      <div className="pipeline-stage-bar">
        {STAGES.map(s => {
          const count = byStage[s.id]?.length || 0;
          return (
            <div key={s.id} className="pipeline-stage-pill" style={{ borderColor: s.color + '40', background: s.bg }}>
              <span className="pipeline-stage-pill-dot" style={{ background: s.color }} />
              <span className="pipeline-stage-pill-label">{s.label}</span>
              <span className="pipeline-stage-pill-count" style={{ color: s.color }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Kanban board */}
      <div className="pipeline-board">
        {STAGES.map(stage => (
          <div
            key={stage.id}
            className={`pipeline-col ${dragOver === stage.id ? 'drag-over' : ''}`}
            onDragOver={e => onDragOver(e, stage.id)}
            onDrop={e => onDrop(e, stage.id)}
          >
            {/* Column header */}
            <div className="pipeline-col-header" style={{ borderTop: `3px solid ${stage.color}` }}>
              <div className="pipeline-col-title-row">
                <span className="pipeline-col-title">{stage.label}</span>
                <span className="pipeline-col-count" style={{ background: stage.color + '18', color: stage.color }}>
                  {byStage[stage.id]?.length || 0}
                </span>
              </div>
              <span className="pipeline-col-desc">{stage.desc}</span>
            </div>

            {/* Cards */}
            <div className="pipeline-col-body">
              {byStage[stage.id]?.length === 0 ? (
                <div className="pipeline-col-empty">
                  <span>Drop here</span>
                </div>
              ) : (
                byStage[stage.id].map(c => (
                  <div
                    key={c.id}
                    className={`pipeline-card ${dragId === c.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={e => onDragStart(e, c.id)}
                    onDragEnd={onDragEnd}
                  >
                    <div className="pipeline-card-top">
                      <div className="pipeline-card-avatar" style={{ background: stage.color + '20', color: stage.color }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="pipeline-card-info">
                        <span className="pipeline-card-name">{c.name}</span>
                        {c.phone && <span className="pipeline-card-phone">{c.phone}</span>}
                      </div>
                      <button
                        className="pipeline-card-menu"
                        onClick={() => setMoveModal(c)}
                        title="Move to stage"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                        </svg>
                      </button>
                    </div>
                    {c.job && (
                      <div className="pipeline-card-addr">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {c.job}
                      </div>
                    )}
                    {c.email && (
                      <div className="pipeline-card-email">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        {c.email}
                      </div>
                    )}
                    <div className="pipeline-card-footer">
                      <span className="pipeline-card-drag-hint">⠿ drag to move</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Move modal */}
      {moveModal && (
        <div className="pipeline-modal-overlay" onClick={() => setMoveModal(null)}>
          <div className="pipeline-modal" onClick={e => e.stopPropagation()}>
            <div className="pipeline-modal-header">
              <div>
                <h3>Move Lead</h3>
                <p>{moveModal.name}</p>
              </div>
              <button className="pipeline-modal-close" onClick={() => setMoveModal(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="pipeline-modal-stages">
              {STAGES.map(s => {
                const isCurrent = getStage(moveModal.id) === s.id;
                return (
                  <button
                    key={s.id}
                    className={`pipeline-modal-stage ${isCurrent ? 'current' : ''}`}
                    style={isCurrent ? { background: s.color + '15', borderColor: s.color } : {}}
                    onClick={() => { moveContact(moveModal.id, s.id); setMoveModal(null); }}
                  >
                    <span className="pipeline-modal-stage-dot" style={{ background: s.color }} />
                    <div>
                      <span className="pipeline-modal-stage-label">{s.label}</span>
                      <span className="pipeline-modal-stage-desc">{s.desc}</span>
                    </div>
                    {isCurrent && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.5" style={{ marginLeft: 'auto' }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
