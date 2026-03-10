import React from 'react';

export default function Communications() {
  return (
    <div className="comms-page">
      <h1 className="comms-title">Communications</h1>

      {/* Hero section */}
      <div className="comms-hero">
        <div className="comms-hero-left">
          <div className="comms-illustration">
            <svg width="240" height="220" viewBox="0 0 240 220" fill="none">
              {/* Main chat bubble */}
              <rect x="40" y="40" width="160" height="100" rx="12" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5"/>
              <path d="M70 140 L55 165 L95 140" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5"/>
              {/* Message lines */}
              <rect x="65" y="62" width="90" height="5" rx="2.5" fill="#93c5fd"/>
              <rect x="65" y="76" width="110" height="5" rx="2.5" fill="#bae6fd"/>
              <rect x="65" y="90" width="70" height="5" rx="2.5" fill="#93c5fd"/>
              <rect x="65" y="104" width="100" height="5" rx="2.5" fill="#dbeafe"/>
              {/* Small reply bubble */}
              <rect x="130" y="145" width="80" height="45" rx="8" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1"/>
              <path d="M185 190 L195 205 L175 190" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1"/>
              <rect x="142" y="158" width="55" height="4" rx="2" fill="#93c5fd"/>
              <rect x="142" y="168" width="40" height="4" rx="2" fill="#bae6fd"/>
              {/* Notification badge */}
              <circle cx="195" cy="45" r="12" fill="#3b82f6"/>
              <text x="195" y="50" textAnchor="middle" fontFamily="sans-serif" fontSize="13" fontWeight="700" fill="#fff">3</text>
              {/* Email icon */}
              <rect x="15" y="85" width="30" height="22" rx="4" fill="#fff" stroke="#93c5fd" strokeWidth="1.5"/>
              <polyline points="15,87 30,100 45,87" fill="none" stroke="#93c5fd" strokeWidth="1.5"/>
              {/* Decorative */}
              <circle cx="225" cy="100" r="3" fill="#bae6fd"/>
              <circle cx="30" cy="55" r="3" fill="#bae6fd"/>
              <g stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round">
                <line x1="220" y1="70" x2="220" y2="78"/><line x1="216" y1="74" x2="224" y2="74"/>
              </g>
            </svg>
          </div>
        </div>

        <div className="comms-hero-right">
          <span className="comms-premium-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z"/>
            </svg>
            Premium
          </span>

          <h2 className="comms-hero-title">Communicate with your customers</h2>
          <p className="comms-hero-desc">
            Keep all your customer conversations in one place. Send emails, SMS,
            and in-app messages directly from your dashboard.
          </p>

          <ul className="comms-check-list">
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" fill="#22c55e"/>
                <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Send and receive emails and texts from one inbox
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" fill="#22c55e"/>
                <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Track all customer interactions and message history
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" fill="#22c55e"/>
                <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Set up templates for quick, consistent responses
            </li>
          </ul>

          <button className="comms-cta-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z"/>
            </svg>
            Upgrade to Premium
          </button>

          <p className="comms-footer-text">
            Check out all Premium features on <a href="#plans" className="comms-link">plans &amp; pricing</a>
          </p>
        </div>
      </div>
    </div>
  );
}
