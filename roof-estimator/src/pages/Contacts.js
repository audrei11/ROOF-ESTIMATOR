import { useState, useEffect } from 'react';

const STORAGE_KEY = 'precision-contacts';

const DEFAULT_CONTACTS = [
  { id:'1', name:'Biak Lian',       type:'Customer', label:'',       email:'',                    phone:'',              job:'7634 Cynthia Dr, Indianapolis, IN' },
  { id:'2', name:'Crystal Wheeler', type:'Customer', label:'VIP',    email:'crystal@gmail.com',   phone:'(317) 555-0192',job:'2722 Station St, Indianapolis, IN' },
  { id:'3', name:'Hazel Utley',     type:'Lead',     label:'',       email:'hazel.utley@mail.com',phone:'(317) 555-0341',job:'2745 Station Rd, Avon, IN' },
  { id:'4', name:'Ira & Kath',      type:'Customer', label:'',       email:'Ira_kathc@yahoo.com', phone:'(812) 350-7490',job:'5530 Smoketree Ln, Greenwood, IN' },
  { id:'5', name:'Kelly Moore',     type:'Lead',     label:'Hot',    email:'kelly.moore@web.com', phone:'(317) 555-0210',job:'515 Delbrick Ln, Brownsburg, IN' },
  { id:'6', name:'Paul Dorian',     type:'Customer', label:'',       email:'',                    phone:'',              job:'8701 North Rd, Indianapolis, IN' },
];

function load() {
  try { const d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : DEFAULT_CONTACTS; }
  catch { return DEFAULT_CONTACTS; }
}
function save(c) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }

const EMPTY_FORM = { name:'', type:'Customer', label:'', email:'', phone:'', job:'' };
const TYPES = ['Customer','Lead','Contractor','Supplier'];

const TYPE_STYLE = {
  Customer:   { bg:'#dbeafe', color:'#1d4ed8' },
  Lead:       { bg:'#d1fae5', color:'#059669' },
  Contractor: { bg:'#ede9fe', color:'#7c3aed' },
  Supplier:   { bg:'#fef3c7', color:'#d97706' },
};

const AVATAR_COLORS = [
  'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#8b5cf6,#7c3aed)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ef4444,#dc2626)',
  'linear-gradient(135deg,#06b6d4,#0891b2)',
];

