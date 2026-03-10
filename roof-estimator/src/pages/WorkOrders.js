import React from 'react';

export default function WorkOrders() {
  return (
    <div className="workorders-page">
      <h1 className="workorders-title">Work Orders</h1>

      {/* Hero / Premium upsell */}
      <div className="workorders-hero">
        <div className="workorders-hero-left">
          <div className="workorders-illustration">
            <svg width="260" height="280" viewBox="0 0 260 280" fill="none">
              {/* Document background */}
              <rect x="40" y="30" width="170" height="220" rx="8" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="1.5" strokeDasharray="6 3"/>
              {/* Inner white card */}
              <rect x="55" y="50" width="140" height="180" rx="6" fill="#fff" stroke="#bae6fd" strokeWidth="1"/>
              {/* Mountain/logo icon */}
              <path d="M80 90 L95 70 L110 90 Z" fill="#3b82f6"/>
              <path d="M95 90 L105 78 L115 90 Z" fill="#60a5fa"/>
              {/* Lines of text */}
              <rect x="70" y="105" width="100" height="5" rx="2.5" fill="#bae6fd"/>
              <rect x="70" y="118" width="80" height="5" rx="2.5" fill="#dbeafe"/>
              <rect x="70" y="131" width="110" height="5" rx="2.5" fill="#bae6fd"/>
              <rect x="70" y="144" width="70" height="5" rx="2.5" fill="#dbeafe"/>
              <rect x="70" y="157" width="95" height="5" rx="2.5" fill="#bae6fd"/>
              <rect x="70" y="170" width="60" height="5" rx="2.5" fill="#dbeafe"/>
              {/* Hammer overlay */}
              <g transform="translate(145, 140) rotate(-30)">
                {/* Handle */}
                <rect x="-4" y="0" width="8" height="55" rx="3" fill="#9ca3af"/>
                {/* Head */}
                <rect x="-16" y="-12" width="32" height="16" rx="3" fill="#6b7280"/>
                <rect x="-14" y="-10" width="28" height="12" rx="2" fill="#4b5563"/>
              </g>
              {/* Corner arrows (resize indicator) */}
              <path d="M195 42 L205 32 M200 42 L205 37" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
              {/* Decorative plus signs */}
              <g stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round">
                <line x1="210" y1="180" x2="210" y2="190"/><line x1="205" y1="185" x2="215" y2="185"/>
                <line x1="45" y1="230" x2="45" y2="240"/><line x1="40" y1="235" x2="50" y2="235"/>
              </g>
              {/* Decorative dots */}
              <circle cx="55" cy="255" r="2" fill="#93c5fd"/>
              <circle cx="200" cy="210" r="2" fill="#93c5fd"/>
            </svg>
          </div>
        </div>

        <div className="workorders-hero-right">
          <span className="workorders-premium-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z"/>
            </svg>
            Premium
          </span>

          <h2 className="workorders-hero-title">Send work orders to your crew</h2>
          <p className="workorders-hero-desc">
            Save time, reduce errors, and keep your crew on the same page
          </p>

          <ul className="workorders-check-list">
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" fill="#22c55e"/>
                <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Create work orders directly from your proposals or material orders
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" fill="#22c55e"/>
                <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Share work orders with your crew for hassle-free collaboration
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" fill="#22c55e"/>
                <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Track the status of every order and stay on top of your projects
            </li>
          </ul>

          <div className="workorders-btn-row">
            <button className="workorders-sample-btn">View sample work order</button>
            <button className="workorders-upgrade-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z"/>
              </svg>
              Upgrade to Premium
            </button>
          </div>

          <p className="workorders-footer-text">
            Check out all Premium features on <a href="#plans" className="workorders-link">plans &amp; pricing</a> or <a href="#learn" className="workorders-link">learn more</a> about work orders
          </p>
        </div>
      </div>
    </div>
  );
}
