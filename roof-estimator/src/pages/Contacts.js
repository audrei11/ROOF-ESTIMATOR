import { useState, useEffect } from 'react';

const STORAGE_KEY = 'precision-contacts';

const DEFAULT_CONTACTS = [
  { id: '1', name: 'Biak Lian',       type: 'Customer', label: '',  email: '',                    phone: '',              job: '7634 Cynthia Dr, Indianapolis, IN' },
  { id: '2', name: 'Crystal Wheeler', type: 'Customer', label: '',  email: '',                    phone: '',              job: '2722 Station St, Indianapolis, IN' },
  { id: '3', name: 'Hazel Utley',     type: 'Customer', label: '',  email: '',                    phone: '',              job: '2745 Station Rd, Avon, IN' },
  { id: '4', name: 'Ira&Kath',        type: 'Customer', label: '',  email: 'Ira_kathc@yahoo.com', phone: '(812) 350-7490', job: '5530 Smoketree Ln, Greenwood, IN' },
  { id: '5', name: 'Kelly Moore',     type: 'Customer', label: '',  email: '',                    phone: '',              job: '515 Delbrick Ln, Brownsburg, IN' },
  { id: '6', name: 'Paul Dorian',     type: 'Customer', label: '',  email: '',                    phone: '',              job: '8701 North Rd, Indianapolis, IN' },
];

function loadContacts() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_CONTACTS;
  } catch { return DEFAULT_CONTACTS; }
}