function avatarBg(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function Contacts() {
  const [contacts, setContacts] = useState(load);
  const [search,   setSearch]   = useState('');
  const [sortCol,  setSortCol]  = useState('name');
  const [sortAsc,  setSortAsc]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [menuId,   setMenuId]   = useState(null);
  const [delConfirm, setDelConfirm] = useState(null);
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    const close = () => setMenuId(null);
    if (menuId) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuId]);

  const openAdd  = () => { setForm(EMPTY_FORM); setModal({ mode:'add' }); };
  const openEdit = (c) => { setForm({...c}); setModal({ mode:'edit', contact:c }); setMenuId(null); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const updated = modal.mode === 'add'
      ? [...contacts, { ...form, id: Date.now().toString() }]
      : contacts.map(c => c.id === modal.contact.id ? { ...c, ...form } : c);
    setContacts(updated); save(updated); setModal(null);
  };

  const handleDelete = (id) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated); save(updated); setDelConfirm(null); setMenuId(null);
  };

  const handleSort = (col) => {
    if (sortCol === col) setSortAsc(a => !a);
    else { setSortCol(col); setSortAsc(true); }
  };

  const filtered = contacts
    .filter(c => filterType === 'All' || c.type === filterType)
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email||'').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone||'').includes(search)
    );

  const sorted = [...filtered].sort((a,b) => {
    const va = (a[sortCol]||'').toLowerCase();
    const vb = (b[sortCol]||'').toLowerCase();
    return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  const counts = { All: contacts.length };
  TYPES.forEach(t => { counts[t] = contacts.filter(c => c.type === t).length; });

  return (
    <div className="ct-page">

      {/* ── Header ── */}
      <div className="ct-header">
        <div>
          <h1 className="ct-title">Contacts</h1>
          <p className="ct-sub">{contacts.length} total contacts</p>
        </div>
        <button className="ct-new-btn" onClick={openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Contact
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="ct-stats">
        {TYPES.map(t => {
          const s = TYPE_STYLE[t];
          return (
            <div key={t} className={`ct-stat-card${filterType===t?' active':''}`} onClick={() => setFilterType(filterType===t?'All':t)}>
              <div className="ct-stat-num" style={{ color: s.color }}>{counts[t]||0}</div>
              <div className="ct-stat-label">{t}s</div>
              <div className="ct-stat-bar" style={{ background: s.bg }}>
                <div className="ct-stat-fill" style={{ background: s.color, width: `${contacts.length ? ((counts[t]||0)/contacts.length*100) : 0}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Toolbar ── */}
      <div className="ct-toolbar">
        <div className="ct-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="ct-search"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="ct-search-clear" onClick={() => setSearch('')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        <div className="ct-filter-chips">
          {['All', ...TYPES].map(t => (
            <button
              key={t}
              className={`ct-chip${filterType===t?' active':''}`}
              onClick={() => setFilterType(t)}
            >
              {t} <span>{counts[t]||0}</span>
            </button>
          ))}
        </div>

        <div className="ct-result-count">{sorted.length} result{sorted.length!==1?'s':''}</div>
      </div>

      {/* ── Table ── */}
      <div className="ct-table-wrap">
        <table className="ct-table">
          <thead>
            <tr>
              <th className="ct-th sortable" onClick={() => handleSort('name')}>
                Name <SortIcon col="name" active={sortCol} asc={sortAsc} />
              </th>
              <th className="ct-th sortable" onClick={() => handleSort('type')}>
                Type <SortIcon col="type" active={sortCol} asc={sortAsc} />
              </th>
              <th className="ct-th">Label</th>
              <th className="ct-th sortable" onClick={() => handleSort('email')}>
                Email <SortIcon col="email" active={sortCol} asc={sortAsc} />
              </th>
              <th className="ct-th">Phone</th>
              <th className="ct-th">Address</th>
              <th className="ct-th" style={{ width:80 }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan="7" className="ct-empty-row">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span>No contacts found</span>
                </td>
              </tr>
            ) : sorted.map(c => {
              const ts = TYPE_STYLE[c.type] || TYPE_STYLE.Customer;
              return (
                <tr key={c.id} className="ct-row" onDoubleClick={() => openEdit(c)}>
                  <td className="ct-td ct-name-cell">
                    <div className="ct-avatar" style={{ background: avatarBg(c.name) }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ct-name-info">
                      <span className="ct-name">{c.name}</span>
                      {c.email && <span className="ct-email-small">{c.email}</span>}
                    </div>
                  </td>
                  <td className="ct-td">
                    <span className="ct-type-badge" style={{ background: ts.bg, color: ts.color }}>
                      {c.type}
                    </span>
                  </td>
                  <td className="ct-td">
                    {c.label
                      ? <span className="ct-label-tag">{c.label}</span>
                      : <span className="ct-muted">—</span>
                    }
                  </td>
                  <td className="ct-td ct-muted">{c.email || '—'}</td>
                  <td className="ct-td ct-muted">{c.phone || '—'}</td>
                  <td className="ct-td ct-muted ct-addr">{c.job || '—'}</td>
                  <td className="ct-td ct-actions-cell">
                    <button className="ct-icon-btn" title="Edit" onClick={() => openEdit(c)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <div className="ct-menu-wrap">
                      <button className="ct-icon-btn" onClick={e => { e.stopPropagation(); setMenuId(menuId===c.id?null:c.id); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                        </svg>
                      </button>
                      {menuId === c.id && (
                        <div className="ct-dropdown">
                          <button className="ct-dropdown-item" onClick={() => openEdit(c)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit contact
                          </button>
                          <button className="ct-dropdown-item danger" onClick={e => { e.stopPropagation(); setDelConfirm(c); setMenuId(null); }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="ct-overlay" onClick={() => setModal(null)}>
          <div className="ct-modal" onClick={e => e.stopPropagation()}>
            <div className="ct-modal-head">
              <h2>{modal.mode==='add' ? 'New Contact' : 'Edit Contact'}</h2>
              <button className="ct-modal-close" onClick={() => setModal(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="ct-modal-body">
              <div className="ct-form-row">
                <CField label="Full Name *">
                  <input className="ct-input" placeholder="e.g. John Smith" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
                </CField>
                <CField label="Type">
                  <select className="ct-input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                    {TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </CField>
              </div>
              <div className="ct-form-row">
                <CField label="Email">
                  <input className="ct-input" type="email" placeholder="email@example.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
                </CField>
                <CField label="Phone">
                  <input className="ct-input" placeholder="(000) 000-0000" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
                </CField>
              </div>
              <CField label="Address / Job Site">
                <input className="ct-input" placeholder="e.g. 1234 Main St, Indianapolis, IN" value={form.job} onChange={e=>setForm(f=>({...f,job:e.target.value}))} />
              </CField>
              <CField label="Label">
                <input className="ct-input" placeholder="e.g. VIP, Referral, Hot..." value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} />
              </CField>
            </div>
            <div className="ct-modal-foot">
              <button className="ct-btn-cancel" onClick={() => setModal(null)}>Cancel</button>
              <button className="ct-btn-save" onClick={handleSave} disabled={!form.name.trim()}>
                {modal.mode==='add' ? 'Add Contact' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {delConfirm && (
        <div className="ct-overlay" onClick={() => setDelConfirm(null)}>
          <div className="ct-modal ct-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="ct-modal-head">
              <h2>Delete Contact</h2>
              <button className="ct-modal-close" onClick={() => setDelConfirm(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="ct-modal-body">
              <p style={{margin:0,fontSize:14,color:'#374151',lineHeight:1.6}}>
                Delete <strong>{delConfirm.name}</strong>? This cannot be undone.
              </p>
            </div>
            <div className="ct-modal-foot">
              <button className="ct-btn-cancel" onClick={() => setDelConfirm(null)}>Cancel</button>
              <button className="ct-btn-danger" onClick={() => handleDelete(delConfirm.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CField({ label, children }) {
  return (
    <div className="ct-field">
      <label className="ct-field-label">{label}</label>
      {children}
    </div>
  );
}

function SortIcon({ col, active, asc }) {
  const isActive = active === col;
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke={isActive ? '#2563eb' : '#cbd5e1'} strokeWidth="2" strokeLinecap="round"
      style={{ marginLeft:4 }}
    >
      {isActive && asc  ? <path d="M8 15l4 4 4-4M12 5v14"/> :
       isActive && !asc ? <path d="M8 9l4-4 4 4M12 19V5"/> :
       <><path d="M8 9l4-4 4 4"/><path d="M8 15l4 4 4-4"/></>}
    </svg>
  );
}
