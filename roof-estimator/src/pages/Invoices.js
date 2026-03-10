import React, { useState } from 'react';

const TABS = ['All invoices', 'Settings'];

export default function Invoices() {
  const [activeTab, setActiveTab] = useState('All invoices');

  return (
    <div className="invoices-page">
      <h1 className="invoices-title">Invoices</h1>

      {/* Sub-tabs */}
      <div className="invoices-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`invoices-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Hero section */}
      <div className="invoices-hero">
        <div className="invoices-hero-left">
          <div className="invoices-illustration">
            <svg width="260" height="260" viewBox="0 0 260 260" fill="none">
              {/* Dollar coin circle */}
              <circle cx="95" cy="65" r="28" fill="#fff" stroke="#93c5fd" strokeWidth="2"/>
              <circle cx="95" cy="65" r="22" fill="#eff6ff" stroke="#bae6fd" strokeWidth="1.5"/>
              <text x="95" y="72" textAnchor="middle" fontFamily="sans-serif" fontSize="22" fontWeight="700" fill="#3b82f6">$</text>

              {/* Main invoice document */}
              <rect x="70" y="90" width="140" height="160" rx="6" fill="#fff" stroke="#bae6fd" strokeWidth="1.5"/>

              {/* INVOICE header text */}
              <text x="140" y="115" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#3b82f6" letterSpacing="2">INVOICE</text>

              {/* Lines of text */}
              <rect x="90" y="128" width="80" height="4" rx="2" fill="#bae6fd"/>
              <rect x="90" y="140" width="100" height="4" rx="2" fill="#e0f2fe"/>
              <rect x="90" y="152" width="60" height="4" rx="2" fill="#bae6fd"/>
              <rect x="90" y="164" width="90" height="4" rx="2" fill="#e0f2fe"/>
              <rect x="90" y="176" width="70" height="4" rx="2" fill="#bae6fd"/>
              <rect x="90" y="188" width="85" height="4" rx="2" fill="#e0f2fe"/>

              {/* Blue payment card at bottom */}
              <rect x="100" y="208" width="100" height="35" rx="5" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1"/>
              <rect x="110" y="216" width="30" height="6" rx="2" fill="#93c5fd"/>
              <rect x="110" y="228" width="50" height="4" rx="2" fill="#bae6fd"/>

              {/* Corner resize arrows */}
              <path d="M198 88 L205 81 M200 92 L208 84" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round"/>

              {/* Decorative plus signs */}
              <g stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round">
                <line x1="55" y1="95" x2="55" y2="103"/><line x1="51" y1="99" x2="59" y2="99"/>
                <line x1="65" y1="235" x2="65" y2="243"/><line x1="61" y1="239" x2="69" y2="239"/>
              </g>

              {/* Decorative dots */}
              <circle cx="72" cy="120" r="2" fill="#bae6fd"/>
              <circle cx="215" cy="145" r="2" fill="#bae6fd"/>
            </svg>
          </div>
        </div>

        <div className="invoices-hero-right">
          <h2 className="invoices-hero-title">Bill customers directly online</h2>
          <p className="invoices-hero-desc">
            Our all-in-one system lets you create invoices anytime,
            anywhere. Keep track of pending requests and
            outstanding balances at a glance. Start off with
            creating an invoice from any your existing jobs.
          </p>

          <button className="invoices-viewjobs-btn" onClick={() => window.location.href = '/jobs'}>
            View jobs
          </button>

          <p className="invoices-footer-text">
            Curious what you'll get? <a href="#sample" className="invoices-link">View sample invoice</a>
          </p>
        </div>
      </div>
    </div>
  );
}
