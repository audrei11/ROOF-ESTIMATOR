import { useState, useRef, useEffect } from 'react';

/* ── Storage keys ───────────────────────────────────────────────────────── */
const CONTACTS_KEY = 'inbox-contacts-v2';
const MESSAGES_KEY  = 'inbox-messages-v2';

/* ── Sample data ────────────────────────────────────────────────────────── */
const DEFAULT_CONTACTS = [
  { id: '1', name: 'Kelly Moore',  email: 'kelly@example.com',   phone: '(555) 100-1001', unread: 2 },
  { id: '2', name: 'Biak Lian',    email: 'biak@example.com',    phone: '(555) 100-1002', unread: 0 },
  { id: '3', name: 'Hazel Utley',  email: 'hazel@example.com',   phone: '(555) 100-1003', unread: 1 },
  { id: '4', name: 'Ira & Kath',   email: 'irakath@example.com', phone: '(555) 100-1004', unread: 0 },
  { id: '5', name: 'Paul Dorian',  email: 'paul@example.com',    phone: '(555) 100-1005', unread: 0 },
];

const DEFAULT_MESSAGES = [
  { id:'1',  cid:'1', ch:'email', dir:'in',  body:'Hi, can you send over the proposal for the roof replacement? Would love to review it.',                         time:'2026-04-10T09:00:00', files:[] },
  { id:'2',  cid:'1', ch:'email', dir:'out', body:'Hi Kelly! Of course — attaching the full proposal now. Let me know if you have any questions!',                 time:'2026-04-10T09:15:00', files:[{name:'Proposal_KellyMoore.pdf', size:'1.2 MB', type:'pdf'}] },
  { id:'3',  cid:'1', ch:'email', dir:'in',  body:"Got it, thank you! I'll review and get back to you by end of day.",                                             time:'2026-04-10T09:30:00', files:[] },
  { id:'4',  cid:'1', ch:'sms',   dir:'out', body:"Hey Kelly! Just following up on the proposal. Let us know when you're ready to move forward!",                  time:'2026-04-11T10:00:00', files:[] },
  { id:'5',  cid:'1', ch:'sms',   dir:'in',  body:'It looks great! Can we schedule a call to finalize everything?',                                                time:'2026-04-11T10:45:00', files:[] },

  { id:'6',  cid:'2', ch:'email', dir:'out', body:'Hi Biak! Please find attached our proposal for the $8,400 shingle replacement. Please review and sign.',       time:'2026-04-09T14:00:00', files:[{name:'Proposal_BiakLian.pdf', size:'980 KB', type:'pdf'}] },

  { id:'7',  cid:'3', ch:'sms',   dir:'out', body:'Hi Hazel! Confirming our site visit tomorrow at 11am. Our team will arrive at your address.',                   time:'2026-04-08T09:00:00', files:[] },
  { id:'8',  cid:'3', ch:'sms',   dir:'in',  body:'Perfect, see you then! The front gate will be open.',                                                           time:'2026-04-08T09:15:00', files:[] },
  { id:'9',  cid:'3', ch:'email', dir:'in',  body:'Hi, please find attached my insurance documents and roof photos for the claim. Let me know if you need anything else.', time:'2026-04-08T11:30:00', files:[{name:'Insurance_Claim.pdf', size:'3.1 MB', type:'pdf'},{name:'Roof_Photos.zip', size:'5.6 MB', type:'zip'}] },

  { id:'10', cid:'4', ch:'sms',   dir:'out', body:'Hi! Friendly reminder that Invoice #004 is due this week. Please let us know if you have questions.',           time:'2026-04-07T16:45:00', files:[] },

  { id:'11', cid:'5', ch:'email', dir:'out', body:"Hi Paul! The job is now complete. We've sent over the final invoice. Thank you for choosing Ahjin Roofing!", time:'2026-04-06T17:00:00', files:[{name:'Invoice_PaulDorian.pdf', size:'450 KB', type:'pdf'}] },
];

/* ── Helpers ────────────────────────────────────────────────────────────── */
function load(key, def) {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : def; } catch { return def; }
}
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

function initials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' });
  }
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

const AVATAR_COLORS = ['#2563eb','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#0f766e'];
function avatarColor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

