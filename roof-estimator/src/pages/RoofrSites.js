import React from 'react';

export default function RoofrSites() {
  return (
    <div className="rs-page">
      {/* Hero section */}
      <div className="rs-hero">
        <div className="rs-hero-content">
          <div className="rs-hero-badge">
            Roofr Sites <span className="rs-badge">Beta</span>
          </div>
          <h1 className="rs-hero-title">Launch a website for your business in minutes</h1>
          <p className="rs-hero-desc">
            No coding experience required. Leverage our AI tool and get your website
            up and running by answering a few simple questions.
          </p>
          <button className="rs-cta-btn">
            Get started
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </button>
        </div>
        <div className="rs-hero-preview">
          <div className="rs-preview-browser">
            <div className="rs-browser-bar">
              <div className="rs-browser-dots">
                <span/><span/><span/>
              </div>
              <div className="rs-browser-address"/>
            </div>
            <div className="rs-browser-body">
              <div className="rs-preview-img">
                {/* Placeholder for website preview mockup */}
                <div className="rs-mock-nav">
                  <div className="rs-mock-logo"/>
                  <div className="rs-mock-links"><span/><span/><span/><span/></div>
                </div>
                <div className="rs-mock-hero-img"/>
                <div className="rs-mock-lines">
                  <div className="rs-mock-line w80"/>
                  <div className="rs-mock-line w60"/>
                  <div className="rs-mock-line w40"/>
                </div>
                <div className="rs-mock-toggle"/>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works section */}
      <div className="rs-how">
        <h2 className="rs-how-title">How it works</h2>
        <div className="rs-steps">
          <div className="rs-step">
            <div className="rs-step-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="14" y="18" width="20" height="14" rx="2" stroke="#2563eb" strokeWidth="2" fill="#eff6ff"/>
                <rect x="8" y="28" width="20" height="8" rx="1" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4 2" fill="none"/>
                <path d="M30 36l4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="14" cy="14" r="3" stroke="#cbd5e1" strokeWidth="1.5" fill="none"/>
                <circle cx="32" cy="12" r="2" stroke="#cbd5e1" strokeWidth="1" fill="none"/>
              </svg>
            </div>
            <span className="rs-step-label">1. Fast-track setup</span>
          </div>
          <div className="rs-step">
            <div className="rs-step-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="12" width="14" height="18" rx="2" stroke="#2563eb" strokeWidth="2" fill="#eff6ff"/>
                <rect x="26" y="12" width="14" height="12" rx="2" stroke="#2563eb" strokeWidth="2" fill="#eff6ff"/>
                <line x1="12" y1="20" x2="18" y2="20" stroke="#2563eb" strokeWidth="1.5"/>
                <line x1="12" y1="24" x2="16" y2="24" stroke="#2563eb" strokeWidth="1.5"/>
                <rect x="30" y="16" width="6" height="4" rx="1" stroke="#2563eb" strokeWidth="1" fill="#dbeafe"/>
                <circle cx="22" cy="10" r="2" stroke="#cbd5e1" strokeWidth="1" fill="none"/>
                <path d="M36 28l2-2" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="rs-step-label">2. Guided one-hour build</span>
          </div>
          <div className="rs-step">
            <div className="rs-step-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="10" y="10" width="22" height="28" rx="2" stroke="#2563eb" strokeWidth="2" fill="#eff6ff"/>
                <line x1="14" y1="18" x2="28" y2="18" stroke="#2563eb" strokeWidth="1.5"/>
                <line x1="14" y1="22" x2="24" y2="22" stroke="#2563eb" strokeWidth="1.5"/>
                <line x1="14" y1="26" x2="26" y2="26" stroke="#2563eb" strokeWidth="1.5"/>
                <circle cx="36" cy="30" r="6" stroke="#2563eb" strokeWidth="2" fill="#dbeafe"/>
                <path d="M34 30l2 2 4-4" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="rs-step-label">3. Launch your AI-tuned site</span>
          </div>
          <div className="rs-step">
            <div className="rs-step-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="10" stroke="#2563eb" strokeWidth="2" fill="#eff6ff"/>
                <circle cx="24" cy="24" r="3" fill="#2563eb"/>
                <line x1="24" y1="14" x2="24" y2="18" stroke="#2563eb" strokeWidth="1.5"/>
                <line x1="24" y1="30" x2="24" y2="34" stroke="#2563eb" strokeWidth="1.5"/>
                <line x1="14" y1="24" x2="18" y2="24" stroke="#2563eb" strokeWidth="1.5"/>
                <line x1="30" y1="24" x2="34" y2="24" stroke="#2563eb" strokeWidth="1.5"/>
                <circle cx="36" cy="12" r="4" stroke="#cbd5e1" strokeWidth="1" fill="none"/>
                <path d="M35 12l1 1 2-2" stroke="#22c55e" strokeWidth="1" strokeLinecap="round"/>
                <circle cx="12" cy="36" r="4" stroke="#cbd5e1" strokeWidth="1" fill="none"/>
                <path d="M10.5 36l1.5 1.5 2-2" stroke="#ef4444" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="rs-step-label">4. Smart updates</span>
          </div>
        </div>
      </div>
    </div>
  );
}
