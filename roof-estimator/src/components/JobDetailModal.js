import React, { useState } from 'react';

const TABS = [
  'Job details', 'Tasks', 'Calendar', 'Measurements', 'Proposals',
  'PDF signer', 'Material orders', 'Work orders', 'Invoices',
  'Job costing', 'Attachments', 'Instant Estimate',
];

const ACTIVITY = [
  { title: 'DIY Report created', date: 'Feb 10 at 3:36 AM', desc: 'DIY Report created by Precision Roofing' },
  { title: 'DIY Report created', date: 'Yesterday at 10:56 PM', desc: 'DIY Report created by Precision Roofing' },
];

const MOCK_TASKS = [
  { text: 'Schedule initial inspection', done: true },
  { text: 'Take roof measurements', done: true },
  { text: 'Create proposal for customer', done: false },
  { text: 'Order materials', done: false },
];

const MOCK_REPORTS = [
  {
    id: 1,
    name: 'DIY Report',
    status: 'completed',
    date: 'Feb 10, 2025',
    totalArea: '2,847',
    predominantPitch: '6/12',
    squares: '28.47',
    sections: 3,
  },
  {
    id: 2,
    name: 'DIY Report #2',
    status: 'in_progress',
    date: 'Feb 9, 2025',
    totalArea: '1,420',
    predominantPitch: '4/12',
    squares: '14.20',
    sections: 2,
  },
];

