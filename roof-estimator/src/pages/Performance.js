import React, { useState } from 'react';

const TABS = ['Job report', 'Overview', 'Workflow', 'Pipeline'];

export default function Performance() {
  const [activeTab, setActiveTab] = useState('Job report');

  return (
    <div className="perf-page">
      <h1 className="perf-title">Performance</h1>

      {/* Sub-tabs */}
      <div className="perf-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`perf-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Hero / Premium upsell */}
      <div className="perf-hero">
        <div className="perf-hero-left">
          <div className="perf-illustration">
            <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
              {/* Document background */}
              <rect x="40" y="20" width="160" height="200" rx="8" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="1.5" strokeDasharray="6 3"/>
              {/* Inner white card */}
              <rect x="55" y="50" width="130" height="140" rx="6" fill="#fff" stroke="#bae6fd" strokeWidth="1"/>
              {/* Chart bars */}
              <rect x="75" y="130" width="18" height="40" rx="2" fill="#bae6fd"/>
              <rect x="100" y="110" width="18" height="60" rx="2" fill="#93c5fd"/>
              <rect x="125" y="90" width="18" height="80" rx="2" fill="#60a5fa"/>
              <rect x="150" y="120" width="18" height="50" rx="2" fill="#bae6fd"/>
              {/* Line chart */}
              <polyline points="75,100 100,80 125,65 155,85" stroke="#2563eb" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="75" cy="100" r="3" fill="#2563eb"/>
              <circle cx="100" cy="80" r="3" fill="#2563eb"/>
              <circle cx="125" cy="65" r="3" fill="#2563eb"/>
              <circle cx="155" cy="85" r="3" fill="#2563eb"/>
              {/* Table lines at top */}
              <rect x="70" y="58" width="50" height="4" rx="2" fill="#bae6fd"/>
              <rect x="130" y="58" width="40" height="4" rx="2" fill="#bae6fd"/>
              <rect x="70" y="68" width="40" height="4" rx="2" fill="#e0f2fe"/>
              <rect x="130" y="68" width="30" height="4" rx="2" fill="#e0f2fe"/>
              {/* Corner fold */}
              <path d="M185 20 L200 20 L200 35 Z" fill="#bae6fd"/>
              {/* Small decorative elements */}
              <circle cx="50" cy="195" r="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1"/>
              <line x1="47" y1="195" x2="53" y2="195" stroke="#93c5fd" strokeWidth="1.5"/>
              <line x1="50" y1="192" x2="50" y2="198" stroke="#93c5fd" strokeWidth="1.5"/>
            </svg>
          </div>
        </div>

        <div className="perf-hero-right">
          <span className="perf-premium-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z"/>
            </svg>
            Premium
          </span>

          <h2 className="perf-hero-title">See exactly what you're earning</h2>
          <p className="perf-hero-desc">
            The data that separates six-figure roofers from everyone else
          </p>

          <ul className="perf-check-list">
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" fill="#22c55e"/>
                <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              See which team members close the most profitable jobs
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" fill="#22c55e"/>
                <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              See which jobs were won or lost — and why
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" fill="#22c55e"/>
                <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Discover which jobs make you the most money
            </li>
          </ul>

          <button className="perf-cta-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z"/>
            </svg>
            See your performance data
          </button>

          <p className="perf-footer-text">
            Check out all Premium features on <a href="#plans" className="perf-link">plans &amp; pricing</a>
          </p>
        </div>
      </div>
    </div>
  );
}
