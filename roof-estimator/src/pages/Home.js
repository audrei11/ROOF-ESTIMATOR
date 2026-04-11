import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProjects } from '../utils/storage';
import { getAllMockProjects } from '../data/projectData';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getToday() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function getWeekDays() {
  const today = new Date();
  const day = today.getDay();
  const sun = new Date(today);
  sun.setDate(today.getDate() - day);
  const labels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return labels.map((label, i) => {
    const d = new Date(sun);
    d.setDate(sun.getDate() + i);
    return { label, date: d.getDate(), isToday: d.toDateString() === today.toDateString() };
  });
}

const PIPELINE_STAGES = [
  { id: 'new_lead',               label: 'New Lead',           color: '#94a3b8' },
  { id: 'appointment_scheduled',  label: 'Appointment',        color: '#60a5fa' },
  { id: 'proposal_sent',          label: 'Proposal Sent',      color: '#f59e0b' },
  { id: 'proposal_signed',        label: 'Signed',             color: '#a78bfa' },
  { id: 'work_in_progress',       label: 'In Progress',        color: '#34d399' },
  { id: 'completed',              label: 'Completed',          color: '#10b981' },
];

const QUICK_ACTIONS = [
  { label: 'New Measurement', icon: 'ruler',    path: '/measurements' },
  { label: 'New Proposal',    icon: 'file',     path: '/proposals/new' },
  { label: 'New Job',         icon: 'briefcase',path: '/jobs' },
  { label: 'New Contact',     icon: 'contacts', path: '/contacts' },
];

