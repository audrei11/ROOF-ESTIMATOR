import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════════════
   Proposals — Lists all proposals from the database
   ─────────────────────────────────────────────────────────────────────────
   Fetches from GET /api/proposals (Express → SQLite)
   Status badges: Draft, Sent, Viewed, Signed
   ═══════════════════════════════════════════════════════════════════════════ */

const API = '/api/proposals';

export default function Proposals() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('proposals');
  const [viewMode, setViewMode] = useState('grid');
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch proposals from database
  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = () => {
    setLoading(true);
    fetch(API)
      .then(r => r.json())
      .then(data => {
        setProposals(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setProposals([]);
        setLoading(false);
      });
  };

  // Delete a proposal
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this proposal?')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    fetchProposals();
  };

  // Copy public link
  const handleCopyLink = (e, id) => {
    e.stopPropagation();
    const link = `${window.location.origin}/p/${id}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('Proposal link copied to clipboard!\n\n' + link);
    });
  };

  // Calculate total from options
  const calcTotal = (p) => {
    const opts = p.options || [];
    if (!opts.length) return 0;
    return opts[0].lineItems?.reduce((s, li) => s + (li.qty * li.unitPrice), 0) || 0;
  };

  // Filter proposals
  const filtered = proposals.filter(p => {
    const matchSearch = !search ||
      (p.address || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.customer_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Status counts
  const counts = { all: proposals.length };
  proposals.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });

  return (
    <div className="prop-page">
      {/* Header */}
      <div className="prop-header">
        <h1 className="prop-title">Proposals</h1>
        <button className="prop-new-btn" onClick={() => navigate('/proposals/new')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Proposal
        </button>
      </div>

      {/* Tabs */}
      <div className="prop-tabs">
        <button className={`prop-tab ${activeTab === 'proposals' ? 'active' : ''}`}
          onClick={() => setActiveTab('proposals')}>Proposals</button>
        <button className={`prop-tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}>Templates</button>
        <button className={`prop-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}>Settings</button>
      </div>

      {/* Status filter pills */}
      <div className="prop-status-filters">
        {[
          { key: 'all', label: 'All' },
          { key: 'draft', label: 'Draft' },
          { key: 'sent', label: 'Sent' },
          { key: 'viewed', label: 'Viewed' },
          { key: 'signed', label: 'Signed' },
        ].map(f => (
          <button
            key={f.key}
            className={`prop-status-pill ${statusFilter === f.key ? 'active' : ''}`}
            onClick={() => setStatusFilter(f.key)}
          >
            {f.label} {counts[f.key] ? `(${counts[f.key]})` : ''}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="prop-toolbar">
        <div className="prop-search-wrap">
          <svg className="prop-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="prop-search"
            placeholder="Search by customer or address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="prop-view-toggle">
          <button className={`prop-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button className={`prop-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && <div className="prop-empty">Loading proposals...</div>}

      {/* Proposal list */}
      {!loading && (
        <div className="prop-list">
          {filtered.map(p => {
            const total = calcTotal(p);
            const date = p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
            }) : '';

            return (
              <div key={p.id} className="prop-card"
                onClick={() => p.status === 'draft' ? navigate(`/proposals/new?edit=${p.id}`) : null}
                style={{ cursor: p.status === 'draft' ? 'pointer' : 'default' }}>
                <div className="prop-card-thumb">
                  <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                    <rect width="48" height="48" fill="#e0f2fe" rx="6"/>
                    <path d="M14 14h20v20H14z" stroke="#0284c7" strokeWidth="2" fill="none"/>
                    <path d="M14 22h20M22 14v20" stroke="#0284c7" strokeWidth="1.5" opacity="0.4"/>
                    <path d="M18 30l5-7 4 5 3-3 4 5" stroke="#0284c7" strokeWidth="1.5" fill="none"/>
                  </svg>
                </div>
                <div className="prop-card-body">
                  <div className="prop-card-address">{p.address || 'No address'}</div>
                  <div className="prop-card-meta">
                    <span className="prop-card-customer">{p.customer_name || 'No customer'}</span>
                    <span className="prop-card-dot">&bull;</span>
                    <span>Precision Roofing</span>
                  </div>
                  <div className="prop-card-meta">
                    <span>{date}</span>
                    {p.status === 'viewed' && p.viewed_at && (
                      <>
                        <span className="prop-card-dot">&bull;</span>
                        <span>Viewed {new Date(p.viewed_at).toLocaleDateString()}</span>
                      </>
                    )}
                    {p.status === 'signed' && p.signed_at && (
                      <>
                        <span className="prop-card-dot">&bull;</span>
                        <span>Signed {new Date(p.signed_at).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="prop-card-right">
                  <span className="prop-card-amount">${total.toFixed(2)}</span>
                  <span className={`prop-card-status ${p.status}`}>{p.status}</span>
                  <div className="prop-card-actions">
                    <button className="prop-card-action-btn" title="Copy link" onClick={e => handleCopyLink(e, p.id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                      </svg>
                    </button>
                    <button className="prop-card-action-btn" title="Delete" onClick={e => handleDelete(e, p.id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && !loading && (
            <div className="prop-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <p>No proposals found. Create your first one!</p>
              <button className="prop-new-btn" style={{ marginTop: 12 }} onClick={() => navigate('/proposals/new')}>
                + New Proposal
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
