import React, { useState } from 'react';

const MOCK_CONTACTS = [
  { name: 'Biak Lian', type: 'Customer', label: '-', email: '-', phone: '-', job: '7634 Cynthia ...' },
  { name: 'Crystal Wheeler', type: 'Customer', label: '-', email: '-', phone: '-', job: '2722 Station ...' },
  { name: 'Hazel Utley', type: 'Customer', label: '-', email: '-', phone: '-', job: '2745 Station ...' },
  { name: 'Ira&Kath', type: 'Customer', label: '-', email: 'Ira_kathc@yahoo.com', phone: '(812) 350-7490', job: '5530 Smoketr...' },
  { name: 'Kelly Moore', type: 'Customer', label: '-', email: '-', phone: '-', job: '515 Delbrick L...' },
  { name: 'Paul Dorian', type: 'Customer', label: '-', email: '-', phone: '-', job: '8701 North R...' },
];

export default function Contacts() {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const filtered = MOCK_CONTACTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortCol] || '';
    const valB = b[sortCol] || '';
    return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  const SortIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8 9l4-4 4 4"/><path d="M8 15l4 4 4-4"/>
    </svg>
  );

  return (
    <div className="contacts-page">
      {/* Header */}
      <div className="contacts-header">
        <h1 className="contacts-title">Contacts</h1>
        <button className="contacts-new-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New contact
        </button>
      </div>

      {/* Search & filter bar */}
      <div className="contacts-toolbar">
        <div className="contacts-search-wrap">
          <svg className="contacts-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="contacts-search"
            type="text"
            placeholder="Search by name, email, phone"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="contacts-filter-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Type
        </button>
      </div>

      {/* Table */}
      <div className="contacts-table-wrap">
        <table className="contacts-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')}>Name <SortIcon /></th>
              <th onClick={() => handleSort('type')}>Type <SortIcon /></th>
              <th onClick={() => handleSort('label')}>Label <SortIcon /></th>
              <th onClick={() => handleSort('email')}>Email <SortIcon /></th>
              <th>Phone</th>
              <th>Job</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr key={i}>
                <td className="contacts-name-cell">{c.name}</td>
                <td>
                  <span className="contacts-type-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    </svg>
                    {c.type}
                  </span>
                </td>
                <td className="contacts-muted">{c.label}</td>
                <td className="contacts-muted">{c.email}</td>
                <td className="contacts-muted">{c.phone}</td>
                <td className="contacts-muted">{c.job}</td>
                <td>
                  <button className="contacts-actions-btn">
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
    </div>
  );
}
