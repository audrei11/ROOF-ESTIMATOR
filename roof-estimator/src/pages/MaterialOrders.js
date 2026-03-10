import React from 'react';

function CheckCircle() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" stroke="#d1d5db" strokeWidth="1.5" fill="none"/>
      <path d="M7.5 12.5l3 3 6-6.5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export default function MaterialOrders() {
  return (
    <div className="matord-page">
      <h1 className="matord-title">Material Orders</h1>
      <hr className="matord-divider" />

      {/* Hero section */}
      <div className="matord-hero">
        <div className="matord-hero-left">
          {/* Map + package illustration */}
          <div className="matord-illustration">
            <svg width="300" height="300" viewBox="0 0 300 300" fill="none">
              {/* Phone/tablet frame with shadow */}
              <defs>
                <filter id="phoneShadow" x="40" y="20" width="200" height="230" filterUnits="userSpaceOnUse">
                  <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#94a3b8" floodOpacity="0.18"/>
                </filter>
              </defs>
              <rect x="55" y="25" width="160" height="215" rx="14" fill="#fff" stroke="#7dd3fc" strokeWidth="1.5" filter="url(#phoneShadow)"/>

              {/* Map content inside phone */}
              {/* Streets (horizontal) */}
              <line x1="55" y1="70" x2="215" y2="70" stroke="#e2e8f0" strokeWidth="1"/>
              <line x1="55" y1="105" x2="215" y2="105" stroke="#e2e8f0" strokeWidth="1"/>
              <line x1="55" y1="140" x2="215" y2="140" stroke="#e2e8f0" strokeWidth="1"/>
              <line x1="55" y1="175" x2="215" y2="175" stroke="#e2e8f0" strokeWidth="1"/>
              <line x1="55" y1="210" x2="215" y2="210" stroke="#e2e8f0" strokeWidth="1"/>
              {/* Streets (vertical) */}
              <line x1="90" y1="25" x2="90" y2="240" stroke="#e2e8f0" strokeWidth="1"/>
              <line x1="135" y1="25" x2="135" y2="240" stroke="#e2e8f0" strokeWidth="1"/>
              <line x1="180" y1="25" x2="180" y2="240" stroke="#e2e8f0" strokeWidth="1"/>

              {/* Blue route path */}
              <path d="M90 60 L135 95 L110 140 L160 175 L135 210" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              {/* Route dots */}
              <circle cx="90" cy="60" r="5" fill="#38bdf8"/>
              <circle cx="135" cy="95" r="5" fill="#38bdf8"/>
              <circle cx="110" cy="140" r="5" fill="#38bdf8"/>
              <circle cx="160" cy="175" r="5" fill="#38bdf8"/>
              <circle cx="135" cy="210" r="5" fill="#38bdf8"/>

              {/* Crop corner marks (outside the phone) */}
              <path d="M40 42 L40 25 L57 25" stroke="#cbd5e1" strokeWidth="1.2" fill="none"/>
              <path d="M230 42 L230 25 L213 25" stroke="#cbd5e1" strokeWidth="1.2" fill="none"/>
              <path d="M40 223 L40 240 L57 240" stroke="#cbd5e1" strokeWidth="1.2" fill="none"/>
              <path d="M230 223 L230 240 L213 240" stroke="#cbd5e1" strokeWidth="1.2" fill="none"/>

              {/* Small plus/crosshair marks */}
              <g stroke="#cbd5e1" strokeWidth="1">
                <line x1="30" y1="130" x2="38" y2="130"/><line x1="34" y1="126" x2="34" y2="134"/>
                <line x1="232" y1="130" x2="240" y2="130"/><line x1="236" y1="126" x2="236" y2="134"/>
                <line x1="133" y1="10" x2="137" y2="10"/><line x1="135" y1="8" x2="135" y2="12"/>
                <line x1="133" y1="252" x2="137" y2="252"/><line x1="135" y1="250" x2="135" y2="254"/>
              </g>

              {/* Chevron circle (left) */}
              <circle cx="26" cy="132" r="16" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5"/>
              <polyline points="30,126 24,132 30,138" stroke="#64748b" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

              {/* Package box (bottom right, overlapping phone) */}
              <g transform="translate(170, 215)">
                {/* Box shadow */}
                <rect x="2" y="14" width="60" height="48" rx="4" fill="#e2e8f0" opacity="0.5"/>
                {/* Box body */}
                <rect x="0" y="12" width="60" height="48" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5"/>
                {/* Box tape lines */}
                <line x1="0" y1="28" x2="60" y2="28" stroke="#cbd5e1" strokeWidth="1.2"/>
                <line x1="30" y1="28" x2="30" y2="60" stroke="#cbd5e1" strokeWidth="1.2"/>
                {/* Box top flap */}
                <path d="M0 28 L30 12 L60 28" stroke="#cbd5e1" strokeWidth="1.5" fill="#eef2f7"/>
              </g>
            </svg>
          </div>
        </div>

        <div className="matord-hero-right">
          <h2 className="matord-hero-title">Create your first material order</h2>
          <p className="matord-hero-desc">
            Easily create and send material orders with a new tool designed for roofers by roofers
          </p>

          {/* Checklist */}
          <div className="matord-checklist">
            <div className="matord-check-item">
              <CheckCircle />
              <span>Add your suppliers</span>
            </div>
            <div className="matord-check-item">
              <CheckCircle />
              <span>Create material orders from your proposals</span>
            </div>
            <div className="matord-check-item">
              <CheckCircle />
              <span>Track your orders</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="matord-actions">
            <button className="matord-btn-outline">Add supplier</button>
            <button className="matord-btn-primary">Create order</button>
          </div>

          <p className="matord-sample">
            Curious what you'll get?{' '}
            <a href="#sample" className="matord-sample-link">View sample order</a>
          </p>
        </div>
      </div>
    </div>
  );
}
