import { useState } from 'react';

const KEY_EMP = 'ahjin-employees';
const KEY_ASSIGN = 'ahjin-assignments';

const DEFAULT_EMPLOYEES = [
  { id: 'e1', name: 'Juan dela Cruz',   role: 'Installer',   status: 'available', avatar: 'J' },
  { id: 'e2', name: 'Pedro Santos',     role: 'Supervisor',  status: 'available', avatar: 'P' },
  { id: 'e3', name: 'Maria Reyes',      role: 'Installer',   status: 'busy',      avatar: 'M' },
  { id: 'e4', name: 'Jose Garcia',      role: 'Helper',      status: 'available', avatar: 'J' },
];

const DEFAULT_ASSIGNMENTS = [
  { id: 'a1', project: 'Smith Residence',    address: '123 Maple St',    employees: ['e2', 'e3'], date: '2026-04-12', status: 'In Progress' },
  { id: 'a2', project: 'Johnson Roofing',    address: '456 Oak Ave',     employees: ['e1'],       date: '2026-04-14', status: 'Scheduled' },
];

const ROLES   = ['Installer', 'Supervisor', 'Helper', 'Inspector', 'Estimator'];
const STATUSES = ['available', 'busy', 'off'];

function loadEmp()    { try { const d = localStorage.getItem(KEY_EMP);    return d ? JSON.parse(d) : DEFAULT_EMPLOYEES;   } catch { return DEFAULT_EMPLOYEES; } }
function loadAssign() { try { const d = localStorage.getItem(KEY_ASSIGN); return d ? JSON.parse(d) : DEFAULT_ASSIGNMENTS; } catch { return DEFAULT_ASSIGNMENTS; } }
function saveEmp(d)    { localStorage.setItem(KEY_EMP,    JSON.stringify(d)); }
function saveAssign(d) { localStorage.setItem(KEY_ASSIGN, JSON.stringify(d)); }

const STATUS_COLOR = { available: '#22c55e', busy: '#f59e0b', off: '#94a3b8' };
const STATUS_BG    = { available: '#dcfce7', busy: '#fef3c7', off: '#f1f5f9' };

