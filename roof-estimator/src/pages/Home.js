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
  { id: 'new_lead',              label: 'New Lead',      color: '#64748b', gradient: 'linear-gradient(135deg,#64748b22,#64748b08)' },
  { id: 'appointment_scheduled', label: 'Appointment',   color: '#3b82f6', gradient: 'linear-gradient(135deg,#3b82f622,#3b82f608)' },
  { id: 'proposal_sent',         label: 'Proposal Sent', color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b22,#f59e0b08)' },
  { id: 'proposal_signed',       label: 'Signed',        color: '#8b5cf6', gradient: 'linear-gradient(135deg,#8b5cf622,#8b5cf608)' },
  { id: 'work_in_progress',      label: 'In Progress',   color: '#06b6d4', gradient: 'linear-gradient(135deg,#06b6d422,#06b6d408)' },
  { id: 'completed',             label: 'Completed',     color: '#10b981', gradient: 'linear-gradient(135deg,#10b98122,#10b98108)' },
];

const QUICK_ACTIONS = [
  { label: 'New Measurement', desc: 'Measure a roof from map', icon: 'ruler',     path: '/measurements',  gradient: 'linear-gradient(135deg,#2563eb,#3b82f6)' },
  { label: 'New Proposal',    desc: 'Create & send a proposal', icon: 'file',      path: '/proposals/new', gradient: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' },
  { label: 'New Job',         desc: 'Add a job to pipeline',    icon: 'briefcase', path: '/jobs',          gradient: 'linear-gradient(135deg,#059669,#10b981)' },
  { label: 'New Contact',     desc: 'Add a customer contact',   icon: 'contacts',  path: '/contacts',      gradient: 'linear-gradient(135deg,#d97706,#f59e0b)' },
];

export default function Home() {
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(true);

  const projects = useMemo(() => {
    const all = [...getAllMockProjects(), ...getAllProjects()];
    const seen = new Set();
    return all.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
  }, []);

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

  const stats = useMemo(() => ({
    totalLeads:        projects.filter(p => !p.pipelineStage || p.pipelineStage === 'new_lead').length,
    proposalsSent:     projects.filter(p => p.pipelineStage === 'proposal_sent').length,
    awaitingSignature: projects.filter(p => p.pipelineStage === 'proposal_signed').length,
    activeJobs:        projects.filter(p => p.pipelineStage === 'work_in_progress').length,
  }), [projects]);

  const recentProjects = useMemo(() =>
    [...projects]
      .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''))
      .slice(0, 5),
  [projects]);

  const weekDays = getWeekDays();

  return (
    <div className="home-page">

      {/* ── Hero Banner ── */}
      <div className="home-hero">
        <div className="home-hero-bg" />
        <div className="home-hero-content">
          <div className="home-hero-left">
            <p className="home-hero-eyebrow">{getToday()}</p>
            <h1 className="home-hero-title">
              {getGreeting()}, <span className="home-hero-name">Andrei</span>
            </h1>
            <p className="home-hero-sub">Here's what's happening with your business today.</p>
          </div>
          <button className="home-hero-btn" onClick={() => navigate('/measurements')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Measurement
          </button>
        </div>

        {/* Hero stat pills */}
        <div className="home-hero-stats">
          <HeroStat label="Total Leads"      value={stats.totalLeads}        onClick={() => navigate('/jobs')} />
          <HeroStat label="Proposals Sent"   value={stats.proposalsSent}     onClick={() => navigate('/proposals')} />
          <HeroStat label="Awaiting Sign"    value={stats.awaitingSignature} onClick={() => navigate('/proposals')} />
          <HeroStat label="Active Jobs"      value={stats.activeJobs}        onClick={() => navigate('/jobs')} />
        </div>
      </div>

      <div className="home-body">

        {/* ── Quick Actions ── */}
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Quick Actions</h2>
          </div>
          <div className="home-quick-grid">
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} className="home-quick-card" onClick={() => navigate(a.path)}>
                <div className="home-quick-icon" style={{ background: a.gradient }}>
                  <QuickIcon type={a.icon} size={22} />
                </div>
                <div className="home-quick-info">
                  <span className="home-quick-label">{a.label}</span>
                  <span className="home-quick-desc">{a.desc}</span>
                </div>
                <svg className="home-quick-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            ))}
          </div>
        </section>

        {/* ── Pipeline ── */}
        <section className="home-section">
          <div className="home-section-header">
            <div>
              <h2 className="home-section-title">Job Pipeline</h2>
              <p className="home-section-sub">Track every job from lead to completion</p>
            </div>
            <button className="home-link-btn" onClick={() => navigate('/jobs')}>View all jobs →</button>
          </div>
          <div className="home-pipeline-grid">
            {PIPELINE_STAGES.map(stage => (
              <div
                key={stage.id}
                className="home-pipeline-card"
                style={{ background: stage.gradient, borderColor: stage.color + '30' }}
                onClick={() => navigate('/jobs')}
              >
                <div className="home-pipeline-top">
                  <span className="home-pipeline-dot" style={{ background: stage.color }} />
                  <span className="home-pipeline-label">{stage.label}</span>
                </div>
                <div className="home-pipeline-count" style={{ color: stage.color }}>
                  {pipelineCounts[stage.id] || 0}
                </div>
                <div className="home-pipeline-hint">jobs</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Recent Projects ── */}
        <section className="home-section">
          <div className="home-section-header">
            <div>
              <h2 className="home-section-title">Recent Projects</h2>
              <p className="home-section-sub">Your latest measurements and jobs</p>
            </div>
            <button className="home-link-btn" onClick={() => navigate('/measurements')}>View all →</button>
          </div>

          {recentProjects.length === 0 ? (
            <div className="home-empty-state">
              <div className="home-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <p className="home-empty-title">No projects yet</p>
              <p className="home-empty-sub">Start by creating your first roof measurement</p>
              <button className="home-hero-btn" onClick={() => navigate('/measurements')}>Get Started</button>
            </div>
          ) : (
            <div className="home-recent-list">
              {recentProjects.map((p, i) => (
                <div key={p.id} className="home-recent-item" onClick={() => navigate(`/project/${p.id}`)}>
                  <div className="home-recent-rank">{i + 1}</div>
                  <div className="home-recent-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <div className="home-recent-info">
                    <span className="home-recent-address">{p.address || 'No address'}</span>
                    <span className="home-recent-meta">{p.createdAt || '—'} · {p.assignee || 'Precision Roofing'}</span>
                  </div>
                  <StageBadge stage={p.pipelineStage || 'new_lead'} />
                  <svg className="home-recent-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── This Week ── */}
        {showCalendar && (
          <section className="home-section">
            <div className="home-section-header">
              <div>
                <h2 className="home-section-title">This Week</h2>
                <p className="home-section-sub">Your upcoming schedule</p>
              </div>
              <button className="home-link-btn muted" onClick={() => setShowCalendar(false)}>Hide</button>
            </div>

            <div className="home-week-card">
              <div className="home-week">
                {weekDays.map(d => (
                  <div key={d.label} className={`home-week-day ${d.isToday ? 'today' : ''}`}>
                    <span className="home-week-label">{d.label}</span>
                    <span className="home-week-date">{d.date}</span>
                    {d.isToday && <span className="home-week-today-dot" />}
                  </div>
                ))}
              </div>
              <div className="home-week-empty">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>No events — </span>
                <button className="home-link-btn inline" onClick={() => navigate('/calendar')}>Open Calendar</button>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

function HeroStat({ label, value, onClick }) {
  return (
    <div className="home-hero-stat" onClick={onClick}>
      <span className="home-hero-stat-value">{value}</span>
      <span className="home-hero-stat-label">{label}</span>
    </div>
  );
}

function StageBadge({ stage }) {
  const map = {
    new_lead:              { label: 'New Lead',      color: '#64748b' },
    appointment_scheduled: { label: 'Appointment',   color: '#3b82f6' },
    proposal_sent:         { label: 'Proposal Sent', color: '#f59e0b' },
    proposal_signed:       { label: 'Signed',        color: '#8b5cf6' },
    work_in_progress:      { label: 'In Progress',   color: '#06b6d4' },
    completed:             { label: 'Completed',     color: '#10b981' },
  };
  const s = map[stage] || map['new_lead'];
  return (
    <span className="home-stage-badge" style={{ background: s.color + '18', color: s.color, border: `1px solid ${s.color}30` }}>
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
