import { useState } from 'react';

const TABS = ['Job Report', 'Overview', 'Workflow'];

/* ── Mock enriched job data ── */
const MOCK_JOBS = [
  { id: 'j1', contact: 'Kelly Moore',     address: '515 Delbrick Ln',         status: 'completed',  value: 8400,  date: '2026-03-12', type: 'Shingle Replacement' },
  { id: 'j2', contact: 'Biak Lian',       address: '7634 Cynthia Dr',         status: 'proposal_sent', value: 12500, date: '2026-03-28', type: 'Full Roof Replacement' },
  { id: 'j3', contact: 'Paul Dorian',     address: '8701 North Rd',           status: 'completed',  value: 5200,  date: '2026-02-20', type: 'Roof Repair' },
  { id: 'j4', contact: 'Hazel Utley',     address: '2745 Station Rd',         status: 'work_in_progress', value: 9800, date: '2026-04-01', type: 'Shingle Replacement' },
  { id: 'j5', contact: 'Crystal Wheeler', address: '2722 Station St',         status: 'new_lead',   value: 7600,  date: '2026-04-05', type: 'Inspection' },
  { id: 'j6', contact: 'Ira&Kath',        address: '5530 Smoketree Ln',       status: 'completed',  value: 15200, date: '2026-02-05', type: 'Full Roof Replacement' },
  { id: 'j7', contact: 'John Martinez',   address: '3310 Maple Ave',          status: 'completed',  value: 6300,  date: '2026-01-18', type: 'Roof Repair' },
  { id: 'j8', contact: 'Sandra Kim',      address: '910 Riverside Dr',        status: 'proposal_signed', value: 11400, date: '2026-04-08', type: 'Shingle Replacement' },
];

const MONTHLY_REVENUE = [
  { month: 'Oct', value: 18400 },
  { month: 'Nov', value: 22100 },
  { month: 'Dec', value: 14800 },
  { month: 'Jan', value: 21500 },
  { month: 'Feb', value: 32700 },
  { month: 'Mar', value: 28900 },
  { month: 'Apr', value: 19800 },
];

const STATUS_MAP = {
  new_lead:              { label: 'New Lead',      color: '#64748b' },
  appointment_scheduled: { label: 'Appointment',   color: '#3b82f6' },
  proposal_sent:         { label: 'Proposal Sent', color: '#f59e0b' },
  proposal_signed:       { label: 'Signed',        color: '#8b5cf6' },
  work_in_progress:      { label: 'In Progress',   color: '#06b6d4' },
  completed:             { label: 'Completed',     color: '#10b981' },
};

function fmt(n) { return '$' + n.toLocaleString(); }

