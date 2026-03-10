import React from 'react';

export default function Payments() {
  return (
    <div className="payments-page">
      {/* Header */}
      <div className="payments-header">
        <h1 className="payments-title">Payments</h1>
        <button className="payments-export-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export to CSV
        </button>
      </div>

      {/* Tab */}
      <div className="payments-tabs">
        <button className="payments-tab active">All payments</button>
      </div>

      {/* Hero section */}
      <div className="payments-hero">
        <div className="payments-hero-left">
          <div className="payments-illustration">
            <svg width="260" height="260" viewBox="0 0 260 260" fill="none">
              {/* Calculator body */}
              <rect x="65" y="70" width="120" height="160" rx="10" fill="#e0f2fe" stroke="#3b82f6" strokeWidth="1.5"/>
              {/* Screen */}
              <rect x="80" y="85" width="90" height="35" rx="5" fill="#fff" stroke="#bae6fd" strokeWidth="1"/>
              {/* Mountain logo on screen */}
              <path d="M95 108 L107 92 L119 108 Z" fill="#3b82f6"/>
              <path d="M107 108 L115 98 L123 108 Z" fill="#60a5fa"/>
              {/* Screen lines */}
              <rect x="130" y="95" width="30" height="3" rx="1.5" fill="#bae6fd"/>
              <rect x="130" y="103" width="20" height="3" rx="1.5" fill="#dbeafe"/>
              {/* Calculator buttons grid */}
              <rect x="80" y="132" width="22" height="18" rx="4" fill="#fff" stroke="#bae6fd" strokeWidth="1"/>
              <rect x="108" y="132" width="22" height="18" rx="4" fill="#fff" stroke="#bae6fd" strokeWidth="1"/>
              <rect x="136" y="132" width="34" height="18" rx="4" fill="#fff" stroke="#bae6fd" strokeWidth="1"/>
              <rect x="80" y="156" width="22" height="18" rx="4" fill="#fff" stroke="#bae6fd" strokeWidth="1"/>
              <rect x="108" y="156" width="22" height="18" rx="4" fill="#fff" stroke="#bae6fd" strokeWidth="1"/>
              <rect x="136" y="156" width="34" height="18" rx="4" fill="#fff" stroke="#bae6fd" strokeWidth="1"/>
              <rect x="80" y="180" width="22" height="18" rx="4" fill="#fff" stroke="#bae6fd" strokeWidth="1"/>
              <rect x="108" y="180" width="22" height="18" rx="4" fill="#fff" stroke="#bae6fd" strokeWidth="1"/>
              <rect x="136" y="180" width="34" height="18" rx="4" fill="#fff" stroke="#bae6fd" strokeWidth="1"/>
              <rect x="80" y="204" width="22" height="18" rx="4" fill="#fff" stroke="#bae6fd" strokeWidth="1"/>
              <rect x="108" y="204" width="22" height="18" rx="4" fill="#fff" stroke="#bae6fd" strokeWidth="1"/>
              <rect x="136" y="204" width="34" height="18" rx="4" fill="#fff" stroke="#bae6fd" strokeWidth="1"/>
              {/* Credit card overlay */}
              <rect x="130" y="55" width="90" height="56" rx="7" fill="#fff" stroke="#3b82f6" strokeWidth="1.5"/>
              <rect x="142" y="67" width="30" height="5" rx="2.5" fill="#3b82f6"/>
              <rect x="142" y="78" width="50" height="4" rx="2" fill="#bae6fd"/>
              <rect x="142" y="88" width="65" height="10" rx="3" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
              {/* Decorative elements */}
              <circle cx="100" y="55" r="4" fill="none" stroke="#93c5fd" strokeWidth="1.5"/>
              <circle cx="83" cy="58" r="2" fill="#bae6fd"/>
              <g stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round">
                <line x1="120" y1="52" x2="120" y2="60"/><line x1="116" y1="56" x2="124" y2="56"/>
                <line x1="73" y1="235" x2="73" y2="243"/><line x1="69" y1="239" x2="77" y2="239"/>
              </g>
              <circle cx="80" cy="248" r="2" fill="#93c5fd"/>
            </svg>
          </div>
        </div>

        <div className="payments-hero-right">
          <h2 className="payments-hero-title">Get paid faster with Roofr Payments</h2>
          <p className="payments-hero-desc">
            Offer instant online payment options with your
            invoices. Track your payments for each invoice and see
            when your funds get deposited.
          </p>

          <div className="payments-btn-row">
            <button className="payments-invoices-btn" onClick={() => window.location.href = '/invoices'}>
              View invoices
            </button>
            <button className="payments-setup-btn">
              Setup now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
