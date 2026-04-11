import { useState } from 'react';

const WORKFLOWS_KEY = 'precision-workflows';

const DEFAULT_WORKFLOWS = [
  {
    id: '1', name: 'New Lead Follow-Up', active: true,
    trigger: 'New contact added',
    steps: [
      { id: 's1', type: 'wait',    label: 'Wait 1 day' },
      { id: 's2', type: 'notify',  label: 'Send follow-up reminder' },
      { id: 's3', type: 'wait',    label: 'Wait 3 days' },
      { id: 's4', type: 'notify',  label: 'Send proposal reminder' },
    ],
  },
  {
    id: '2', name: 'Proposal Sent Reminder', active: true,
    trigger: 'Proposal moved to "Proposal Sent"',
    steps: [
      { id: 's1', type: 'wait',    label: 'Wait 2 days' },
      { id: 's2', type: 'notify',  label: 'Send follow-up email' },
      { id: 's3', type: 'wait',    label: 'Wait 5 days' },
      { id: 's4', type: 'notify',  label: 'Call customer reminder' },
    ],
  },
  {
    id: '3', name: 'Job Completion', active: false,
    trigger: 'Lead moved to "Completed"',
    steps: [
      { id: 's1', type: 'action',  label: 'Send invoice automatically' },
      { id: 's2', type: 'wait',    label: 'Wait 1 day' },
      { id: 's3', type: 'notify',  label: 'Request customer review' },
    ],
  },
];

const STEP_TYPES = [
  { id: 'notify', label: 'Send Notification', color: '#3b82f6', icon: 'bell' },
  { id: 'wait',   label: 'Wait',              color: '#f59e0b', icon: 'clock' },
  { id: 'action', label: 'Action',            color: '#10b981', icon: 'zap' },
];

const TRIGGERS = [
  'New contact added',
  'Lead moved to "Appointment"',
  'Proposal moved to "Proposal Sent"',
  'Lead moved to "Signed"',
  'Lead moved to "In Progress"',
  'Lead moved to "Completed"',
  'Invoice sent',
];

function load() {
  try { const d = localStorage.getItem(WORKFLOWS_KEY); return d ? JSON.parse(d) : DEFAULT_WORKFLOWS; } catch { return DEFAULT_WORKFLOWS; }
}
function save(data) { localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(data)); }