export default function EmployeeAssign() {
  const [employees,   setEmployees]   = useState(loadEmp);
  const [assignments, setAssignments] = useState(loadAssign);
  const [tab,         setTab]         = useState('assignments');

  /* ---- Assignment modal ---- */
  const [assignModal, setAssignModal] = useState(null); // null | 'new' | id
  const [assignForm,  setAssignForm]  = useState(null);

  /* ---- Employee modal ---- */
  const [empModal, setEmpModal] = useState(null); // null | 'new' | id
  const [empForm,  setEmpForm]  = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id, name }

  /* =========================================================
     ASSIGNMENTS
  ========================================================= */
  const openNewAssign = () => {
    setAssignForm({ project: '', address: '', employees: [], date: '', status: 'Scheduled' });
    setAssignModal('new');
  };
  const openEditAssign = (a) => {
    setAssignForm({ ...a });
    setAssignModal(a.id);
  };
  const saveAssignment = () => {
    if (!assignForm.project.trim()) return;
    const updated = assignModal === 'new'
      ? [...assignments, { ...assignForm, id: Date.now().toString() }]
      : assignments.map(a => a.id === assignModal ? { ...a, ...assignForm } : a);
    setAssignments(updated); saveAssign(updated);
    setAssignModal(null); setAssignForm(null);
  };
  const deleteAssignment = (id) => {
    const updated = assignments.filter(a => a.id !== id);
    setAssignments(updated); saveAssign(updated);
    setDeleteTarget(null);
  };

  /* =========================================================
     EMPLOYEES
  ========================================================= */
  const openNewEmp = () => {
    setEmpForm({ name: '', role: ROLES[0], status: 'available' });
    setEmpModal('new');
  };
  const openEditEmp = (e) => {
    setEmpForm({ ...e });
    setEmpModal(e.id);
  };
  const saveEmployee = () => {
    if (!empForm.name.trim()) return;
    const avatar = empForm.name.trim()[0].toUpperCase();
    const updated = empModal === 'new'
      ? [...employees, { ...empForm, avatar, id: Date.now().toString() }]
      : employees.map(e => e.id === empModal ? { ...e, ...empForm, avatar } : e);
    setEmployees(updated); saveEmp(updated);
    setEmpModal(null); setEmpForm(null);
  };
  const deleteEmployee = (id) => {
    const updated = employees.filter(e => e.id !== id);
    setEmployees(updated); saveEmp(updated);
    setDeleteTarget(null);
  };
  const toggleStatus = (id) => {
    const order = ['available', 'busy', 'off'];
    const updated = employees.map(e => {
      if (e.id !== id) return e;
      const next = order[(order.indexOf(e.status) + 1) % order.length];
      return { ...e, status: next };
    });
    setEmployees(updated); saveEmp(updated);
  };

  const empById = (id) => employees.find(e => e.id === id);

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className="ea-page">

      {/* Header */}
      <div className="ea-header">
        <div>
          <h1 className="ea-title">Employee Assign</h1>
          <p className="ea-sub">Manage crew members and assign them to projects</p>
        </div>
        <button className="ea-btn-primary" onClick={tab === 'assignments' ? openNewAssign : openNewEmp}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {tab === 'assignments' ? 'New Assignment' : 'Add Employee'}
        </button>
      </div>

      {/* Tabs */}
      <div className="ea-tabs">
        {['assignments', 'employees'].map(t => (
          <button key={t} className={`ea-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'assignments' ? 'Assignments' : 'Employees'}
            <span className="ea-tab-count">
              {t === 'assignments' ? assignments.length : employees.length}
            </span>
          </button>
        ))}
      </div>

      {/* ---- ASSIGNMENTS TAB ---- */}
      {tab === 'assignments' && (
        <div className="ea-content">
          {assignments.length === 0 ? (
            <div className="ea-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1"/>
              </svg>
              <p>No assignments yet</p>
              <button className="ea-btn-primary" onClick={openNewAssign}>Create Assignment</button>
            </div>
          ) : (
            <div className="ea-assign-grid">
              {assignments.map(a => (
                <div key={a.id} className="ea-assign-card">
                  <div className="ea-assign-card-top">
                    <div>
                      <div className="ea-assign-project">{a.project}</div>
                      <div className="ea-assign-address">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {a.address}
                      </div>
                    </div>
                    <span className={`ea-status-pill ${a.status === 'In Progress' ? 'inprogress' : a.status === 'Completed' ? 'completed' : 'scheduled'}`}>
                      {a.status}
                    </span>
                  </div>

                  <div className="ea-assign-crew">
                    <span className="ea-assign-crew-label">Crew:</span>
                    <div className="ea-crew-avatars">
                      {a.employees.length === 0
                        ? <span className="ea-no-crew">No crew assigned</span>
                        : a.employees.map(eid => {
                            const emp = empById(eid);
                            if (!emp) return null;
                            return (
                              <div key={eid} className="ea-crew-avatar" title={`${emp.name} — ${emp.role}`}>
                                {emp.avatar}
                              </div>
                            );
                          })
                      }
                    </div>
                  </div>

                  <div className="ea-assign-footer">
                    <div className="ea-assign-date">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {a.date || 'No date'}
                    </div>
                    <div className="ea-assign-actions">
                      <button className="ea-icon-btn" onClick={() => openEditAssign(a)} title="Edit">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className="ea-icon-btn danger" onClick={() => setDeleteTarget({ type: 'assign', id: a.id, name: a.project })} title="Delete">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- EMPLOYEES TAB ---- */}
      {tab === 'employees' && (
        <div className="ea-content">
          <div className="ea-emp-stats">
            {STATUSES.map(s => (
              <div key={s} className="ea-emp-stat">
                <span className="ea-emp-stat-dot" style={{ background: STATUS_COLOR[s] }} />
                <span className="ea-emp-stat-count">{employees.filter(e => e.status === s).length}</span>
                <span className="ea-emp-stat-label">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
              </div>
            ))}
          </div>

          <div className="ea-emp-list">
            {employees.map(emp => (
              <div key={emp.id} className="ea-emp-row">
                <div className="ea-emp-avatar">{emp.avatar}</div>
                <div className="ea-emp-info">
                  <div className="ea-emp-name">{emp.name}</div>
                  <div className="ea-emp-role">{emp.role}</div>
                </div>
                <button
                  className="ea-status-chip"
                  style={{ background: STATUS_BG[emp.status], color: STATUS_COLOR[emp.status] }}
                  onClick={() => toggleStatus(emp.id)}
                  title="Click to change status"
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[emp.status], display: 'inline-block' }} />
                  {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                </button>
                <div className="ea-emp-actions">
                  <button className="ea-icon-btn" onClick={() => openEditEmp(emp)} title="Edit">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button className="ea-icon-btn danger" onClick={() => setDeleteTarget({ type: 'emp', id: emp.id, name: emp.name })} title="Delete">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- ASSIGNMENT MODAL ---- */}
      {assignModal && assignForm && (
        <div className="ea-overlay" onClick={() => { setAssignModal(null); setAssignForm(null); }}>
          <div className="ea-modal" onClick={e => e.stopPropagation()}>
            <div className="ea-modal-head">
              <h2>{assignModal === 'new' ? 'New Assignment' : 'Edit Assignment'}</h2>
              <button className="ea-modal-close" onClick={() => { setAssignModal(null); setAssignForm(null); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="ea-modal-body">
              <div className="ea-field"><label>Project Name *</label>
                <input className="ea-input" placeholder="e.g. Smith Residence" value={assignForm.project} onChange={e => setAssignForm(f => ({ ...f, project: e.target.value }))} />
              </div>
              <div className="ea-field"><label>Address</label>
                <input className="ea-input" placeholder="123 Main St" value={assignForm.address} onChange={e => setAssignForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="ea-field"><label>Date</label>
                <input className="ea-input" type="date" value={assignForm.date} onChange={e => setAssignForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="ea-field"><label>Status</label>
                <select className="ea-input" value={assignForm.status} onChange={e => setAssignForm(f => ({ ...f, status: e.target.value }))}>
                  {['Scheduled', 'In Progress', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="ea-field"><label>Assign Employees</label>
                <div className="ea-emp-checkboxes">
                  {employees.map(emp => (
                    <label key={emp.id} className="ea-emp-check">
                      <input
                        type="checkbox"
                        checked={assignForm.employees.includes(emp.id)}
                        onChange={e => {
                          const list = e.target.checked
                            ? [...assignForm.employees, emp.id]
                            : assignForm.employees.filter(id => id !== emp.id);
                          setAssignForm(f => ({ ...f, employees: list }));
                        }}
                      />
                      <div className="ea-emp-check-avatar">{emp.avatar}</div>
                      <div>
                        <div className="ea-emp-check-name">{emp.name}</div>
                        <div className="ea-emp-check-role">{emp.role}</div>
                      </div>
                      <span className="ea-emp-check-status" style={{ background: STATUS_BG[emp.status], color: STATUS_COLOR[emp.status] }}>
                        {emp.status}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="ea-modal-foot">
              <button className="ea-btn-cancel" onClick={() => { setAssignModal(null); setAssignForm(null); }}>Cancel</button>
              <button className="ea-btn-primary" onClick={saveAssignment} disabled={!assignForm.project.trim()}>
                {assignModal === 'new' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- EMPLOYEE MODAL ---- */}
      {empModal && empForm && (
        <div className="ea-overlay" onClick={() => { setEmpModal(null); setEmpForm(null); }}>
          <div className="ea-modal ea-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="ea-modal-head">
              <h2>{empModal === 'new' ? 'Add Employee' : 'Edit Employee'}</h2>
              <button className="ea-modal-close" onClick={() => { setEmpModal(null); setEmpForm(null); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="ea-modal-body">
              <div className="ea-field"><label>Full Name *</label>
                <input className="ea-input" placeholder="e.g. Juan dela Cruz" value={empForm.name} onChange={e => setEmpForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="ea-field"><label>Role</label>
                <select className="ea-input" value={empForm.role} onChange={e => setEmpForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="ea-field"><label>Status</label>
                <select className="ea-input" value={empForm.status} onChange={e => setEmpForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="ea-modal-foot">
              <button className="ea-btn-cancel" onClick={() => { setEmpModal(null); setEmpForm(null); }}>Cancel</button>
              <button className="ea-btn-primary" onClick={saveEmployee} disabled={!empForm.name.trim()}>
                {empModal === 'new' ? 'Add Employee' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- DELETE CONFIRM ---- */}
      {deleteTarget && (
        <div className="ea-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="ea-modal ea-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="ea-modal-head">
              <h2>Confirm Delete</h2>
              <button className="ea-modal-close" onClick={() => setDeleteTarget(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="ea-modal-body">
              <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                Delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
              </p>
            </div>
            <div className="ea-modal-foot">
              <button className="ea-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="ea-btn-danger" onClick={() => deleteTarget.type === 'assign' ? deleteAssignment(deleteTarget.id) : deleteEmployee(deleteTarget.id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
