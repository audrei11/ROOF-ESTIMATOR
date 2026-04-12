import { useState, useMemo, useCallback, useEffect } from 'react';

const CALENDAR_KEY = 'ahjin-calendar-events';

function loadEvents() {
  try {
    const d = localStorage.getItem(CALENDAR_KEY);
    return d ? JSON.parse(d) : INITIAL_EVENTS;
  } catch { return INITIAL_EVENTS; }
}

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const EVENT_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316'];

const INITIAL_EVENTS = [
  { id:1, title:'Client Meeting',     date:'2026-04-07', time:'4:30 PM', color:'#3b82f6', desc:'Meeting with Smith family re: full roof replacement.' },
  { id:2, title:'Roof Inspection',    date:'2026-04-10', time:'9:00 AM', color:'#10b981', desc:'Inspect Johnson property before estimate.' },
  { id:3, title:'Material Delivery',  date:'2026-04-10', time:'11:00 AM',color:'#f59e0b', desc:'Shingles delivery — Smith Residence.' },
  { id:4, title:'Estimate Visit',     date:'2026-04-14', time:'2:00 PM', color:'#8b5cf6', desc:'On-site measurement for Wheeler job.' },
  { id:5, title:'Crew Standup',       date:'2026-04-15', time:'8:00 AM', color:'#06b6d4', desc:'Weekly crew sync.' },
  { id:6, title:'Full Install',       date:'2026-04-17', time:'7:00 AM', color:'#10b981', desc:'Full day install — Moore Residence.' },
  { id:7, title:'Follow-up Call',     date:'2026-04-21', time:'3:30 PM', color:'#3b82f6', desc:'Call Dorian re: repair status.' },
  { id:8, title:'Warranty Repair',    date:'2026-04-24', time:'10:00 AM',color:'#ef4444', desc:'Fix flashing on Garcia property.' },
];

const EMPTY_FORM = { title:'', date:'', time:'', color:'#3b82f6', desc:'' };

function toDateKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