export default function Performance() {
  const [activeTab, setActiveTab] = useState('Job Report');
  const [jobFilter, setJobFilter] = useState('all');
  const [sortCol, setSortCol] = useState('date');
  const [sortAsc, setSortAsc] = useState(false);

  const jobs = MOCK_JOBS;
  const completed  = jobs.filter(j => j.status === 'completed');
  const totalRev   = completed.reduce((s, j) => s + j.value, 0);
  const avgValue   = completed.length ? Math.round(totalRev / completed.length) : 0;
  const winRate    = jobs.length ? Math.round((completed.length / jobs.length) * 100) : 0;
  const pipeline   = jobs.filter(j => j.status !== 'completed' && j.status !== 'new_lead');

  const filteredJobs = jobs
    .filter(j => jobFilter === 'all' || j.status === jobFilter)
    .sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === 'value') return sortAsc ? va - vb : vb - va;
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  const maxRevenue = Math.max(...MONTHLY_REVENUE.map(m => m.value));

  const handleSort = (col) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(false); }
  };

  return (
    <div className="perf-page">
      <div className="perf-header">
        <h1 className="perf-title">Performance</h1>
      </div>

      {/* Tabs */}
      <div className="perf-tabs">
        {TABS.map(tab => (
          <button key={tab} className={`perf-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {/* ══ JOB REPORT ══ */}
      {activeTab === 'Job Report' && (
        <div className="perf-content">
          {/* Summary cards */}
          <div className="perf-summary-grid">
            <SummaryCard label="Total Revenue"   value={fmt(totalRev)}        sub="from completed jobs"  color="#10b981" icon="dollar" />
            <SummaryCard label="Jobs Completed"  value={completed.length}     sub={`of ${jobs.length} total`} color="#3b82f6" icon="check" />
            <SummaryCard label="Avg Job Value"   value={fmt(avgValue)}        sub="per completed job"    color="#8b5cf6" icon="tag" />
            <SummaryCard label="Pipeline Value"  value={fmt(pipeline.reduce((s,j)=>s+j.value,0))} sub="in active jobs" color="#f59e0b" icon="trending" />
          </div>

          {/* Filter bar */}
          <div className="perf-filter-bar">
            <span className="perf-filter-label">Filter:</span>
            {['all', 'completed', 'work_in_progress', 'proposal_sent', 'new_lead'].map(f => (
              <button
                key={f}
                className={`perf-filter-chip ${jobFilter === f ? 'active' : ''}`}
                onClick={() => setJobFilter(f)}
                style={jobFilter === f && f !== 'all' ? { background: (STATUS_MAP[f]?.color || '#2563eb') + '18', color: STATUS_MAP[f]?.color || '#2563eb', borderColor: (STATUS_MAP[f]?.color || '#2563eb') + '40' } : {}}
              >
                {f === 'all' ? 'All Jobs' : STATUS_MAP[f]?.label || f}
              </button>
            ))}
            <span className="perf-filter-count">{filteredJobs.length} jobs</span>
          </div>

          {/* Table */}
          <div className="perf-table-wrap">
            <table className="perf-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('contact')} className="sortable">Contact <SortIcon active={sortCol==='contact'} asc={sortAsc}/></th>
                  <th>Type</th>
                  <th onClick={() => handleSort('value')} className="sortable">Value <SortIcon active={sortCol==='value'} asc={sortAsc}/></th>
                  <th onClick={() => handleSort('date')} className="sortable">Date <SortIcon active={sortCol==='date'} asc={sortAsc}/></th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(j => {
                  const s = STATUS_MAP[j.status] || STATUS_MAP['new_lead'];
                  return (
                    <tr key={j.id}>
                      <td>
                        <div className="perf-contact-cell">
                          <div className="perf-avatar">{j.contact.charAt(0)}</div>
                          <div>
                            <div className="perf-contact-name">{j.contact}</div>
                            <div className="perf-contact-addr">{j.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="perf-type-cell">{j.type}</td>
                      <td className="perf-value-cell">{fmt(j.value)}</td>
                      <td className="perf-date-cell">{new Date(j.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td>
                        <span className="perf-status-badge" style={{ background: s.color + '18', color: s.color }}>
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ OVERVIEW / ANALYTICS ══ */}
      {activeTab === 'Overview' && (
        <div className="perf-content">
          {/* Top metrics */}
          <div className="perf-summary-grid">
            <SummaryCard label="Total Revenue"   value={fmt(totalRev)}   sub="all time" color="#10b981" icon="dollar" />
            <SummaryCard label="Win Rate"        value={`${winRate}%`}   sub="leads to completed" color="#3b82f6" icon="trending" />
            <SummaryCard label="Avg Job Value"   value={fmt(avgValue)}   sub="per job" color="#8b5cf6" icon="tag" />
            <SummaryCard label="Active Pipeline" value={pipeline.length} sub="jobs in progress" color="#f59e0b" icon="briefcase" />
          </div>

          <div className="perf-charts-grid">
            {/* Revenue bar chart */}
            <div className="perf-chart-card">
              <div className="perf-chart-header">
                <div>
                  <h3 className="perf-chart-title">Monthly Revenue</h3>
                  <p className="perf-chart-sub">Last 7 months</p>
                </div>
                <span className="perf-chart-total">{fmt(MONTHLY_REVENUE.reduce((s,m)=>s+m.value,0))}</span>
              </div>
              <div className="perf-bar-chart">
                {MONTHLY_REVENUE.map(m => {
                  const pct = Math.round((m.value / maxRevenue) * 100);
                  return (
                    <div key={m.month} className="perf-bar-col">
                      <span className="perf-bar-value">{fmt(m.value).replace('$','$')}</span>
                      <div className="perf-bar-track">
                        <div className="perf-bar-fill" style={{ height: `${pct}%` }} />
                      </div>
                      <span className="perf-bar-label">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Win Rate donut */}
            <div className="perf-chart-card perf-chart-card-sm">
              <div className="perf-chart-header">
                <div>
                  <h3 className="perf-chart-title">Win Rate</h3>
                  <p className="perf-chart-sub">Leads converted to jobs</p>
                </div>
              </div>
              <div className="perf-donut-wrap">
                <DonutChart value={winRate} color="#3b82f6" />
                <div className="perf-donut-legend">
                  <LegendItem color="#10b981" label="Completed" count={completed.length} />
                  <LegendItem color="#f59e0b" label="In Progress" count={pipeline.length} />
                  <LegendItem color="#94a3b8" label="Leads" count={jobs.filter(j=>j.status==='new_lead').length} />
                </div>
              </div>
            </div>

            {/* Jobs by type */}
            <div className="perf-chart-card">
              <div className="perf-chart-header">
                <div>
                  <h3 className="perf-chart-title">Revenue by Job Type</h3>
                  <p className="perf-chart-sub">Breakdown of earnings</p>
                </div>
              </div>
              <div className="perf-hbar-list">
                {Object.entries(
                  jobs.reduce((acc, j) => {
                    acc[j.type] = (acc[j.type] || 0) + j.value;
                    return acc;
                  }, {})
                ).sort((a,b) => b[1]-a[1]).map(([type, val], i) => {
                  const colors = ['#3b82f6','#10b981','#8b5cf6','#f59e0b'];
                  const maxV = Math.max(...jobs.reduce((acc,j)=>{ acc[j.type]=(acc[j.type]||0)+j.value; return acc; },{}) && Object.values(jobs.reduce((acc,j)=>{ acc[j.type]=(acc[j.type]||0)+j.value; return acc; },{})));
                  const pct = Math.round((val / maxV) * 100);
                  return (
                    <div key={type} className="perf-hbar-row">
                      <span className="perf-hbar-label">{type}</span>
                      <div className="perf-hbar-track">
                        <div className="perf-hbar-fill" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                      </div>
                      <span className="perf-hbar-value">{fmt(val)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pipeline stages */}
            <div className="perf-chart-card perf-chart-card-sm">
              <div className="perf-chart-header">
                <div>
                  <h3 className="perf-chart-title">Pipeline Stages</h3>
                  <p className="perf-chart-sub">Jobs per stage</p>
                </div>
              </div>
              <div className="perf-stage-list">
                {Object.entries(STATUS_MAP).map(([key, s]) => {
                  const count = jobs.filter(j => j.status === key).length;
                  const pct = jobs.length ? Math.round((count / jobs.length) * 100) : 0;
                  return (
                    <div key={key} className="perf-stage-row">
                      <div className="perf-stage-info">
                        <span className="perf-stage-dot" style={{ background: s.color }} />
                        <span className="perf-stage-label">{s.label}</span>
                        <span className="perf-stage-count">{count}</span>
                      </div>
                      <div className="perf-stage-bar">
                        <div style={{ width: `${pct}%`, height: '100%', background: s.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ WORKFLOW / PIPELINE — coming soon ══ */}
      {(activeTab === 'Workflow' || activeTab === 'Pipeline') && (
        <div className="perf-coming-soon">
          <div className="perf-coming-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h3>Coming Soon</h3>
          <p>{activeTab} analytics will be available in a future update.</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, color, icon }) {
  const icons = {
    dollar:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    check:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    tag:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    trending: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    briefcase:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  };
  return (
    <div className="perf-summary-card">
      <div className="perf-summary-icon" style={{ background: color + '18', color }}>
        {icons[icon]}
      </div>
      <div className="perf-summary-value">{value}</div>
      <div className="perf-summary-label">{label}</div>
      <div className="perf-summary-sub">{sub}</div>
    </div>
  );
}

function DonutChart({ value, color }) {
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div className="perf-donut">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="14"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="perf-donut-center">
        <span className="perf-donut-pct">{value}%</span>
        <span className="perf-donut-sub">win rate</span>
      </div>
    </div>
  );
}

function LegendItem({ color, label, count }) {
  return (
    <div className="perf-legend-item">
      <span className="perf-legend-dot" style={{ background: color }} />
      <span className="perf-legend-label">{label}</span>
      <span className="perf-legend-count">{count}</span>
    </div>
  );
}

function SortIcon({ active, asc }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#2563eb' : 'currentColor'} strokeWidth="2"
      style={{ marginLeft: 3, opacity: active ? 1 : 0.35 }}
    >
      {active && asc  ? <path d="M8 15l4 4 4-4M12 5v14"/> :
       active && !asc ? <path d="M8 9l4-4 4 4M12 19V5"/> :
       <><path d="M8 9l4-4 4 4"/><path d="M8 15l4 4 4-4"/></>}
    </svg>
  );
}