/* ── Component ──────────────────────────────────────────────────────────── */
export default function Communications() {
  const [contacts,       setContacts]       = useState(() => load(CONTACTS_KEY, DEFAULT_CONTACTS));
  const [messages,       setMessages]       = useState(() => load(MESSAGES_KEY,  DEFAULT_MESSAGES));
  const [activeId,       setActiveId]       = useState('1');
  const [activeChannel,  setActiveChannel]  = useState('email');
  const [search,         setSearch]         = useState('');
  const [text,           setText]           = useState('');
  const [pendingFiles,   setPendingFiles]   = useState([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm,    setContactForm]    = useState({ name:'', email:'', phone:'' });

  const fileInputRef   = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  const activeContact = contacts.find(c => c.id === activeId);

  /* contacts enriched with last message */
  const enriched = contacts
    .map(c => {
      const msgs = messages.filter(m => m.cid === c.id);
      const last = msgs.sort((a, b) => new Date(b.time) - new Date(a.time))[0];
      return { ...c, lastMsg: last };
    })
    .filter(c =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const at = a.lastMsg ? new Date(a.lastMsg.time) : 0;
      const bt = b.lastMsg ? new Date(b.lastMsg.time) : 0;
      return bt - at;
    });

  /* messages for active thread */
  const thread = messages
    .filter(m => m.cid === activeId && m.ch === activeChannel)
    .sort((a, b) => new Date(a.time) - new Date(b.time));

  /* auto-scroll on new message */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length, activeId, activeChannel]);

  /* select a contact */
  const selectContact = (id) => {
    setActiveId(id);
    const chans = [...new Set(messages.filter(m => m.cid === id).map(m => m.ch))];
    setActiveChannel(chans[0] || 'email');
    const updated = contacts.map(c => c.id === id ? { ...c, unread: 0 } : c);
    setContacts(updated);
    save(CONTACTS_KEY, updated);
  };

  /* file picker */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).map(f => ({
      name: f.name,
      size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`,
      type: f.name.split('.').pop().toLowerCase(),
    }));
    setPendingFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeFile = (i) => setPendingFiles(prev => prev.filter((_, idx) => idx !== i));

  /* send message */
  const send = () => {
    if (!text.trim() && pendingFiles.length === 0) return;
    const msg = {
      id:    Date.now().toString(),
      cid:   activeId,
      ch:    activeChannel,
      dir:   'out',
      body:  text.trim(),
      time:  new Date().toISOString(),
      files: pendingFiles,
    };
    const updated = [...messages, msg];
    setMessages(updated);
    save(MESSAGES_KEY, updated);
    setText('');
    setPendingFiles([]);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  /* add contact */
  const addContact = () => {
    if (!contactForm.name.trim()) return;
    const c = { id: Date.now().toString(), ...contactForm, unread: 0 };
    const updated = [...contacts, c];
    setContacts(updated);
    save(CONTACTS_KEY, updated);
    setShowAddContact(false);
    setContactForm({ name:'', email:'', phone:'' });
    setActiveId(c.id);
    setActiveChannel('email');
  };

  /* ── Render ── */
  return (
    <div className="inbox-page">

      {/* ════════════ LEFT SIDEBAR ════════════ */}
      <div className="inbox-sidebar">
        <div className="inbox-sidebar-header">
          <div className="inbox-sidebar-top">
            <h1 className="inbox-sidebar-title">Inbox</h1>
            <button className="inbox-new-btn" onClick={() => setShowAddContact(true)} title="Add contact">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
          <div className="inbox-search-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="inbox-search"
              placeholder="Search contacts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="inbox-contact-list">
          {enriched.length === 0 && <div className="inbox-no-contacts">No contacts found</div>}
          {enriched.map(c => {
            const hasEmail = messages.some(m => m.cid === c.id && m.ch === 'email');
            const hasSms   = messages.some(m => m.cid === c.id && m.ch === 'sms');
            const preview  = c.lastMsg
              ? (c.lastMsg.body || (c.lastMsg.files.length ? `📎 ${c.lastMsg.files[0].name}` : ''))
              : 'No messages yet';
            return (
              <div
                key={c.id}
                className={`inbox-contact-item ${activeId === c.id ? 'active' : ''}`}
                onClick={() => selectContact(c.id)}
              >
                <div className="inbox-avatar" style={{ background: avatarColor(c.name) }}>
                  {initials(c.name)}
                </div>
                <div className="inbox-contact-info">
                  <div className="inbox-contact-name">{c.name}</div>
                  <div className="inbox-contact-preview">{preview}</div>
                </div>
                <div className="inbox-contact-meta">
                  {c.lastMsg && <span className="inbox-contact-time">{formatTime(c.lastMsg.time)}</span>}
                  <div style={{ display:'flex', gap:3, alignItems:'center' }}>
                    {hasEmail && (
                      <span className="inbox-channel-icon email" title="Email">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                      </span>
                    )}
                    {hasSms && (
                      <span className="inbox-channel-icon sms" title="SMS">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2.5">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                      </span>
                    )}
                    {c.unread > 0 && <span className="inbox-unread-badge">{c.unread}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════════ RIGHT THREAD PANEL ════════════ */}
      <div className="inbox-thread">
        {!activeContact ? (
          <div className="inbox-empty-state">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>Select a contact to view the conversation</p>
          </div>
        ) : (
          <>
            {/* ── Thread Header ── */}
            <div className="inbox-thread-header">
              <div className="inbox-thread-contact">
                <div
                  className="inbox-avatar"
                  style={{ background: avatarColor(activeContact.name), width:38, height:38, fontSize:13 }}
                >
                  {initials(activeContact.name)}
                </div>
                <div>
                  <div className="inbox-thread-name">{activeContact.name}</div>
                  <div className="inbox-thread-sub">{activeContact.email} · {activeContact.phone}</div>
                </div>
              </div>

              {/* Channel toggle */}
              <div className="inbox-channel-tabs">
                {['email','sms'].map(ch => (
                  <button
                    key={ch}
                    className={`inbox-ch-tab ${ch} ${activeChannel === ch ? 'active' : ''}`}
                    onClick={() => setActiveChannel(ch)}
                  >
                    {ch === 'email' ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    )}
                    {ch === 'email' ? 'Email' : 'SMS'}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Messages ── */}
            <div className="inbox-messages">
              {thread.length === 0 && (
                <div className="inbox-no-messages">
                  No {activeChannel === 'email' ? 'emails' : 'texts'} yet — start the conversation!
                </div>
              )}
              {thread.map(m => (
                <div key={m.id} className={`inbox-msg ${m.dir}`}>
                  <div className="inbox-msg-bubble">
                    {m.body && <span>{m.body}</span>}
                    {m.files && m.files.length > 0 && (
                      <div className="inbox-msg-files">
                        {m.files.map((f, i) => (
                          <div key={i} className="inbox-file-chip">
                            <div className="inbox-file-icon">
                              <FileIcon type={f.type} dir={m.dir} />
                            </div>
                            <div>
                              <div className="inbox-file-name">{f.name}</div>
                              <div className="inbox-file-size">{f.size}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="inbox-msg-time">{formatTime(m.time)}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Compose ── */}
            <div className="inbox-compose">
              {pendingFiles.length > 0 && (
                <div className="inbox-attach-preview">
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="inbox-attach-chip">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                      </svg>
                      {f.name}
                      <button onClick={() => removeFile(i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="inbox-compose-box">
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display:'none' }}
                  multiple
                  onChange={handleFileChange}
                />
                <button
                  className="inbox-compose-attach"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>
                <textarea
                  ref={textareaRef}
                  className="inbox-compose-input"
                  placeholder={`Send a ${activeChannel === 'email' ? 'email' : 'text message'}... (Enter to send)`}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  className="inbox-compose-send"
                  onClick={send}
                  disabled={!text.trim() && pendingFiles.length === 0}
                  title="Send"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ════════════ ADD CONTACT MODAL ════════════ */}
      {showAddContact && (
        <div className="comms-modal-overlay" onClick={() => setShowAddContact(false)}>
          <div className="comms-modal" onClick={e => e.stopPropagation()}>
            <div className="comms-modal-header">
              <h2>Add Contact</h2>
              <button className="comms-modal-close" onClick={() => setShowAddContact(false)}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="comms-modal-body">
              {[
                ['Name *',  'name',  'e.g. John Smith',     'text'],
                ['Email',   'email', 'john@example.com',    'email'],
                ['Phone',   'phone', '(555) 000-0000',      'tel'],
              ].map(([label, field, ph, type]) => (
                <div key={field} className="comms-form-field">
                  <label className="comms-form-label">{label}</label>
                  <input
                    className="comms-input"
                    type={type}
                    placeholder={ph}
                    value={contactForm[field]}
                    onChange={e => setContactForm(f => ({ ...f, [field]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="comms-modal-footer">
              <button className="comms-modal-cancel" onClick={() => setShowAddContact(false)}>Cancel</button>
              <button
                className="comms-modal-save"
                onClick={addContact}
                disabled={!contactForm.name.trim()}
              >
                Add Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── File icon by extension ─────────────────────────────────────────────── */
function FileIcon({ type, dir }) {
  const color = dir === 'out' ? 'rgba(255,255,255,0.9)' : '#64748b';
  const s = { width:14, height:14, viewBox:'0 0 24 24', fill:'none', stroke:color, strokeWidth:2 };
  if (type === 'pdf')
    return <svg {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
  if (['jpg','jpeg','png','gif','webp'].includes(type))
    return <svg {...s}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
  if (type === 'zip' || type === 'rar')
    return <svg {...s}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg>;
  return <svg {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
