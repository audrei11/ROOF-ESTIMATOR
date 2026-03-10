import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProjects } from '../utils/storage';
import { getAllMockProjects } from '../data/projectData';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

function getToday() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function getWeekDays() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const sun = new Date(today);
  sun.setDate(today.getDate() - day);
  const days = [];
  const labels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sun);
    d.setDate(sun.getDate() + i);
    days.push({
      label: labels[i],
      date: d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
    });
  }
  return days;
}

export default function Home() {
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(true);

  const projects = (() => {
    const all = [...getAllMockProjects(), ...getAllProjects()];
    const seen = new Set();
    return all.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
  })();

  const stats = {
    leads: projects.length,
    unopened: projects.filter(p => p.status !== 'ready').length > 0 ? 1 : 0,
    unsigned: 0,
    overdue: 0,
  };

  const weekDays = getWeekDays();

  const handleCreateNew = () => {
    const newId = Date.now().toString();
    navigate(`/project/${newId}`);
  };

  return (
    <div className="home-page">
      {/* Header */}
      <div className="home-header">
        <div className="home-greeting">
          <span className="home-greeting-icon">&#9749;</span>
          <h1>{getGreeting()}, welcome home</h1>
        </div>
        <div className="home-header-right">
          <button className="home-company-btn">
            Precision Roofing
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button className="home-new-btn" onClick={handleCreateNew}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            New
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Your Jobs section */}
      <div className="home-section">
        <h2 className="home-section-title">Your jobs</h2>
        <p className="home-section-sub">Some of your jobs may need a follow-up</p>

        <div className="home-stats-grid">
          <StatCard label="Unactioned leads" count={stats.leads} />
          <StatCard label="Unopened sent proposals" count={stats.unopened} amount={0} info />
          <StatCard label="Unsigned viewed proposals" count={stats.unsigned} amount={0} info />
          <StatCard label="Overdue invoices" count={stats.overdue} amount={0} />
        </div>
      </div>

      {/* Calendar section */}
      {showCalendar && (
        <div className="home-section">
          <div className="home-cal-header">
            <div>
              <h2 className="home-section-title">{getToday()}</h2>
              <p className="home-section-sub">Your upcoming events are displayed below</p>
            </div>
            <button className="home-hide-btn" onClick={() => setShowCalendar(false)}>
              Hide for now
            </button>
          </div>

          <div className="home-week">
            {weekDays.map(d => (
              <div key={d.label} className={`home-week-day ${d.isToday ? 'today' : ''}`}>
                <span className="home-week-label">{d.label}</span>
                <span className="home-week-date">{d.date}</span>
              </div>
            ))}
          </div>

          <div className="home-cal-empty">
            <p>No upcoming events</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, count, amount, info }) {
  return (
    <div className="home-stat-card">
      <div className="home-stat-label">
        {label}
        {info && (
          <svg className="home-stat-info" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        )}
      </div>
      <div className="home-stat-count">{count}</div>
      <div className="home-stat-bottom">
        {amount !== undefined && (
          <span className="home-stat-amount">${amount.toFixed(2)}</span>
        )}
        <svg className="home-stat-link" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </div>
    </div>
  );
}
