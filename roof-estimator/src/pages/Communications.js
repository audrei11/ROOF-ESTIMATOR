import { useState } from 'react';

const ACTIVITY_KEY = 'precision-activities';
const TEMPLATES_KEY = 'precision-templates';

const DEFAULT_ACTIVITIES = [
  { id: '1', type: 'call',     contact: 'Kelly Moore',     note: 'Called — interested in full roof replacement. Follow up this week.', date: '2026-04-10T09:30:00' },
  { id: '2', type: 'proposal', contact: 'Biak Lian',       note: 'Sent proposal for $8,400 shingle replacement. Awaiting signature.', date: '2026-04-09T14:00:00' },
  { id: '3', type: 'visit',    contact: 'Hazel Utley',     note: 'Site visit done. Measured 2,200 sq ft. Damage on north face.', date: '2026-04-08T11:00:00' },
  { id: '4', type: 'text',     contact: 'Ira&Kath',        note: 'Texted payment reminder for Invoice #004. No reply yet.', date: '2026-04-07T16:45:00' },
  { id: '5', type: 'complete', contact: 'Paul Dorian',     note: 'Job completed. Invoice sent. Customer very satisfied.', date: '2026-04-06T17:00:00' },
];

const DEFAULT_TEMPLATES = [
  {
    id: '1', category: 'Proposal',
    title: 'Proposal Follow-Up',
    body: `Hi [Name],\n\nI just wanted to follow up on the proposal I sent over. Please let me know if you have any questions or if you'd like to discuss anything further.\n\nLooking forward to hearing from you!\n\nBest,\nPrecision Roofing`,
  },
  {
    id: '2', category: 'Job',
    title: 'Job Completion',
    body: `Hi [Name],\n\nWe're happy to let you know that your roofing project has been completed!\n\nThank you for trusting Precision Roofing. Please don't hesitate to reach out if you notice anything that needs attention.\n\nBest regards,\nPrecision Roofing`,
  },
  {
    id: '3', category: 'Payment',
    title: 'Payment Reminder',
    body: `Hi [Name],\n\nThis is a friendly reminder that Invoice #[Invoice No.] for $[Amount] is due on [Date].\n\nPlease let us know if you have any questions.\n\nThank you,\nPrecision Roofing`,
  },
  {
    id: '4', category: 'Follow-Up',
    title: 'Lead Follow-Up',
    body: `Hi [Name],\n\nThank you for reaching out to Precision Roofing! I'd love to schedule a free inspection and provide you with a detailed estimate.\n\nWhen would be a good time for a quick call or site visit?\n\nBest,\nPrecision Roofing`,
  },
  {
    id: '5', category: 'Appointment',
    title: 'Appointment Confirmation',
    body: `Hi [Name],\n\nThis is a confirmation for your roofing inspection scheduled on [Date] at [Time].\n\nOur team will arrive at [Address]. Please feel free to reach out if you need to reschedule.\n\nSee you then!\nPrecision Roofing`,
  },
];

const ACTIVITY_TYPES = [
  { id: 'call',     label: 'Call',     color: '#3b82f6', bg: '#eff6ff' },
  { id: 'text',     label: 'Text',     color: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'email',    label: 'Email',    color: '#f59e0b', bg: '#fffbeb' },
  { id: 'visit',    label: 'Visit',    color: '#10b981', bg: '#f0fdf4' },
  { id: 'proposal', label: 'Proposal', color: '#6366f1', bg: '#eef2ff' },
  { id: 'complete', label: 'Completed',color: '#059669', bg: '#ecfdf5' },
  { id: 'note',     label: 'Note',     color: '#64748b', bg: '#f8fafc' },
];

const TABS = ['Activity Feed', 'Message Templates'];

function load(key, def) {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : def; } catch { return def; }
}
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const EMPTY_ACTIVITY = { type: 'call', contact: '', note: '' };