export default function JobDetailModal({ project, onClose }) {
  const [activeTab, setActiveTab] = useState('Job details');
  const [assignee, setAssignee] = useState('Unassigned');
  const [jobOwner] = useState('Precision Roofing');
  const [workflow] = useState('Default: New lead');
  const [details, setDetails] = useState('');
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [dragOver, setDragOver] = useState(false);

  if (!project) return null;

  const address = project.address || 'No address';

  const toggleTask = (idx) => {
    setTasks(prev => prev.map((t, i) => i === idx ? { ...t, done: !t.done } : t));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks(prev => [...prev, { text: newTask.trim(), done: false }]);
    setNewTask('');
  };

  /* ───── Tab content renderers ───── */

  const renderJobDetails = () => (
    <>
      {/* Info bar */}
      <div className="jdm-info-bar">
        <span className="jdm-info-days">• 9 days</span>
        <span className="jdm-info-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
          0/0
        </span>
        <span className="jdm-info-badge-multi">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
          Multiple
        </span>
        <span className="jdm-info-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          No proposals
        </span>
        <span className="jdm-info-item">Updated 6 hours ago</span>
        <span className="jdm-info-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
          Changes auto-saved
        </span>
      </div>

      {/* Form fields */}
      <div className="jdm-form">
        <div className="jdm-form-row">
          <div className="jdm-field">
            <label className="jdm-label">Assignee(s)</label>
            <select className="jdm-select" value={assignee} onChange={e => setAssignee(e.target.value)}>
              <option>Unassigned</option>
              <option>Precision Roofing</option>
            </select>
          </div>
          <div className="jdm-field">
            <label className="jdm-label">
              Job owner
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </label>
            <select className="jdm-select" defaultValue={jobOwner}>
              <option>Precision Roofing</option>
            </select>
          </div>
          <div className="jdm-field">
            <label className="jdm-label">Workflow &amp; stages</label>
            <select className="jdm-select" defaultValue={workflow}>
              <option>Default: New lead</option>
              <option>Appointment scheduled</option>
              <option>Proposal sent</option>
            </select>
          </div>
        </div>

        <div className="jdm-form-row">
          <div className="jdm-field">
            <label className="jdm-label">
              Close date
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </label>
            <div className="jdm-input-with-icon">
              <input className="jdm-input" type="text" placeholder="Select" readOnly />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
          </div>
          <div className="jdm-field">
            <label className="jdm-label">Job value</label>
            <input className="jdm-input" type="text" placeholder="" />
          </div>
          <div className="jdm-field">
            <label className="jdm-label">Source</label>
            <input className="jdm-input" type="text" placeholder="Start typing to add new or select..." />
          </div>
        </div>

        <div className="jdm-form-row">
          <div className="jdm-field jdm-field-full">
            <label className="jdm-label">Details</label>
            <textarea
              className="jdm-textarea"
              placeholder="Frequently referenced info (gate codes, material selection, parking, etc.)"
              value={details}
              onChange={e => setDetails(e.target.value)}
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Insurance */}
      <div className="jdm-insurance-row">
        <div className="jdm-insurance-left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span className="jdm-insurance-label">Insurance</span>
        </div>
        <div className="jdm-toggle">
          <div className="jdm-toggle-track">
            <div className="jdm-toggle-thumb"></div>
          </div>
        </div>
      </div>
    </>
  );

  const renderTasks = () => (
    <div className="jdm-tasks">
      <div className="jdm-tasks-header">
        <h3 className="jdm-section-title">Tasks</h3>
        <span className="jdm-tasks-count">{tasks.filter(t => t.done).length}/{tasks.length} completed</span>
      </div>

      <div className="jdm-task-input-row">
        <input
          className="jdm-task-input"
          type="text"
          placeholder="Add a new task..."
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
        />
        <button className="jdm-task-add-btn" onClick={addTask}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      <div className="jdm-task-list">
        {tasks.map((task, i) => (
          <div key={i} className={`jdm-task-item ${task.done ? 'done' : ''}`} onClick={() => toggleTask(i)}>
            <div className={`jdm-task-check ${task.done ? 'checked' : ''}`}>
              {task.done && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              )}
            </div>
            <span className="jdm-task-text">{task.text}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCalendar = () => {
    const today = new Date();
    const month = today.toLocaleString('default', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="jdm-calendar">
        <div className="jdm-calendar-header">
          <h3 className="jdm-section-title">Schedule</h3>
          <button className="jdm-cal-add-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add event
          </button>
        </div>

        <div className="jdm-cal-month-header">
          <button className="jdm-cal-nav-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="jdm-cal-month">{month}</span>
          <button className="jdm-cal-nav-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div className="jdm-cal-grid">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="jdm-cal-day-label">{d}</div>
          ))}
          {days.map((day, i) => (
            <div
              key={i}
              className={`jdm-cal-day ${day === today.getDate() ? 'today' : ''} ${day ? '' : 'empty'}`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="jdm-cal-events">
          <div className="jdm-cal-no-events">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>No events scheduled</span>
          </div>
        </div>
      </div>
    );
  };

  const renderMeasurements = () => (
    <div className="jdm-measurements">
      <div className="jdm-meas-header">
        <h3 className="jdm-section-title">Measurement Reports</h3>
        <button className="jdm-meas-new-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New report
        </button>
      </div>

      <div className="jdm-report-cards">
        {MOCK_REPORTS.map(r => (
          <div key={r.id} className="jdm-report-card">
            <div className="jdm-report-card-header">
              <div className="jdm-report-card-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <span className="jdm-report-card-name">{r.name}</span>
              </div>
              <span className={`jdm-report-status ${r.status === 'completed' ? 'completed' : 'progress'}`}>
                {r.status === 'completed' ? 'Completed' : 'In progress'}
              </span>
            </div>

            <div className="jdm-report-card-date">{r.date}</div>

            <div className="jdm-report-stats">
              <div className="jdm-report-stat">
                <span className="jdm-report-stat-label">Total area</span>
                <span className="jdm-report-stat-value">{r.totalArea} sq ft</span>
              </div>
              <div className="jdm-report-stat">
                <span className="jdm-report-stat-label">Predominant pitch</span>
                <span className="jdm-report-stat-value">{r.predominantPitch}</span>
              </div>
              <div className="jdm-report-stat">
                <span className="jdm-report-stat-label">Squares</span>
                <span className="jdm-report-stat-value">{r.squares}</span>
              </div>
              <div className="jdm-report-stat">
                <span className="jdm-report-stat-label">Sections</span>
                <span className="jdm-report-stat-value">{r.sections}</span>
              </div>
            </div>

            <div className="jdm-report-card-actions">
              <button className="jdm-report-view-btn">View report</button>
              <button className="jdm-report-dots-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProposals = () => (
    <div className="jdm-proposals">
      <div className="jdm-proposals-header">
        <h3 className="jdm-section-title">Proposals</h3>
        <button className="jdm-proposals-create-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create proposal
        </button>
      </div>

      <div className="jdm-empty-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
        <h4 className="jdm-empty-title">No proposals yet</h4>
        <p className="jdm-empty-desc">Create a proposal to send to your customer for review and approval.</p>
        <button className="jdm-empty-action-btn">Create proposal</button>
      </div>
    </div>
  );

  const renderPdfSigner = () => (
    <div className="jdm-pdf-signer">
      <div className="jdm-pdf-header">
        <h3 className="jdm-section-title">PDF Signer</h3>
        <button className="jdm-pdf-upload-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload document
        </button>
      </div>

      <div className="jdm-empty-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          <path d="M9 15l2 2 4-4" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h4 className="jdm-empty-title">No documents to sign</h4>
        <p className="jdm-empty-desc">Upload a PDF document to get it signed electronically.</p>
        <button className="jdm-empty-action-btn">Upload document</button>
      </div>
    </div>
  );

  const renderMaterialOrders = () => (
    <div className="jdm-material-orders">
      <div className="jdm-matord-header">
        <h3 className="jdm-section-title">Material Orders</h3>
        <button className="jdm-matord-new-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New order
        </button>
      </div>

      <div className="jdm-empty-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
        <h4 className="jdm-empty-title">No material orders</h4>
        <p className="jdm-empty-desc">Create a material order to track supplies needed for this job.</p>
        <button className="jdm-empty-action-btn">Create order</button>
      </div>
    </div>
  );

  const renderWorkOrders = () => (
    <div className="jdm-work-orders">
      <div className="jdm-workord-header">
        <h3 className="jdm-section-title">Work Orders</h3>
        <button className="jdm-workord-new-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New work order
        </button>
      </div>

      <div className="jdm-empty-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/>
        </svg>
        <h4 className="jdm-empty-title">No work orders</h4>
        <p className="jdm-empty-desc">Create work orders to assign and track tasks for your crew.</p>
        <button className="jdm-empty-action-btn">Create work order</button>
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div className="jdm-invoices-tab">
      <div className="jdm-inv-header">
        <h3 className="jdm-section-title">Invoices</h3>
        <button className="jdm-inv-new-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create invoice
        </button>
      </div>

      <div className="jdm-empty-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
          <rect x="2" y="3" width="20" height="18" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="10" y1="14" x2="14" y2="14"/>
        </svg>
        <h4 className="jdm-empty-title">No invoices</h4>
        <p className="jdm-empty-desc">Create an invoice to bill your customer for this job.</p>
        <button className="jdm-empty-action-btn">Create invoice</button>
      </div>
    </div>
  );

  const renderJobCosting = () => (
    <div className="jdm-job-costing">
      <div className="jdm-costing-header">
        <h3 className="jdm-section-title">Job Costing</h3>
      </div>

      <div className="jdm-costing-summary">
        <div className="jdm-costing-card">
          <span className="jdm-costing-card-label">Revenue</span>
          <span className="jdm-costing-card-value">$0.00</span>
        </div>
        <div className="jdm-costing-card">
          <span className="jdm-costing-card-label">Cost</span>
          <span className="jdm-costing-card-value">$0.00</span>
        </div>
        <div className="jdm-costing-card">
          <span className="jdm-costing-card-label">Profit</span>
          <span className="jdm-costing-card-value">$0.00</span>
        </div>
        <div className="jdm-costing-card">
          <span className="jdm-costing-card-label">Margin</span>
          <span className="jdm-costing-card-value">0%</span>
        </div>
      </div>

      <div className="jdm-costing-table-wrap">
        <table className="jdm-costing-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Projected</th>
              <th>Actual</th>
              <th>Variance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Materials</td>
              <td>$0.00</td>
              <td>$0.00</td>
              <td className="jdm-costing-neutral">$0.00</td>
            </tr>
            <tr>
              <td>Labor</td>
              <td>$0.00</td>
              <td>$0.00</td>
              <td className="jdm-costing-neutral">$0.00</td>
            </tr>
            <tr>
              <td>Overhead</td>
              <td>$0.00</td>
              <td>$0.00</td>
              <td className="jdm-costing-neutral">$0.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="jdm-costing-hint">Add proposals and invoices to track projected vs. actual costs.</p>
    </div>
  );

  const renderAttachments = () => (
    <div className="jdm-attachments">
      <div className="jdm-attach-header">
        <h3 className="jdm-section-title">Attachments</h3>
      </div>

      <div
        className={`jdm-attach-dropzone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p className="jdm-attach-drop-text">Drag and drop files here</p>
        <p className="jdm-attach-drop-or">or</p>
        <button className="jdm-attach-browse-btn">Browse files</button>
        <p className="jdm-attach-drop-hint">Supported: PDF, JPG, PNG, DOC, XLS (max 25 MB)</p>
      </div>

      <div className="jdm-attach-empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
        </svg>
        <span>No files attached yet</span>
      </div>
    </div>
  );

  const renderInstantEstimate = () => (
    <div className="jdm-instant-estimate">
      <div className="jdm-ie-header">
        <h3 className="jdm-section-title">Instant Estimate</h3>
      </div>

      {/* Mini map placeholder */}
      <div className="jdm-ie-map">
        <svg width="100%" height="200" viewBox="0 0 500 200" preserveAspectRatio="xMidYMid slice">
          <rect width="500" height="200" fill="#e8f0fe"/>
          <rect x="140" y="50" width="220" height="100" rx="4" fill="#c9daf8" stroke="#7baaf7" strokeWidth="1.5"/>
          <path d="M160 110 L200 70 L250 100 L280 80 L340 120" fill="none" stroke="#4285f4" strokeWidth="2"/>
          <circle cx="250" cy="100" r="6" fill="#ea4335" stroke="#fff" strokeWidth="2"/>
          <text x="250" y="140" textAnchor="middle" fill="#5f6368" fontSize="11" fontFamily="sans-serif">{address}</text>
        </svg>
      </div>

      {/* Property details */}
      <div className="jdm-ie-details">
        <h4 className="jdm-ie-details-title">Property Details</h4>
        <div className="jdm-ie-grid">
          <div className="jdm-ie-detail-item">
            <span className="jdm-ie-detail-label">Footprint</span>
            <span className="jdm-ie-detail-value">1,420 sq ft</span>
          </div>
          <div className="jdm-ie-detail-item">
            <span className="jdm-ie-detail-label">Predominant pitch</span>
            <span className="jdm-ie-detail-value">6/12</span>
          </div>
          <div className="jdm-ie-detail-item">
            <span className="jdm-ie-detail-label">Total roof area</span>
            <span className="jdm-ie-detail-value">2,847 sq ft</span>
          </div>
          <div className="jdm-ie-detail-item">
            <span className="jdm-ie-detail-label">Property type</span>
            <span className="jdm-ie-detail-value">Residential</span>
          </div>
          <div className="jdm-ie-detail-item">
            <span className="jdm-ie-detail-label">Squares</span>
            <span className="jdm-ie-detail-value">28.47</span>
          </div>
          <div className="jdm-ie-detail-item">
            <span className="jdm-ie-detail-label">Stories</span>
            <span className="jdm-ie-detail-value">1</span>
          </div>
        </div>
      </div>

      {/* Estimate */}
      <div className="jdm-ie-estimate">
        <h4 className="jdm-ie-details-title">Estimate Range</h4>
        <div className="jdm-ie-range">
          <div className="jdm-ie-range-item">
            <span className="jdm-ie-range-label">Low</span>
            <span className="jdm-ie-range-value">$8,541</span>
          </div>
          <div className="jdm-ie-range-bar">
            <div className="jdm-ie-range-fill"></div>
          </div>
          <div className="jdm-ie-range-item">
            <span className="jdm-ie-range-label">High</span>
            <span className="jdm-ie-range-value">$14,235</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Job details': return renderJobDetails();
      case 'Tasks': return renderTasks();
      case 'Calendar': return renderCalendar();
      case 'Measurements': return renderMeasurements();
      case 'Proposals': return renderProposals();
      case 'PDF signer': return renderPdfSigner();
      case 'Material orders': return renderMaterialOrders();
      case 'Work orders': return renderWorkOrders();
      case 'Invoices': return renderInvoices();
      case 'Job costing': return renderJobCosting();
      case 'Attachments': return renderAttachments();
      case 'Instant Estimate': return renderInstantEstimate();
      default: return renderJobDetails();
    }
  };

  return (
    <div className="jdm-overlay" onClick={onClose}>
      <div className="jdm-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="jdm-header">
          <div className="jdm-header-left">
            <h2 className="jdm-address">{address}</h2>
            <button className="jdm-dots-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
          </div>
          <div className="jdm-header-right">
            <button className="jdm-new-btn">
              New
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button className="jdm-close-btn" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Add tag */}
        <div className="jdm-tag-row">
          <button className="jdm-tag-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
            Add tag
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="jdm-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`jdm-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="jdm-body">
          {/* Left content — switches based on active tab */}
          <div className="jdm-content">
            {renderTabContent()}
          </div>

          {/* Right sidebar — always visible */}
          <div className="jdm-sidebar">
            {/* Contact */}
            <div className="jdm-contact-input">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              <input type="text" placeholder="Add contact to job..." className="jdm-contact-field" />
            </div>

            {/* Activity log */}
            <div className="jdm-activity-header">
              <span className="jdm-activity-title">Activity log</span>
              <button className="jdm-filter-link">Filter</button>
            </div>

            <div className="jdm-activity-list">
              <div className="jdm-activity-item jdm-activity-created">
                <div className="jdm-activity-icon-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <span className="jdm-activity-text">Job created by Precision Roofing</span>
              </div>

              {ACTIVITY.map((a, i) => (
                <div key={i} className="jdm-activity-item">
                  <div className="jdm-activity-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="11" fill="#2563eb"/>
                      <path d="M8 12 L11 8 L16 14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="jdm-activity-content">
                    <div className="jdm-activity-row">
                      <strong>{a.title}</strong>
                      <span className="jdm-activity-date">{a.date}</span>
                    </div>
                    <p className="jdm-activity-desc">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom action tabs */}
            <div className="jdm-bottom-tabs">
              <button className="jdm-bottom-tab">Note</button>
              <button className="jdm-bottom-tab">Inbox</button>
              <button className="jdm-bottom-tab">Compose</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