export default function Home() {
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(true);

  const projects = useMemo(() => {
    const all = [...getAllMockProjects(), ...getAllProjects()];
    const seen = new Set();
    return all.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
  }, []);

  // Pipeline counts
  const pipelineCounts = useMemo(() => {
    const counts = {};
    PIPELINE_STAGES.forEach(s => { counts[s.id] = 0; });
    projects.forEach(p => {
      const stage = p.pipelineStage || 'new_lead';
      if (counts[stage] !== undefined) counts[stage]++;
      else counts['new_lead']++;
    });
    return counts;
  }, [projects]);

  // Stats
  const stats = useMemo(() => {
    const activeJobs = projects.filter(p => p.pipelineStage === 'work_in_progress').length;
    const proposalsSent = projects.filter(p => p.pipelineStage === 'proposal_sent').length;
    const awaitingSignature = projects.filter(p => p.pipelineStage === 'proposal_signed').length;
    const totalLeads = projects.filter(p => !p.pipelineStage || p.pipelineStage === 'new_lead').length;
    return { activeJobs, proposalsSent, awaitingSignature, totalLeads };
  }, [projects]);

  // Recent projects (last 5)
  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''))
      .slice(0, 5);
  }, [projects]);

  const weekDays = getWeekDays();

  return (
    <div className="home-page">

      {/* ── Header ── */}
      <div className="home-header">
        <div className="home-greeting">
          <h1>{getGreeting()}, <span className="home-greeting-name">Andrei</span> 👋</h1>
          <p className="home-date">{getToday()}</p>
        </div>
        <div className="home-header-right">
          <button className="home-new-btn" onClick={() => navigate('/measurements')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Measurement
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="home-stats-grid">
        <StatCard
          label="Total Leads"
          value={stats.totalLeads}
          icon="users"
          color="#3b82f6"
          onClick={() => navigate('/jobs')}
        />
        <StatCard
          label="Proposals Sent"
          value={stats.proposalsSent}
          icon="file"
          color="#f59e0b"
          onClick={() => navigate('/proposals')}
        />
        <StatCard
          label="Awaiting Signature"
          value={stats.awaitingSignature}
          icon="pen"
          color="#a78bfa"
          onClick={() => navigate('/proposals')}
        />
        <StatCard
          label="Active Jobs"
          value={stats.activeJobs}
          icon="briefcase"
          color="#10b981"
          onClick={() => navigate('/jobs')}
        />
      </div>

      {/* ── Pipeline Overview ── */}
      <div className="home-section">
        <div className="home-section-header">
          <div>
            <h2 className="home-section-title">Job Pipeline</h2>
            <p className="home-section-sub">Overview of all jobs by stage</p>
          </div>
          <button className="home-view-all-btn" onClick={() => navigate('/jobs')}>
            View all →
          </button>
        </div>

        <div className="home-pipeline-grid">
          {PIPELINE_STAGES.map(stage => (
            <div
              key={stage.id}
              className="home-pipeline-card"
              style={{ borderTop: `3px solid ${stage.color}` }}
              onClick={() => navigate('/jobs')}
            >
              <div className="home-pipeline-count" style={{ color: stage.color }}>
                {pipelineCounts[stage.id] || 0}
              </div>
              <div className="home-pipeline-label">{stage.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="home-section">
        <h2 className="home-section-title">Quick Actions</h2>
        <div className="home-quick-actions">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.label}
              className="home-quick-btn"
              onClick={() => navigate(action.path)}
            >
              <QuickIcon type={action.icon} />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="home-section">
        <div className="home-section-header">
          <div>
            <h2 className="home-section-title">Recent Projects</h2>
            <p className="home-section-sub">Your latest measurements and jobs</p>
          </div>
          <button className="home-view-all-btn" onClick={() => navigate('/measurements')}>
            View all →
          </button>
        </div>

        <div className="home-recent-list">
          {recentProjects.length === 0 ? (
            <div className="home-empty">
              <p>No projects yet. Create your first measurement!</p>
              <button className="home-new-btn" onClick={() => navigate('/measurements')}>
                Get Started
              </button>
            </div>
          ) : (
            recentProjects.map(p => (
              <div
                key={p.id}
                className="home-recent-item"
                onClick={() => navigate(`/project/${p.id}`)}
              >
                <div className="home-recent-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div className="home-recent-info">
                  <span className="home-recent-address">{p.address || 'No address'}</span>
                  <span className="home-recent-meta">{p.createdAt || 'Unknown date'} · {p.assignee || 'Precision Roofing'}</span>
                </div>
                <StageBadge stage={p.pipelineStage || 'new_lead'} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Calendar ── */}
      {showCalendar && (
        <div className="home-section">
          <div className="home-section-header">
            <div>
              <h2 className="home-section-title">This Week</h2>
              <p className="home-section-sub">Your upcoming schedule</p>
            </div>
            <button className="home-hide-btn" onClick={() => setShowCalendar(false)}>
              Hide
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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p>No events scheduled</p>
            <button className="home-view-all-btn" onClick={() => navigate('/calendar')}>
              Open Calendar →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, onClick }) {
  return (
    <div className="home-stat-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="home-stat-icon" style={{ background: color + '20', color }}>
        <QuickIcon type={icon} size={20} />
      </div>
      <div className="home-stat-count">{value}</div>
      <div className="home-stat-label">{label}</div>
    </div>
  );
}

function StageBadge({ stage }) {
  const map = {
    new_lead:               { label: 'New Lead',    color: '#94a3b8' },
    appointment_scheduled:  { label: 'Appointment', color: '#60a5fa' },
    proposal_sent:          { label: 'Proposal Sent', color: '#f59e0b' },
    proposal_signed:        { label: 'Signed',      color: '#a78bfa' },
    work_in_progress:       { label: 'In Progress', color: '#34d399' },
    completed:              { label: 'Completed',   color: '#10b981' },
  };
  const s = map[stage] || map['new_lead'];
  return (
    <span className="home-stage-badge" style={{ background: s.color + '20', color: s.color }}>
      {s.label}
    </span>
  );
}

function QuickIcon({ type, size = 18 }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 };
  const icons = {
    ruler:     <svg {...s}><path d="M21 3H3v18h18V3zM9 3v18M15 3v18M3 9h18M3 15h18"/></svg>,
    file:      <svg {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    briefcase: <svg {...s}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    contacts:  <svg {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    pen:       <svg {...s}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    users:     <svg {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  };
  return icons[type] || null;
}
