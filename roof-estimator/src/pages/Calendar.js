import React, { useState, useMemo, useCallback } from 'react';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SAMPLE_EVENTS = [
  { id: 1, title: 'Client Meeting', time: '4:30pm' },
  { id: 2, title: 'Roof Inspection', time: '9:00am' },
  { id: 3, title: 'Material Delivery', time: '11:00am' },
  { id: 4, title: 'Estimate Visit', time: '2:00pm' },
  { id: 5, title: 'Crew Standup', time: '8:00am' },
  { id: 6, title: 'Full Install', time: '7:00am' },
  { id: 7, title: 'Follow-up Call', time: '3:30pm' },
  { id: 8, title: 'Warranty Repair', time: '10:00am' },
];

function getEventsForDay(day, month, year) {
  const seed = day * 31 + month * 13 + year;
  const events = [];
  if (seed % 5 === 0) events.push(SAMPLE_EVENTS[seed % SAMPLE_EVENTS.length]);
  if (seed % 11 === 0) events.push(SAMPLE_EVENTS[(seed + 3) % SAMPLE_EVENTS.length]);
  return events;
}

/* ---- Mini Calendar (right sidebar) ---- */
function MiniCalendar({ month, year, today }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = startDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, inMonth: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, inMonth: true });
  const miniTotal = Math.ceil(cells.length / 7) * 7;
  const remaining = miniTotal - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, inMonth: false });

  const isToday = (day) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="cal-mini">
      <div className="cal-mini-header">
        <span className="cal-mini-title">{MONTHS[month]} {year}</span>
        <div className="cal-mini-arrows">
          {/* Arrows are decorative for now */}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
      <div className="cal-mini-days">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <span key={d} className="cal-mini-day-label">{d}</span>
        ))}
      </div>
      <div className="cal-mini-grid">
        {cells.map((c, i) => (
          <span
            key={i}
            className={`cal-mini-cell${!c.inMonth ? ' outside' : ''}${c.inMonth && isToday(c.day) ? ' today' : ''}`}
          >
            {c.day}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---- Main Calendar ---- */
export default function Calendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const { daysInMonth, startDay, prevMonthDays } = useMemo(() => {
    const dim = new Date(currentYear, currentMonth + 1, 0).getDate();
    const sd = new Date(currentYear, currentMonth, 1).getDay();
    const pmd = new Date(currentYear, currentMonth, 0).getDate();
    return { daysInMonth: dim, startDay: sd, prevMonthDays: pmd };
  }, [currentMonth, currentYear]);

  const isToday = useCallback((day) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear(),
  [currentMonth, currentYear, today]);

  const goToPrev = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const goToNext = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };
  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const cells = [];
  for (let i = startDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, inMonth: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, inMonth: true });
  const totalNeeded = Math.ceil(cells.length / 7) * 7;
  const remaining = totalNeeded - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, inMonth: false });

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="cal-page">
      {/* ---- Top Bar ---- */}
      <div className="cal-topbar">
        <div className="cal-topbar-left">
          <h1 className="cal-title">{MONTHS[currentMonth]}, {currentYear}</h1>
          <button className="cal-today-btn" onClick={goToToday}>Today</button>
          <div className="cal-nav-arrows">
            <button className="cal-arrow" onClick={goToPrev} aria-label="Previous month">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button className="cal-arrow" onClick={goToNext} aria-label="Next month">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
        <div className="cal-topbar-right">
          <button className="cal-settings-btn" aria-label="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <div className="cal-view-dropdown">
            <span>Monthly</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <button className="cal-event-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Event
          </button>
        </div>
      </div>

      {/* ---- Body: grid + sidebar ---- */}
      <div className="cal-body">
        {/* Left — calendar grid */}
        <div className="cal-grid-wrap">
          <div className="cal-day-headers">
            {DAYS.map(d => <div key={d} className="cal-day-header">{d}</div>)}
          </div>
          <div className="cal-grid">
            {weeks.map((week, wi) => (
              <div key={wi} className="cal-week-row">
                {week.map((cell, ci) => {
                  const events = cell.inMonth ? getEventsForDay(cell.day, currentMonth, currentYear) : [];
                  const isTod = cell.inMonth && isToday(cell.day);
                  return (
                    <div
                      key={ci}
                      className={`cal-cell${!cell.inMonth ? ' outside' : ''}${isTod ? ' today' : ''}`}
                    >
                      <span className={`cal-cell-num${isTod ? ' today-num' : ''}`}>{cell.day}</span>
                      {events.length > 0 && (
                        <div className="cal-cell-events">
                          {events.slice(0, 2).map((ev, j) => (
                            <div key={j} className="cal-cell-event">
                              <span className="cal-ev-title">{ev.title}</span>
                              <span className="cal-ev-time">{ev.time}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right — sidebar */}
        <div className="cal-sidebar">
          {/* Promo card */}
          <div className="cal-promo">
            <span className="cal-promo-badge">New!</span>
            <h3 className="cal-promo-title">Roofr Calendar</h3>
            <p className="cal-promo-text">
              Track jobs and deadlines right inside Roofr. Upgrade to Premium to unlock the calendar. (Google Calendar sync now available in Elite.)
            </p>
            <button className="cal-promo-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Upgrade to Premium
            </button>
          </div>

          {/* Mini calendar */}
          <MiniCalendar month={currentMonth} year={currentYear} today={today} />
        </div>
      </div>

      {/* Sidebar collapse chevron */}
      <button className="cal-sidebar-toggle" aria-label="Toggle sidebar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
    </div>
  );
}
