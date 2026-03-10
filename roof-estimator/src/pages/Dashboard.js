import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllMockProjects } from '../data/projectData';
import { getAllProjects, deleteProject } from '../utils/storage';
import JobDetailModal from '../components/JobDetailModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [projects, setProjects] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewJobProject, setViewJobProject] = useState(null);
  const [activeTab, setActiveTab] = useState('Reports');

  // Settings state
  const [pitchless, setPitchless] = useState(false);
  const [esxFallback, setEsxFallback] = useState(true);
  const [hideWaste, setHideWaste] = useState(false);
  const [hideMaterial, setHideMaterial] = useState(false);
  const [brandLogo, setBrandLogo] = useState('company');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  // Merge mock projects with saved localStorage projects
  useEffect(() => {
    const mockProjects = getAllMockProjects();
    const savedProjects = getAllProjects();

    // Merge: saved projects override mock projects with same ID
    const merged = [...mockProjects];
    savedProjects.forEach(saved => {
      const existingIdx = merged.findIndex(p => p.id === saved.id);
      if (existingIdx >= 0) {
        merged[existingIdx] = { ...merged[existingIdx], ...saved };
      } else {
        merged.push(saved);
      }
    });

    // Sort: most recently updated first
    merged.sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt || '';
      const dateB = b.updatedAt || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });

    setProjects(merged);
  }, []);

  const filtered = projects.filter(p => {
    const matchSearch = !search || (p.address || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleRowClick = (project) => {
    navigate(`/project/${project.id}`);
  };

  const handleDelete = (e, projectId) => {
    e.stopPropagation();
    if (window.confirm('Delete this project?')) {
      deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
    }
  };

  const handleCreateNew = () => {
    const newId = Date.now().toString();
    navigate(`/project/${newId}`);
  };

  return (
    <div className="dashboard">
      {/* Page Header */}
      <div className="dash-header">
        <div className="dash-header-left">
          <h1 className="dash-title">Measurements</h1>
        </div>
        <div className="dash-header-right">
          <button className="dash-more-btn" title="More options">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
          <button className="dash-btn-outline" onClick={handleCreateNew}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Create DIY
          </button>
          <button className="dash-btn-primary" onClick={handleCreateNew}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Order report
          </button>
        </div>
      </div>

      {/* Tabs & credits */}
      <div className="dash-tabs-row">
        <div className="dash-tabs">
          <button
            className={`dash-tab ${activeTab === 'Reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('Reports')}
          >
            Reports
          </button>
          <button
            className={`dash-tab ${activeTab === 'Settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('Settings')}
          >
            Settings
          </button>
        </div>
        <div className="dash-credits">
          <span>Roofr Report credits: <strong>0</strong></span>
          <span>Image credits: <strong>0</strong> <a href="#add" className="dash-link">Add</a></span>
        </div>
      </div>

      {/* ─── Reports tab ─── */}
      {activeTab === 'Reports' && (
        <>
          {/* Search & filter */}
          <div className="dash-filters">
            <div className="dash-search-wrap">
              <svg className="dash-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                className="dash-search"
                placeholder="Search by address"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="dash-filter-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              <select
                className="dash-filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="All">Type</option>
                <option value="All">Reset to default</option>
                <option value="Roofr">Roofr</option>
                <option value="DIY">DIY</option>
                <option value="Multi-building">Multi-building</option>
                <option value="ESX">ESX</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Customer name</th>
                  <th>Assignee</th>
                  <th>Created</th>
                  <th>Completed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => {
                  return (
                    <tr key={project.id} onClick={() => handleRowClick(project)} className="dash-row">
                      <td className="dash-address">
                        <span className="dash-address-text">{project.address || 'No address'}</span>
                        {project.reportCount > 0 && (
                          <span className="dash-report-badge">{project.reportCount}</span>
                        )}
                        <span className="dash-address-icons">
                          <button className="dash-icon-btn" onClick={e => e.stopPropagation()} title="Copy">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                          </button>
                          <button className="dash-icon-btn" onClick={e => e.stopPropagation()} title="Open in new tab">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                          </button>
                          <button className="dash-icon-btn" onClick={e => e.stopPropagation()} title="Share">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                            </svg>
                          </button>
                        </span>
                      </td>
                      <td>
                        <button
                          className="dash-add-customer-link"
                          onClick={e => e.stopPropagation()}
                        >
                          Add customer
                        </button>
                      </td>
                      <td className="dash-assignee">{project.assignee || 'Precision Roofing'}</td>
                      <td className="dash-created">
                        <span className="dash-created-date">{project.createdAt || '-'}</span>
                        {project.createdBy && (
                          <span className="dash-created-by">by {project.createdBy}</span>
                        )}
                      </td>
                      <td className="dash-completed">{project.completedAt || '-'}</td>
                      <td className="dash-menu-cell">
                        <div className="dash-menu-wrapper">
                          <button
                            className="dash-more-actions-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === project.id ? null : project.id);
                            }}
                            title="More actions"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                            </svg>
                          </button>
                          {openMenuId === project.id && (
                            <div className="dash-dropdown-menu">
                              <button className="dash-dropdown-item" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}>
                                Add customer
                              </button>
                              <button className="dash-dropdown-item" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setViewJobProject(project); }}>
                                View job
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="dash-empty">
                      No projects found. Try a different search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── Settings tab ─── */}
      {activeTab === 'Settings' && (
        <div className="dash-settings">
          {/* Report delivery */}
          <div className="dash-settings-section">
            <h3 className="dash-settings-heading">Report delivery</h3>
            <div className="dash-settings-options">
              <div className="dash-settings-toggle-row">
                <div className="dash-settings-toggle-info">
                  <span className="dash-settings-toggle-label">Receive pitchless reports if pitch data is not available</span>
                  <span className="dash-settings-toggle-desc">In cases where pitch data is unavailable, we will deliver the Roofr report without pitch</span>
                </div>
                <button
                  className={`dash-toggle ${pitchless ? 'on' : ''}`}
                  onClick={() => setPitchless(!pitchless)}
                >
                  <div className="dash-toggle-thumb"></div>
                </button>
              </div>

              <div className="dash-settings-toggle-row">
                <div className="dash-settings-toggle-info">
                  <span className="dash-settings-toggle-label">Receive Roofr report if ESX file cannot be delivered</span>
                  <span className="dash-settings-toggle-desc">If we're unable to process an ESX file, we'll provide the Roofr report and issue a refund for the add-on</span>
                </div>
                <button
                  className={`dash-toggle ${esxFallback ? 'on' : ''}`}
                  onClick={() => setEsxFallback(!esxFallback)}
                >
                  <div className="dash-toggle-thumb"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Waste recommendations & material calculations */}
          <div className="dash-settings-section">
            <h3 className="dash-settings-heading">Waste recommendations &amp; material calculations</h3>
            <div className="dash-settings-options">
              <div className="dash-settings-toggle-row">
                <div className="dash-settings-toggle-info">
                  <span className="dash-settings-toggle-label">Hide waste recommendation on reports</span>
                </div>
                <button
                  className={`dash-toggle ${hideWaste ? 'on' : ''}`}
                  onClick={() => setHideWaste(!hideWaste)}
                >
                  <div className="dash-toggle-thumb"></div>
                </button>
              </div>

              <div className="dash-settings-toggle-row">
                <div className="dash-settings-toggle-info">
                  <span className="dash-settings-toggle-label">Hide material calculations on reports</span>
                </div>
                <button
                  className={`dash-toggle ${hideMaterial ? 'on' : ''}`}
                  onClick={() => setHideMaterial(!hideMaterial)}
                >
                  <div className="dash-toggle-thumb"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Report branding */}
          <div className="dash-settings-section">
            <h3 className="dash-settings-heading">Report branding</h3>
            <p className="dash-settings-subtitle">Customize your reports by adding your own logo</p>

            <div className="dash-branding-cards">
              {/* Company logo card */}
              <div
                className={`dash-branding-card ${brandLogo === 'company' ? 'selected' : ''}`}
                onClick={() => setBrandLogo('company')}
              >
                <div className="dash-branding-preview">
                  <div className="dash-branding-logo-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <span className="dash-branding-logo-text">Roofing<br/>Company<br/>Logo</span>
                  </div>
                  <div className="dash-branding-line long"></div>
                  <div className="dash-branding-line medium"></div>
                  <div className="dash-branding-line short"></div>
                </div>
                <div className="dash-branding-footer">
                  <label className="dash-branding-radio">
                    <input
                      type="radio"
                      name="brandLogo"
                      checked={brandLogo === 'company'}
                      onChange={() => setBrandLogo('company')}
                    />
                    <span className="dash-branding-radio-circle"></span>
                    Company logo
                  </label>
                  <a href="#change" className="dash-branding-change-link">
                    Add/change
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Roofr logo card */}
              <div
                className={`dash-branding-card ${brandLogo === 'roofr' ? 'selected' : ''}`}
                onClick={() => setBrandLogo('roofr')}
              >
                <div className="dash-branding-preview">
                  <div className="dash-branding-roofr-logo">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    </svg>
                    <span className="dash-branding-roofr-text">roofr</span>
                  </div>
                  <div className="dash-branding-line long"></div>
                  <div className="dash-branding-line medium"></div>
                  <div className="dash-branding-line short"></div>
                </div>
                <div className="dash-branding-footer">
                  <label className="dash-branding-radio">
                    <input
                      type="radio"
                      name="brandLogo"
                      checked={brandLogo === 'roofr'}
                      onChange={() => setBrandLogo('roofr')}
                    />
                    <span className="dash-branding-radio-circle"></span>
                    Roofr logo
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job detail modal */}
      {viewJobProject && (
        <JobDetailModal
          project={viewJobProject}
          onClose={() => setViewJobProject(null)}
        />
      )}
    </div>
  );
}