export default function Workflow() {
  const [workflows, setWorkflows] = useState(load);
  const [selected, setSelected] = useState(workflows[0]?.id || null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const current = workflows.find(w => w.id === selected);

  const toggleActive = (id) => {
    const updated = workflows.map(w => w.id === id ? { ...w, active: !w.active } : w);
    setWorkflows(updated); save(updated);
  };

  const deleteWorkflow = (id) => {
    const updated = workflows.filter(w => w.id !== id);
    setWorkflows(updated); save(updated);
    setSelected(updated[0]?.id || null);
    setDeleteConfirm(null);
  };

  const openNew = () => {
    setForm({ name: '', trigger: TRIGGERS[0], steps: [], active: true });
    setModal('new');
  };

  const saveWorkflow = () => {
    if (!form.name.trim()) return;
    const updated = modal === 'new'
      ? [...workflows, { ...form, id: Date.now().toString() }]
      : workflows.map(w => w.id === modal ? { ...w, ...form } : w);
    setWorkflows(updated); save(updated);
    if (modal === 'new') setSelected(updated[updated.length - 1].id);
    setModal(null); setForm(null);
  };

  const addStep = (workflowId, type) => {
    const label = STEP_TYPES.find(t => t.id === type)?.label || 'Step';
    const updated = workflows.map(w => w.id === workflowId
      ? { ...w, steps: [...w.steps, { id: Date.now().toString(), type, label }] }
      : w
    );
    setWorkflows(updated); save(updated);
  };

  const removeStep = (workflowId, stepId) => {
    const updated = workflows.map(w => w.id === workflowId
      ? { ...w, steps: w.steps.filter(s => s.id !== stepId) }
      : w
    );
    setWorkflows(updated); save(updated);
  };

  const stepInfo = (type) => STEP_TYPES.find(t => t.id === type) || STEP_TYPES[0];

  return (
    <div className="wf-page">

      {/* Left panel — workflow list */}
      <div className="wf-sidebar">
        <div className="wf-sidebar-header">
          <h2 className="wf-sidebar-title">Workflows</h2>
          <button className="wf-add-btn" onClick={openNew}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New
          </button>
        </div>

        <div className="wf-list">
          {workflows.length === 0 ? (
            <div className="wf-list-empty">No workflows yet</div>
          ) : workflows.map(w => (
            <div
              key={w.id}
              className={`wf-list-item ${selected === w.id ? 'active' : ''}`}
              onClick={() => setSelected(w.id)}
            >
              <div className="wf-list-item-top">
                <span className="wf-list-item-name">{w.name}</span>
                <div className={`wf-toggle ${w.active ? 'on' : ''}`} onClick={e => { e.stopPropagation(); toggleActive(w.id); }}>
                  <div className="wf-toggle-thumb" />
                </div>
              </div>
              <span className="wf-list-item-trigger">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                {w.trigger}
              </span>
              <span className="wf-list-item-steps">{w.steps.length} steps</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — workflow detail */}
      <div className="wf-detail">
        {!current ? (
          <div className="wf-empty">
            <div className="wf-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </div>
            <p>Select a workflow or create a new one</p>
            <button className="wf-add-btn" onClick={openNew}>Create Workflow</button>
          </div>
        ) : (
          <>
            {/* Detail header */}
            <div className="wf-detail-header">
              <div>
                <h1 className="wf-detail-title">{current.name}</h1>
                <div className="wf-detail-trigger">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  Trigger: <strong>{current.trigger}</strong>
                </div>
              </div>
              <div className="wf-detail-actions">
                <span className={`wf-status-badge ${current.active ? 'active' : 'inactive'}`}>
                  <span className="wf-status-dot" />
                  {current.active ? 'Active' : 'Inactive'}
                </span>
                <button className="wf-btn-outline" onClick={() => { setForm({ ...current }); setModal(current.id); }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                <button className="wf-btn-danger" onClick={() => setDeleteConfirm(current)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>

            {/* Steps flow */}
            <div className="wf-flow">
              {/* Trigger node */}
              <div className="wf-node wf-node-trigger">
                <div className="wf-node-icon" style={{ background: '#fff7ed', color: '#f59e0b' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <div className="wf-node-body">
                  <span className="wf-node-type">Trigger</span>
                  <span className="wf-node-label">{current.trigger}</span>
                </div>
              </div>

              {current.steps.map((step, idx) => {
                const info = stepInfo(step.type);
                return (
                  <div key={step.id} className="wf-step-wrap">
                    <div className="wf-step-connector">
                      <div className="wf-step-line" />
                      <div className="wf-step-arrow">↓</div>
                    </div>
                    <div className="wf-node">
                      <div className="wf-node-num">{idx + 1}</div>
                      <div className="wf-node-icon" style={{ background: info.color + '18', color: info.color }}>
                        <StepIcon type={step.type} />
                      </div>
                      <div className="wf-node-body">
                        <span className="wf-node-type" style={{ color: info.color }}>{info.label}</span>
                        <input
                          className="wf-node-input"
                          value={step.label}
                          onChange={e => {
                            const updated = workflows.map(w => w.id === current.id
                              ? { ...w, steps: w.steps.map(s => s.id === step.id ? { ...s, label: e.target.value } : s) }
                              : w
                            );
                            setWorkflows(updated); save(updated);
                          }}
                        />
                      </div>
                      <button className="wf-node-del" onClick={() => removeStep(current.id, step.id)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add step */}
              <div className="wf-step-connector">
                <div className="wf-step-line" />
              </div>
              <div className="wf-add-step">
                <span className="wf-add-step-label">Add Step</span>
                <div className="wf-add-step-btns">
                  {STEP_TYPES.map(t => (
                    <button
                      key={t.id}
                      className="wf-add-step-btn"
                      style={{ borderColor: t.color + '40', color: t.color, background: t.color + '0d' }}
                      onClick={() => addStep(current.id, t.id)}
                    >
                      <StepIcon type={t.id} size={13} color={t.color} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* New / Edit modal */}
      {modal && form && (
        <div className="wf-modal-overlay" onClick={() => { setModal(null); setForm(null); }}>
          <div className="wf-modal" onClick={e => e.stopPropagation()}>
            <div className="wf-modal-header">
              <h2>{modal === 'new' ? 'New Workflow' : 'Edit Workflow'}</h2>
              <button className="wf-modal-close" onClick={() => { setModal(null); setForm(null); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="wf-modal-body">
              <div className="wf-form-field">
                <label className="wf-form-label">Workflow Name *</label>
                <input className="wf-input" placeholder="e.g. New Lead Follow-Up" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="wf-form-field">
                <label className="wf-form-label">Trigger</label>
                <select className="wf-input" value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}>
                  {TRIGGERS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="wf-modal-footer">
              <button className="wf-modal-cancel" onClick={() => { setModal(null); setForm(null); }}>Cancel</button>
              <button className="wf-modal-save" onClick={saveWorkflow} disabled={!form.name.trim()}>
                {modal === 'new' ? 'Create Workflow' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="wf-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="wf-modal wf-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="wf-modal-header">
              <h2>Delete Workflow</h2>
              <button className="wf-modal-close" onClick={() => setDeleteConfirm(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="wf-modal-body">
              <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                Delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.
              </p>
            </div>
            <div className="wf-modal-footer">
              <button className="wf-modal-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="wf-btn-danger" onClick={() => deleteWorkflow(deleteConfirm.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepIcon({ type, size = 15, color = 'currentColor' }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2 };
  if (type === 'notify') return <svg {...s}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
  if (type === 'wait')   return <svg {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  return <svg {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