function saveContacts(contacts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

const EMPTY_FORM = { name: '', type: 'Customer', label: '', email: '', phone: '', job: '' };
const TYPES = ['Customer', 'Lead', 'Contractor', 'Supplier'];

export default function Contacts() {
  const [contacts, setContacts] = useState(loadContacts);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [modal, setModal] = useState(null);   // null | { mode: 'add'|'edit', contact }
  const [form, setForm] = useState(EMPTY_FORM);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const close = () => setOpenMenuId(null);
    if (openMenuId) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuId]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setModal({ mode: 'add' });
  };

  const openEdit = (contact) => {
    setForm({ ...contact });
    setModal({ mode: 'edit', contact });
    setOpenMenuId(null);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    let updated;
    if (modal.mode === 'add') {
      updated = [...contacts, { ...form, id: Date.now().toString() }];
    } else {
      updated = contacts.map(c => c.id === modal.contact.id ? { ...c, ...form } : c);
    }
    setContacts(updated);
    saveContacts(updated);
    setModal(null);
  };

  const handleDelete = (id) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    saveContacts(updated);
    setDeleteConfirm(null);
    setOpenMenuId(null);
  };

  const handleSort = (col) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  const sorted = [...filtered].sort((a, b) => {
    const va = (a[sortCol] || '').toLowerCase();
    const vb = (b[sortCol] || '').toLowerCase();
    return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  return (
    <div className="contacts-page">

      {/* Header */}
      <div className="contacts-header">
        <h1 className="contacts-title">Contacts</h1>
        <button className="contacts-new-btn" onClick={openAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New contact
        </button>
      </div>

      {/* Toolbar */}
      <div className="contacts-toolbar">
        <div className="contacts-search-wrap">
          <svg className="contacts-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="contacts-search" type="text"
            placeholder="Search by name, email, phone"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="contacts-count">{sorted.length} contact{sorted.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Table */}
      <div className="contacts-table-wrap">
        <table className="contacts-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="contacts-th-sortable">
                Name <SortIcon active={sortCol === 'name'} asc={sortAsc} />
              </th>
              <th onClick={() => handleSort('type')} className="contacts-th-sortable">
                Type <SortIcon active={sortCol === 'type'} asc={sortAsc} />
              </th>
              <th>Label</th>
              <th onClick={() => handleSort('email')} className="contacts-th-sortable">
                Email <SortIcon active={sortCol === 'email'} asc={sortAsc} />
              </th>
              <th>Phone</th>
              <th>Job / Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan="7" className="contacts-empty-row">
                  No contacts found
                </td>
              </tr>
            ) : sorted.map(c => (
              <tr key={c.id} className="contacts-row" onDoubleClick={() => openEdit(c)}>
                <td className="contacts-name-cell">
                  <div className="contacts-avatar">{c.name.charAt(0).toUpperCase()}</div>
                  {c.name}
                </td>
                <td>
                  <span className="contacts-type-badge">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                    </svg>
                    {c.type}
                  </span>
                </td>
                <td className="contacts-muted">{c.label || '—'}</td>
                <td className="contacts-muted">{c.email || '—'}</td>
                <td className="contacts-muted">{c.phone || '—'}</td>
                <td className="contacts-muted contacts-job-cell">{c.job || '—'}</td>
                <td className="contacts-actions-cell">
                  <button
                    className="contacts-edit-btn"
                    title="Edit"
                    onClick={() => openEdit(c)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <div className="contacts-menu-wrap">
                    <button
                      className="contacts-actions-btn"
                      onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === c.id ? null : c.id); }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                        <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                      </svg>
                    </button>
                    {openMenuId === c.id && (
                      <div className="contacts-dropdown">
                        <button className="contacts-dropdown-item" onClick={() => openEdit(c)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Edit contact
                        </button>
                        <button
                          className="contacts-dropdown-item danger"
                          onClick={e => { e.stopPropagation(); setDeleteConfirm(c); setOpenMenuId(null); }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Edit / Add Modal ── */}
      {modal && (
        <div className="contacts-modal-overlay" onClick={() => setModal(null)}>
          <div className="contacts-modal" onClick={e => e.stopPropagation()}>
            <div className="contacts-modal-header">
              <h2>{modal.mode === 'add' ? 'New Contact' : 'Edit Contact'}</h2>
              <button className="contacts-modal-close" onClick={() => setModal(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="contacts-modal-body">
              <div className="contacts-form-row">
                <FormField label="Full Name *" required>
                  <input
                    className="contacts-input"
                    placeholder="e.g. John Smith"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </FormField>
                <FormField label="Type">
                  <select
                    className="contacts-input"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  >
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </FormField>
              </div>

              <div className="contacts-form-row">
                <FormField label="Email">
                  <input
                    className="contacts-input"
                    type="email" placeholder="email@example.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </FormField>
                <FormField label="Phone">
                  <input
                    className="contacts-input"
                    placeholder="(000) 000-0000"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </FormField>
              </div>

              <FormField label="Job / Address">
                <input
                  className="contacts-input"
                  placeholder="e.g. 1234 Main St, Indianapolis, IN"
                  value={form.job}
                  onChange={e => setForm(f => ({ ...f, job: e.target.value }))}
                />
              </FormField>

              <FormField label="Label">
                <input
                  className="contacts-input"
                  placeholder="e.g. VIP, Referral..."
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="contacts-modal-footer">
              <button className="contacts-modal-cancel" onClick={() => setModal(null)}>Cancel</button>
              <button
                className="contacts-modal-save"
                onClick={handleSave}
                disabled={!form.name.trim()}
              >
                {modal.mode === 'add' ? 'Add Contact' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div className="contacts-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="contacts-modal contacts-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="contacts-modal-header">
              <h2>Delete Contact</h2>
              <button className="contacts-modal-close" onClick={() => setDeleteConfirm(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="contacts-modal-body">
              <p className="contacts-delete-msg">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.
              </p>
            </div>
            <div className="contacts-modal-footer">
              <button className="contacts-modal-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="contacts-modal-delete" onClick={() => handleDelete(deleteConfirm.id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div className="contacts-form-field">
      <label className="contacts-form-label">{label}</label>
      {children}
    </div>
  );
}

function SortIcon({ active, asc }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#2563eb' : 'currentColor'} strokeWidth="2" strokeLinecap="round"
      style={{ marginLeft: 4, opacity: active ? 1 : 0.4 }}
    >
      {active && asc  ? <path d="M8 15l4 4 4-4M12 5v14"/> :
       active && !asc ? <path d="M8 9l4-4 4 4M12 19V5"/> :
       <><path d="M8 9l4-4 4 4"/><path d="M8 15l4 4 4-4"/></>}
    </svg>
  );
}