export default function Calendar() {
  const today = useMemo(() => new Date(), []);
  const [month, setMonth]   = useState(today.getMonth());
  const [year,  setYear]    = useState(today.getFullYear());
  const [events, setEvents] = useState(loadEvents);

  useEffect(() => {
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(events));
  }, [events]);
  const [selected, setSelected] = useState(null); // { day, month, year }
  const [modal, setModal]   = useState(null); // null | 'new' | id
  const [form, setForm]     = useState(EMPTY_FORM);
  const [detailEv, setDetailEv] = useState(null);

  /* Navigation */
  const prev  = () => month === 0  ? (setMonth(11), setYear(y=>y-1)) : setMonth(m=>m-1);
  const next  = () => month === 11 ? (setMonth(0),  setYear(y=>y+1)) : setMonth(m=>m+1);
  const goNow = () => { setMonth(today.getMonth()); setYear(today.getFullYear()); };

  /* Grid cells */
  const { cells, weeks } = useMemo(() => {
    const dim = new Date(year, month+1, 0).getDate();
    const sd  = new Date(year, month, 1).getDay();
    const pmd = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i=sd-1; i>=0; i--) cells.push({ day: pmd-i, inMonth:false });
    for (let d=1; d<=dim; d++) cells.push({ day:d, inMonth:true });
    const total = Math.ceil(cells.length/7)*7;
    for (let d=1; d<=total-cells.length; d++) cells.push({ day:d, inMonth:false });
    const weeks = [];
    for (let i=0; i<cells.length; i+=7) weeks.push(cells.slice(i,i+7));
    return { cells, weeks };
  }, [month, year]);

  const eventsOnDay = useCallback((d, m, y) => {
    const key = toDateKey(y, m, d);
    return events.filter(e => e.date === key);
  }, [events]);

  const isToday = useCallback((d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
  [month, year, today]);

  /* Upcoming events (next 7 days from today) */
  const upcoming = useMemo(() => {
    const now = new Date();
    return events
      .filter(e => { const d = new Date(e.date); return d >= now; })
      .sort((a,b) => a.date.localeCompare(b.date))
      .slice(0, 6);
  }, [events]);

  /* CRUD */
  const openNew = (day, m, y) => {
    setForm({ ...EMPTY_FORM, date: toDateKey(y, m, day) });
    setModal('new');
  };
  const saveEvent = () => {
    if (!form.title.trim() || !form.date) return;
    if (modal === 'new') {
      setEvents(ev => [...ev, { ...form, id: Date.now() }]);
    } else {
      setEvents(ev => ev.map(e => e.id === modal ? { ...e, ...form } : e));
    }
    setModal(null); setForm(EMPTY_FORM);
  };
  const deleteEvent = (id) => {
    setEvents(ev => ev.filter(e => e.id !== id));
    setDetailEv(null);
  };
  const openEdit = (ev) => {
    setForm({ ...ev });
    setModal(ev.id);
    setDetailEv(null);
  };

  return (
    <div className="cal2-page">

      {/* ── Header ── */}
      <div className="cal2-header">
        <div className="cal2-header-left">
          <h1 className="cal2-title">{MONTHS[month]} <span>{year}</span></h1>
          <div className="cal2-nav">
            <button className="cal2-nav-btn" onClick={prev}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button className="cal2-nav-btn" onClick={next}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button className="cal2-today-btn" onClick={goNow}>Today</button>
          </div>
        </div>
        <button className="cal2-new-btn" onClick={() => { setForm(EMPTY_FORM); setModal('new'); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Event
        </button>
      </div>

      {/* ── Body ── */}
      <div className="cal2-body">

        {/* ── Grid ── */}
        <div className="cal2-grid-wrap">
          {/* Day labels */}
          <div className="cal2-day-labels">
            {DAYS.map(d => <div key={d} className="cal2-day-label">{d}</div>)}
          </div>

          {/* Weeks */}
          <div className="cal2-grid">
            {weeks.map((week, wi) => (
              <div key={wi} className="cal2-week">
                {week.map((cell, ci) => {
                  const evs = cell.inMonth ? eventsOnDay(cell.day, month, year) : [];
                  const tod = cell.inMonth && isToday(cell.day);
                  const isSel = selected && selected.day === cell.day && selected.month === month && selected.year === year && cell.inMonth;
                  return (
                    <div
                      key={ci}
                      className={`cal2-cell${!cell.inMonth?' outside':''}${tod?' today':''}${isSel?' selected':''}`}
                      onClick={() => cell.inMonth && setSelected({ day: cell.day, month, year })}
                      onDoubleClick={() => cell.inMonth && openNew(cell.day, month, year)}
                    >
                      <span className={`cal2-cell-num${tod?' today-circle':''}`}>{cell.day}</span>
                      <div className="cal2-cell-events">
                        {evs.slice(0,3).map((ev, j) => (
                          <div
                            key={j}
                            className="cal2-ev-chip"
                            style={{ background: ev.color+'22', borderLeft: `3px solid ${ev.color}`, color: ev.color }}
                            onClick={e => { e.stopPropagation(); setDetailEv(ev); }}
                            title={ev.title}
                          >
                            <span className="cal2-ev-chip-title">{ev.title}</span>
                            <span className="cal2-ev-chip-time">{ev.time}</span>
                          </div>
                        ))}
                        {evs.length > 3 && (
                          <div className="cal2-ev-more">+{evs.length-3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="cal2-sidebar">

          {/* Mini calendar */}
          <div className="cal2-mini">
            <div className="cal2-mini-head">
              <span>{MONTHS[month].slice(0,3)} {year}</span>
            </div>
            <div className="cal2-mini-labels">
              {['S','M','T','W','T','F','S'].map((d,i) => <span key={i}>{d}</span>)}
            </div>
            <div className="cal2-mini-grid">
              {cells.map((c, i) => (
                <span
                  key={i}
                  className={`cal2-mini-num${!c.inMonth?' out':''}${c.inMonth&&isToday(c.day)?' tod':''}`}
                >
                  {c.day}
                </span>
              ))}
            </div>
          </div>

          {/* Upcoming events */}
          <div className="cal2-upcoming">
            <div className="cal2-upcoming-head">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Upcoming
            </div>
            {upcoming.length === 0
              ? <p className="cal2-upcoming-empty">No upcoming events</p>
              : upcoming.map(ev => (
                <div key={ev.id} className="cal2-upcoming-item" onClick={() => setDetailEv(ev)}>
                  <div className="cal2-upcoming-dot" style={{ background: ev.color }} />
                  <div className="cal2-upcoming-info">
                    <div className="cal2-upcoming-title">{ev.title}</div>
                    <div className="cal2-upcoming-meta">{ev.date} · {ev.time}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="cal2-overlay" onClick={() => { setModal(null); setForm(EMPTY_FORM); }}>
          <div className="cal2-modal" onClick={e => e.stopPropagation()}>
            <div className="cal2-modal-head">
              <h2>{modal === 'new' ? 'New Event' : 'Edit Event'}</h2>
              <button className="cal2-modal-close" onClick={() => { setModal(null); setForm(EMPTY_FORM); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="cal2-modal-body">
              <div className="cal2-field">
                <label>Event Title *</label>
                <input className="cal2-input" placeholder="e.g. Roof Inspection" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
              </div>
              <div className="cal2-field-row">
                <div className="cal2-field">
                  <label>Date *</label>
                  <input className="cal2-input" type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} />
                </div>
                <div className="cal2-field">
                  <label>Time</label>
                  <input className="cal2-input" placeholder="e.g. 9:00 AM" value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))} />
                </div>
              </div>
              <div className="cal2-field">
                <label>Color</label>
                <div className="cal2-color-row">
                  {EVENT_COLORS.map(c => (
                    <button
                      key={c}
                      className={`cal2-color-dot${form.color===c?' active':''}`}
                      style={{ background: c }}
                      onClick={() => setForm(f=>({...f,color:c}))}
                    />
                  ))}
                </div>
              </div>
              <div className="cal2-field">
                <label>Notes</label>
                <textarea className="cal2-input cal2-textarea" placeholder="Optional notes..." value={form.desc} onChange={e => setForm(f=>({...f,desc:e.target.value}))} />
              </div>
            </div>
            <div className="cal2-modal-foot">
              <button className="cal2-btn-cancel" onClick={() => { setModal(null); setForm(EMPTY_FORM); }}>Cancel</button>
              <button className="cal2-btn-save" onClick={saveEvent} disabled={!form.title.trim()||!form.date}>
                {modal === 'new' ? 'Create Event' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Event Detail ── */}
      {detailEv && (
        <div className="cal2-overlay" onClick={() => setDetailEv(null)}>
          <div className="cal2-modal cal2-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="cal2-modal-head" style={{ borderBottom: `3px solid ${detailEv.color}` }}>
              <h2>{detailEv.title}</h2>
              <button className="cal2-modal-close" onClick={() => setDetailEv(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="cal2-modal-body">
              <div className="cal2-detail-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{detailEv.date}</span>
              </div>
              {detailEv.time && (
                <div className="cal2-detail-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>{detailEv.time}</span>
                </div>
              )}
              {detailEv.desc && <p className="cal2-detail-desc">{detailEv.desc}</p>}
            </div>
            <div className="cal2-modal-foot">
              <button className="cal2-btn-danger" onClick={() => deleteEvent(detailEv.id)}>Delete</button>
              <button className="cal2-btn-cancel" onClick={() => setDetailEv(null)}>Close</button>
              <button className="cal2-btn-save" onClick={() => openEdit(detailEv)}>Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