export default function Communications() {
  const [tab, setTab] = useState('Activity Feed');
  const [activities, setActivities] = useState(() => load(ACTIVITY_KEY, DEFAULT_ACTIVITIES));
  const [templates, setTemplates] = useState(() => load(TEMPLATES_KEY, DEFAULT_TEMPLATES));
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [activityForm, setActivityForm] = useState(EMPTY_ACTIVITY);
  const [copiedId, setCopiedId] = useState(null);
  const [editTemplate, setEditTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState(null);

  const filteredActivities = activities
    .filter(a => filterType === 'all' || a.type === filterType)
    .filter(a => !search || a.contact.toLowerCase().includes(search.toLowerCase()) || a.note.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const addActivity = () => {
    if (!activityForm.contact.trim() || !activityForm.note.trim()) return;
    const updated = [{ ...activityForm, id: Date.now().toString(), date: new Date().toISOString() }, ...activities];
    setActivities(updated);
    save(ACTIVITY_KEY, updated);
    setShowAddActivity(false);
    setActivityForm(EMPTY_ACTIVITY);
  };

  const deleteActivity = (id) => {
    const updated = activities.filter(a => a.id !== id);
    setActivities(updated);
    save(ACTIVITY_KEY, updated);
  };

  const copyTemplate = (t) => {
    navigator.clipboard.writeText(t.body);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveTemplate = () => {
    if (!templateForm.title.trim() || !templateForm.body.trim()) return;
    let updated;
    if (editTemplate === 'new') {
      updated = [...templates, { ...templateForm, id: Date.now().toString() }];
    } else {
      updated = templates.map(t => t.id === editTemplate ? { ...t, ...templateForm } : t);
    }
    setTemplates(updated);
    save(TEMPLATES_KEY, updated);
    setEditTemplate(null);
    setTemplateForm(null);
  };

  const deleteTemplate = (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    save(TEMPLATES_KEY, updated);
  };

  const typeInfo = (type) => ACTIVITY_TYPES.find(t => t.id === type) || ACTIVITY_TYPES[6];

  return (
    <div className="comms-page">

      {/* Header */}
      <div className="comms-header">
        <div>
          <h1 className="comms-title">Communications</h1>
          <p className="comms-subtitle">Track interactions and manage message templates</p>
        </div>
        {tab === 'Activity Feed' && (
          <button className="comms-add-btn" onClick={() => setShowAddActivity(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Log Activity
          </button>
        )}
        {tab === 'Message Templates' && (
          <button className="comms-add-btn" onClick={() => { setEditTemplate('new'); setTemplateForm({ title: '', category: 'General', body: '' }); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Template
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="comms-tabs">
        {TABS.map(t => (
          <button key={t} className={`comms-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'Activity Feed' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            )}
            {t}
            {t === 'Activity Feed' && <span className="comms-tab-count">{activities.length}</span>}
            {t === 'Message Templates' && <span className="comms-tab-count">{templates.length}</span>}
          </button>
        ))}
      </div>

      {/* ── Activity Feed ── */}
      {tab === 'Activity Feed' && (
        <div className="comms-feed">
          {/* Filters */}
          <div className="comms-feed-toolbar">
            <div className="comms-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="comms-search" placeholder="Search activities..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="comms-type-filters">
              <button className={`comms-type-chip ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>All</button>
              {ACTIVITY_TYPES.map(t => (
                <button
                  key={t.id}
                  className={`comms-type-chip ${filterType === t.id ? 'active' : ''}`}
                  style={filterType === t.id ? { background: t.bg, color: t.color, borderColor: t.color + '40' } : {}}
                  onClick={() => setFilterType(filterType === t.id ? 'all' : t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="comms-timeline">
            {filteredActivities.length === 0 ? (
              <div className="comms-empty">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                <p>No activities yet</p>
                <button className="comms-add-btn" onClick={() => setShowAddActivity(true)}>Log your first activity</button>
              </div>
            ) : filteredActivities.map(a => {
              const t = typeInfo(a.type);
              return (
                <div key={a.id} className="comms-activity-item">
                  <div className="comms-activity-dot-wrap">
                    <div className="comms-activity-dot" style={{ background: t.color }}>
                      <ActivityIcon type={a.type} />
                    </div>
                    <div className="comms-activity-line" />
                  </div>
                  <div className="comms-activity-body">
                    <div className="comms-activity-top">
                      <span className="comms-activity-badge" style={{ background: t.bg, color: t.color }}>{t.label}</span>
                      <span className="comms-activity-contact">{a.contact}</span>
                      <span className="comms-activity-time">{timeAgo(a.date)}</span>
                      <button className="comms-activity-del" onClick={() => deleteActivity(a.id)} title="Delete">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        </svg>
                      </button>
                    </div>
                    <p className="comms-activity-note">{a.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Message Templates ── */}
      {tab === 'Message Templates' && (
        <div className="comms-templates">
          {templates.map(t => (
            <div key={t.id} className="comms-template-card">
              <div className="comms-template-header">
                <div>
                  <span className="comms-template-category">{t.category}</span>
                  <h3 className="comms-template-title">{t.title}</h3>
                </div>
                <div className="comms-template-actions">
                  <button
                    className={`comms-copy-btn ${copiedId === t.id ? 'copied' : ''}`}
                    onClick={() => copyTemplate(t)}
                  >
                    {copiedId === t.id ? (
                      <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
                    ) : (
                      <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</>
                    )}
                  </button>
                  <button className="comms-template-edit-btn" onClick={() => { setEditTemplate(t.id); setTemplateForm({ ...t }); }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button className="comms-template-del-btn" onClick={() => deleteTemplate(t.id)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                  </button>
                </div>
              </div>
              <pre className="comms-template-body">{t.body}</pre>
            </div>
          ))}
        </div>
      )}

      {/* ── Log Activity Modal ── */}
      {showAddActivity && (
        <div className="comms-modal-overlay" onClick={() => setShowAddActivity(false)}>
          <div className="comms-modal" onClick={e => e.stopPropagation()}>
            <div className="comms-modal-header">
              <h2>Log Activity</h2>
              <button className="comms-modal-close" onClick={() => setShowAddActivity(false)}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="comms-modal-body">
              <div className="comms-form-field">
                <label className="comms-form-label">Activity Type</label>
                <div className="comms-type-selector">
                  {ACTIVITY_TYPES.map(t => (
                    <button
                      key={t.id}
                      className={`comms-type-option ${activityForm.type === t.id ? 'selected' : ''}`}
                      style={activityForm.type === t.id ? { background: t.bg, color: t.color, borderColor: t.color } : {}}
                      onClick={() => setActivityForm(f => ({ ...f, type: t.id }))}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="comms-form-field">
                <label className="comms-form-label">Contact / Customer *</label>
                <input
                  className="comms-input" placeholder="e.g. Kelly Moore"
                  value={activityForm.contact}
                  onChange={e => setActivityForm(f => ({ ...f, contact: e.target.value }))}
                />
              </div>
              <div className="comms-form-field">
                <label className="comms-form-label">Notes *</label>
                <textarea
                  className="comms-input comms-textarea"
                  placeholder="What happened? Any follow-up needed?"
                  rows={4}
                  value={activityForm.note}
                  onChange={e => setActivityForm(f => ({ ...f, note: e.target.value }))}
                />
              </div>
            </div>
            <div className="comms-modal-footer">
              <button className="comms-modal-cancel" onClick={() => setShowAddActivity(false)}>Cancel</button>
              <button
                className="comms-modal-save"
                onClick={addActivity}
                disabled={!activityForm.contact.trim() || !activityForm.note.trim()}
              >
                Log Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Template Modal ── */}
      {editTemplate && templateForm && (
        <div className="comms-modal-overlay" onClick={() => { setEditTemplate(null); setTemplateForm(null); }}>
          <div className="comms-modal comms-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="comms-modal-header">
              <h2>{editTemplate === 'new' ? 'New Template' : 'Edit Template'}</h2>
              <button className="comms-modal-close" onClick={() => { setEditTemplate(null); setTemplateForm(null); }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="comms-modal-body">
              <div className="comms-form-row">
                <div className="comms-form-field">
                  <label className="comms-form-label">Title *</label>
                  <input className="comms-input" placeholder="Template name" value={templateForm.title} onChange={e => setTemplateForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="comms-form-field">
                  <label className="comms-form-label">Category</label>
                  <input className="comms-input" placeholder="e.g. Proposal, Payment..." value={templateForm.category} onChange={e => setTemplateForm(f => ({ ...f, category: e.target.value }))} />
                </div>
              </div>
              <div className="comms-form-field">
                <label className="comms-form-label">Message Body *</label>
                <textarea className="comms-input comms-textarea" rows={8} placeholder="Write your template... Use [Name], [Date], [Amount] as placeholders." value={templateForm.body} onChange={e => setTemplateForm(f => ({ ...f, body: e.target.value }))} />
              </div>
            </div>
            <div className="comms-modal-footer">
              <button className="comms-modal-cancel" onClick={() => { setEditTemplate(null); setTemplateForm(null); }}>Cancel</button>
              <button className="comms-modal-save" onClick={saveTemplate} disabled={!templateForm.title.trim() || !templateForm.body.trim()}>
                {editTemplate === 'new' ? 'Create Template' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityIcon({ type }) {
  const s = { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: '#fff', strokeWidth: 2.5 };
  const icons = {
    call:     <svg {...s}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.08 6.08l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>,
    text:     <svg {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    email:    <svg {...s}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    visit:    <svg {...s}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    proposal: <svg {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    complete: <svg {...s}><polyline points="20 6 9 17 4 12"/></svg>,
    note:     <svg {...s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  };
  return icons[type] || icons['note'];
}
