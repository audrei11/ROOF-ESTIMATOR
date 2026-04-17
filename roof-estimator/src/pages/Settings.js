import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SETTINGS_NAV = [
  { section: 'Personal' },
  { key: 'user-profile', label: 'User Profile' },
  { key: 'notifications', label: 'Notifications' },
  { section: 'Company' },
  { key: 'profile-branding', label: 'Profile & Branding' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'team', label: 'Team' },
  { key: 'subscriptions', label: 'Subscriptions' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'partnership-codes', label: 'Partnership Codes' },
];

const MOCK_MESSAGES = [
  {
    email: 'morgantylerpro@gmail.com',
    address: '705 East Minnesota Street, Indianapolis, IN 46203',
    date: 'Sept. 20',
    subject: 'Proposal for tyler',
    preview: 'Dear tyler, Please follow the link to review and accept your customized proposal. Thank you for...',
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('communications');
  const [activeInboxTab, setActiveInboxTab] = useState('All');
  const [activeMainTab, setActiveMainTab] = useState('Inbox (0)');

  return (
    <div className="settings-layout">
      {/* Settings sidebar */}
      <aside className="settings-sidebar">
        <div className="settings-sidebar-inner">
          {/* Brand area */}
          <div className="settings-brand">
            <div className="settings-brand-icon">T</div>
            <div className="settings-brand-info">
              <span className="settings-brand-name">Ahjin Roofing</span>
              <span className="settings-brand-email">admin@precision.com</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>

          {/* Back button */}
          <button className="settings-back-btn" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </button>

          {/* Nav items */}
          <nav className="settings-nav">
            {SETTINGS_NAV.map((item, i) => {
              if (item.section) {
                return <div key={i} className="settings-nav-section">{item.section}</div>;
              }
              return (
                <button
                  key={item.key}
                  className={`settings-nav-item ${activeSection === item.key ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.key)}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Privacy Policy link at bottom */}
          <div className="settings-sidebar-bottom">
            <a href="#privacy" className="settings-privacy-link">
              Privacy Policy
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="settings-main">
        <CommunicationsSettings
          activeMainTab={activeMainTab}
          setActiveMainTab={setActiveMainTab}
          activeInboxTab={activeInboxTab}
          setActiveInboxTab={setActiveInboxTab}
        />
      </main>
    </div>
  );
}

function CommunicationsSettings({ activeMainTab, setActiveMainTab, activeInboxTab, setActiveInboxTab }) {
  return (
    <div className="settings-comms">
      {/* Header */}
      <div className="settings-comms-header">
        <div>
          <h1 className="settings-comms-title">Communications</h1>
          <p className="settings-comms-subtitle">Create and manage your messaging templates used in Roofr</p>
        </div>
        <div className="settings-comms-actions">
          <button className="settings-comms-template-btn">
            New template
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button className="settings-comms-newmsg-btn">
            New message
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="settings-comms-tabs">
        {['Inbox (0)', 'Templates'].map(tab => (
          <button
            key={tab}
            className={`settings-comms-tab ${activeMainTab === tab ? 'active' : ''}`}
            onClick={() => setActiveMainTab(tab)}
          >
            {tab}
            {tab === 'Inbox (0)' && <span className="settings-comms-beta-badge">Beta</span>}
          </button>
        ))}
      </div>

      {/* Gmail banner */}
      <div className="settings-comms-banner">
        <div>
          <strong>Get started with inbox</strong>
          <p className="settings-comms-banner-desc">Connect your Gmail account to seamlessly manage, track, and sync your inbox.</p>
        </div>
        <div className="settings-comms-banner-actions">
          <button className="settings-comms-gmail-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M2 6l10 7 10-7" stroke="#ea4335" strokeWidth="2" strokeLinecap="round"/>
              <rect x="2" y="4" width="20" height="16" rx="3" fill="none" stroke="#ea4335" strokeWidth="1.5"/>
            </svg>
            Connect to Gmail
          </button>
          <button className="settings-comms-later-btn">Maybe later</button>
        </div>
      </div>

      {/* Inbox split view */}
      <div className="settings-comms-inbox">
        {/* Left panel - message list */}
        <div className="settings-comms-inbox-left">
          <input
            className="settings-comms-search"
            type="text"
            placeholder="Search messages"
          />

          <div className="settings-comms-inbox-filters">
            <button className="settings-comms-sent-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Sent
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div className="settings-comms-inbox-tabs">
              {['All', 'Emails', 'Texts'].map(tab => (
                <button
                  key={tab}
                  className={`settings-comms-inbox-tab ${activeInboxTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveInboxTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Message list */}
          <div className="settings-comms-messages">
            {MOCK_MESSAGES.map((msg, i) => (
              <div key={i} className="settings-comms-message">
                <div className="settings-comms-message-header">
                  <span className="settings-comms-message-email">{msg.email}</span>
                  <span className="settings-comms-message-date">{msg.date}</span>
                </div>
                <p className="settings-comms-message-address">{msg.address}</p>
                <div className="settings-comms-message-body">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <div>
                    <p className="settings-comms-message-subject">{msg.subject}</p>
                    <p className="settings-comms-message-preview">{msg.preview}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - message detail */}
        <div className="settings-comms-inbox-right">
          <div className="settings-comms-no-message">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span>No message selected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
