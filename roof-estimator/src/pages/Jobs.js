import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProjects } from '../utils/storage';
import { getAllMockProjects } from '../data/projectData';

const COLUMNS = [
  { id: 'new_lead', label: 'New lead' },
  { id: 'appointment_scheduled', label: 'Appointment scheduled' },
  { id: 'proposal_sent', label: 'Proposal sent/presented' },
  { id: 'proposal_signed', label: 'Proposal signed' },
  { id: 'work_in_progress', label: 'Work in progress' },
  { id: 'completed', label: 'Completed' },
];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(1, Math.floor(diff / 86400000));
}

export default function Jobs() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [viewTab, setViewTab] = useState('board');

  // Load all projects and assign them to the "new_lead" column by default
  const allProjects = [...getAllMockProjects(), ...getAllProjects()];
  // Deduplicate by id
  const seen = new Set();
  const projects = allProjects.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  const filtered = projects.filter(p => {
    if (!search) return true;
    return (p.address || '').toLowerCase().includes(search.toLowerCase());
  });

  // Group by pipeline stage (all go to new_lead for now since we don't have pipeline data)
  const grouped = {};
  COLUMNS.forEach(c => { grouped[c.id] = []; });
  filtered.forEach(p => {
    const stage = p.pipelineStage || 'new_lead';
    if (grouped[stage]) grouped[stage].push(p);
    else grouped['new_lead'].push(p);
  });

  const columnTotal = (colId) => {
    return grouped[colId].reduce((sum, p) => sum + (p.totalValue || 0), 0);
  };

  const handleCreateNew = () => {
    const newId = Date.now().toString();
    navigate(`/project/${newId}`);
  };

  return (
    <div className="jobs-page">
      {/* Tabs */}
      <div className="jobs-tabs-row">
        <div className="jobs-tabs">
          <button
            className={`jobs-tab ${viewTab === 'board' ? 'active' : ''}`}
            onClick={() => setViewTab('board')}
          >
            Board view
          </button>
          <button
            className={`jobs-tab ${viewTab === 'list' ? 'active' : ''}`}
            onClick={() => setViewTab('list')}
          >
            List view
          </button>
          <button className="jobs-tab">Settings</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="jobs-toolbar">
        <div className="jobs-search-wrap">
          <svg className="jobs-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="jobs-search"
            placeholder="Search jobs"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="jobs-toolbar-right">
          <button className="jobs-filter-btn">
            All workflows
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button className="jobs-filter-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filters & sort
          </button>
          <button className="jobs-new-btn" onClick={handleCreateNew}>
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

      {/* Kanban Board */}
      <div className="jobs-board">
        {COLUMNS.map(col => (
          <div key={col.id} className="jobs-column">
            <div className="jobs-col-header">
              <span className="jobs-col-title">
                {col.label} ({grouped[col.id].length})
              </span>
              <span className="jobs-col-amount">
                ${columnTotal(col.id).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="jobs-col-body">
              {grouped[col.id].map(project => {
                const days = daysSince(project.createdAt);
                const updated = timeAgo(project.updatedAt || project.createdAt);
                const sections = project.polygons ? project.polygons.length : 0;
                return (
                  <div
                    key={project.id}
                    className="jobs-card"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    <div className="jobs-card-address">
                      {project.address || 'No address'}
                    </div>
                    {sections > 1 && (
                      <span className="jobs-card-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        </svg>
                        Multiple
                      </span>
                    )}
                    <div className="jobs-card-footer">
                      <span className="jobs-card-days">
                        {days ? `${days} days` : ''}
                      </span>
                      <span className="jobs-card-updated">
                        {updated ? `Updated ${updated}` : ''}
                      </span>
                      <span className="jobs-card-avatar">TR</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
