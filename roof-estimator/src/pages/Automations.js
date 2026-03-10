import React from 'react';

export default function Automations() {
  return (
    <div className="automations-page">
      <h1 className="automations-title">Automations</h1>

      {/* Hero section */}
      <div className="automations-hero">
        <div className="automations-hero-left">
          <div className="automations-illustration">
            <svg width="240" height="220" viewBox="0 0 240 220" fill="none">
              {/* Central gear */}
              <circle cx="120" cy="100" r="35" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2"/>
              <circle cx="120" cy="100" r="20" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5"/>
              {/* Gear teeth */}
              <rect x="113" y="60" width="14" height="12" rx="3" fill="#93c5fd"/>
              <rect x="113" y="128" width="14" height="12" rx="3" fill="#93c5fd"/>
              <rect x="80" y="93" width="12" height="14" rx="3" fill="#93c5fd"/>
              <rect x="148" y="93" width="12" height="14" rx="3" fill="#93c5fd"/>
              {/* Diagonal teeth */}
              <rect x="88" y="70" width="12" height="12" rx="3" fill="#bae6fd" transform="rotate(-45 94 76)"/>
              <rect x="140" y="70" width="12" height="12" rx="3" fill="#bae6fd" transform="rotate(45 146 76)"/>
              <rect x="88" y="118" width="12" height="12" rx="3" fill="#bae6fd" transform="rotate(45 94 124)"/>
              <rect x="140" y="118" width="12" height="12" rx="3" fill="#bae6fd" transform="rotate(-45 146 124)"/>
              {/* Lightning bolt in center */}
              <path d="M116 90 L122 90 L119 100 L126 100 L117 115 L120 105 L114 105 Z" fill="#3b82f6"/>
              {/* Connected nodes - left */}
              <line x1="80" y1="100" x2="40" y2="70" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="4 3"/>
              <circle cx="35" cy="67" r="10" fill="#fff" stroke="#93c5fd" strokeWidth="1.5"/>
              <rect x="30" y="63" width="10" height="8" rx="2" fill="#bae6fd"/>
              {/* Connected nodes - right */}
              <line x1="160" y1="100" x2="200" y2="70" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="4 3"/>
              <circle cx="205" cy="67" r="10" fill="#fff" stroke="#93c5fd" strokeWidth="1.5"/>
              <path d="M201 64 L205 68 L209 64" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
              {/* Connected nodes - bottom */}
              <line x1="120" y1="140" x2="120" y2="175" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="4 3"/>
              <circle cx="120" cy="182" r="10" fill="#fff" stroke="#93c5fd" strokeWidth="1.5"/>
              <rect x="115" y="178" width="10" height="8" rx="2" fill="#bae6fd"/>
              {/* Decorative */}
              <circle cx="50" cy="160" r="3" fill="#bae6fd"/>
              <circle cx="190" cy="155" r="3" fill="#bae6fd"/>
            </svg>
          </div>
        </div>

        <div className="automations-hero-right">
          <span className="automations-premium-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z"/>
            </svg>
            Premium
          </span>

          <h2 className="automations-hero-title">Automate your workflow</h2>
          <p className="automations-hero-desc">
            Save hours every week by automating repetitive tasks. Set up triggers
            and actions to keep your team moving without the manual work.
          </p>

          <ul className="automations-check-list">
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" fill="#22c55e"/>
                <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Auto-assign leads to team members based on rules
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" fill="#22c55e"/>
                <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Send automatic follow-ups and reminders
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" fill="#22c55e"/>
                <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Move jobs through your pipeline automatically
            </li>
          </ul>

          <button className="automations-cta-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z"/>
            </svg>
            Upgrade to Premium
          </button>

          <p className="automations-footer-text">
            Check out all Premium features on <a href="#plans" className="automations-link">plans &amp; pricing</a>
          </p>
        </div>
      </div>
    </div>
  );
}
