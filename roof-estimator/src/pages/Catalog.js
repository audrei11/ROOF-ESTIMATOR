import React, { useState } from 'react';

const TABS = ['All items', 'Settings'];

const MOCK_ITEMS = [
  {
    name: 'Roof Replacement',
    measurement: 'Pitched roof area (squ...',
    coverage: '1.00 squares',
    preTaxCost: '$0.00',
    source: 'Source',
    waste: '0.00%',
    unit: '',
  },
];

export default function Catalog() {
  const [activeTab, setActiveTab] = useState('All items');
  const [search, setSearch] = useState('');

  const filtered = MOCK_ITEMS.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="catalog-page">
      {/* Header */}
      <div className="catalog-header">
        <h1 className="catalog-title">Catalog</h1>
        <div className="catalog-header-actions">
          <button className="catalog-manage-btn">
            Manage catalog
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button className="catalog-add-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Add item
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="catalog-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`catalog-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search & filter toolbar */}
      <div className="catalog-toolbar">
        <div className="catalog-search-wrap">
          <svg className="catalog-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="catalog-search"
            type="text"
            placeholder="Search in catalog"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="catalog-filter-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Filters &amp; sort
        </button>
        <button className="catalog-filter-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
          </svg>
          Reorder items
        </button>
        <button className="catalog-columns-btn">
          Columns (8)
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>

      {/* Table */}
      <div className="catalog-table-wrap">
        <table className="catalog-table">
          <thead>
            <tr>
              <th className="catalog-th-check"><input type="checkbox" /></th>
              <th>
                Name
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 9l4-4 4 4"/><path d="M8 15l4 4 4-4"/></svg>
              </th>
              <th>
                Measurement
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </th>
              <th>
                Coverage
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </th>
              <th>
                Pre-tax costs
                <span className="catalog-source-tag">Source <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg></span>
              </th>
              <th>
                Waste
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 9l4-4 4 4"/><path d="M8 15l4 4 4-4"/></svg>
              </th>
              <th>Unit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <tr key={i}>
                <td className="catalog-td-check"><input type="checkbox" /></td>
                <td className="catalog-name-cell">{item.name}</td>
                <td className="catalog-muted">
                  {item.measurement}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{marginLeft: 4, verticalAlign: 'middle'}}><polyline points="6 9 12 15 18 9"/></svg>
                </td>
                <td className="catalog-muted">{item.coverage}</td>
                <td className="catalog-muted">{item.preTaxCost}</td>
                <td className="catalog-muted">{item.waste}</td>
                <td className="catalog-muted">{item.unit}</td>
                <td className="catalog-actions-cell">
                  <button className="catalog-edit-btn">Edit</button>
                  <button className="catalog-more-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="catalog-footer">
        Showing 1-{filtered.length} of {filtered.length}
      </div>
    </div>
  );
}
