import React from 'react';

export default function PdfSigner() {
  return (
    <div className="pdf-signer-page">
      <h1 className="pdf-signer-title">PDF Signer</h1>

      {/* Hero section */}
      <div className="pdf-signer-hero">
        <div className="pdf-signer-hero-left">
          {/* Clipboard illustration */}
          <div className="pdf-signer-illustration">
            <svg width="200" height="220" viewBox="0 0 200 220" fill="none">
              {/* Clipboard body */}
              <rect x="30" y="30" width="140" height="180" rx="10" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2"/>
              {/* Clipboard clip */}
              <rect x="70" y="20" width="60" height="20" rx="5" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="2"/>
              <rect x="85" y="15" width="30" height="12" rx="4" fill="#fff" stroke="#7dd3fc" strokeWidth="2"/>
              {/* Lines */}
              <rect x="55" y="65" width="90" height="6" rx="3" fill="#bae6fd"/>
              <rect x="55" y="82" width="70" height="6" rx="3" fill="#bae6fd"/>
              <rect x="55" y="99" width="85" height="6" rx="3" fill="#bae6fd"/>
              <rect x="55" y="116" width="60" height="6" rx="3" fill="#bae6fd"/>
              <rect x="55" y="133" width="80" height="6" rx="3" fill="#bae6fd"/>
              {/* Checkmark circle */}
              <circle cx="75" cy="165" r="16" fill="#22c55e"/>
              <path d="M67 165l5 5 11-11" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Signature text */}
              <text x="97" y="170" fontFamily="cursive" fontSize="16" fill="#92400e" fontStyle="italic">John Doe</text>
              {/* Edit icons top-right */}
              <path d="M158 38l6-6m0 0l-3-3m3 3l-6 6" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
              <path d="M172 32l6-6m0 0l-3-3m3 3l-6 6" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <div className="pdf-signer-hero-right">
          <span className="pdf-signer-elite-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z"/></svg>
            Elite
          </span>
          <h2 className="pdf-signer-hero-title">Get started building documents</h2>
          <p className="pdf-signer-hero-desc">
            Create reusable templates for documents like: contracts, notices of
            commencement, and contingencies
          </p>
          <button className="pdf-signer-upgrade-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z"/></svg>
            Upgrade to Elite
          </button>
        </div>
      </div>

      <hr className="pdf-signer-divider" />

      {/* Feature cards */}
      <div className="pdf-signer-features">
        <div className="pdf-signer-feature-card">
          <div className="pdf-signer-feature-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </div>
          <h3 className="pdf-signer-feature-title">Create reusable templates</h3>
          <p className="pdf-signer-feature-desc">
            Roofr makes it easy to import documents from your file manager
            and create templates your entire team can use
          </p>
        </div>

        <div className="pdf-signer-feature-card">
          <div className="pdf-signer-feature-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <h3 className="pdf-signer-feature-title">Request signatures</h3>
          <p className="pdf-signer-feature-desc">
            Request customer signatures, initials, selections with checkboxes
            and more
          </p>
        </div>

        <div className="pdf-signer-feature-card">
          <div className="pdf-signer-feature-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
          </div>
          <h3 className="pdf-signer-feature-title">Autofill docs with job info</h3>
          <p className="pdf-signer-feature-desc">
            Add dynamic fields to documents and templates to autofill job
            specific information when you link
          </p>
        </div>
      </div>
    </div>
  );
}
