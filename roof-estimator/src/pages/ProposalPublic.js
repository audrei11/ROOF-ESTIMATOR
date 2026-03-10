import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import SignatureCanvas from '../components/SignatureCanvas';
import { generateSignedProposalPdf } from '../utils/proposalPdf';

/* ═══════════════════════════════════════════════════════════════════════════
   ProposalPublic — What the homeowner sees when they open the link
   ─────────────────────────────────────────────────────────────────────────
   Route: /p/:id
   No login required — the unique ID in the URL is the access key.
   ═══════════════════════════════════════════════════════════════════════════ */

const API = '/api/proposals';

export default function ProposalPublic() {
  const { id } = useParams();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(0);
  const [signatureData, setSignatureData] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  // Load proposal
  useEffect(() => {
    fetch(`${API}/public/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Proposal not found');
        return r.json();
      })
      .then(data => {
        setProposal(data);
        setSignerName(data.customer_name || '');
        if (data.status === 'signed') setSigned(true);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });

    // Record view
    fetch(`${API}/public/${id}/view`, { method: 'POST' }).catch(() => {});
  }, [id]);

  const handleSignature = useCallback((dataUrl) => {
    setSignatureData(dataUrl);
  }, []);

  // Calculate option total
  const optionTotal = (opt) => (opt?.lineItems || []).reduce((s, li) => s + (li.qty * li.unitPrice), 0);

  // Submit signature
  const handleSign = async () => {
    if (!signatureData || !agreed) return;
    setSigning(true);
    try {
      const res = await fetch(`${API}/public/${id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureImage: signatureData,
          signerName,
          selectedOption,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSigned(true);
        // Generate PDF for download
        try {
          await generateSignedProposalPdf(data.proposal);
        } catch (e) {
          console.error('PDF generation failed:', e);
        }
      }
    } catch (err) {
      alert('Failed to submit signature. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="pp-loading">
        <div className="pp-spinner" />
        <p>Loading proposal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pp-error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <h2>Proposal Not Found</h2>
        <p>This proposal link may be invalid or expired.</p>
      </div>
    );
  }

  // Already signed view
  if (signed) {
    return (
      <div className="pp-page">
        <div className="pp-container">
          <div className="pp-signed-banner">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h2>Proposal Signed Successfully</h2>
            <p>Thank you, <strong>{proposal.customer_name}</strong>. Your signed proposal has been recorded.</p>
            <p className="pp-signed-meta">
              Signed on {proposal.signed_at ? new Date(proposal.signed_at).toLocaleString() : new Date().toLocaleString()}
            </p>
            <p className="pp-signed-sub">A copy of the signed proposal PDF has been downloaded.</p>
          </div>
        </div>
      </div>
    );
  }

  const opts = proposal.options || [];

  return (
    <div className="pp-page">
      <div className="pp-container">
        {/* Header */}
        <div className="pp-header">
          <div className="pp-logo">T</div>
          <div>
            <div className="pp-company">Precision Roofing</div>
            <div className="pp-tagline">Roofing Proposal</div>
          </div>
        </div>

        {/* Proposal info */}
        <div className="pp-info-grid">
          <div className="pp-info-item">
            <div className="pp-info-label">Prepared for</div>
            <div className="pp-info-value">{proposal.customer_name || '—'}</div>
          </div>
          <div className="pp-info-item">
            <div className="pp-info-label">Property</div>
            <div className="pp-info-value">{proposal.address || '—'}</div>
          </div>
          <div className="pp-info-item">
            <div className="pp-info-label">Date</div>
            <div className="pp-info-value">{new Date(proposal.created_at).toLocaleDateString()}</div>
          </div>
          {proposal.total_area > 0 && (
            <div className="pp-info-item">
              <div className="pp-info-label">Roof Area</div>
              <div className="pp-info-value">{Math.round(proposal.total_area).toLocaleString()} sq ft</div>
            </div>
          )}
        </div>

        {/* Pricing options */}
        <div className="pp-section">
          <h2 className="pp-section-title">
            {opts.length > 1 ? 'Select an Option' : 'Pricing'}
          </h2>

          {opts.map((opt, i) => (
            <div
              key={i}
              className={`pp-option-card ${selectedOption === i ? 'selected' : ''}`}
              onClick={() => setSelectedOption(i)}
            >
              {opts.length > 1 && (
                <div className="pp-option-radio">
                  <div className={`pp-radio ${selectedOption === i ? 'checked' : ''}`} />
                </div>
              )}
              <div className="pp-option-body">
                <div className="pp-option-name">{opt.name}</div>
                <table className="pp-line-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(opt.lineItems || []).map((li, j) => (
                      <tr key={j}>
                        <td>{li.description || '—'}</td>
                        <td style={{ textAlign: 'right' }}>{li.qty} {li.unit}</td>
                        <td style={{ textAlign: 'right' }}>${Number(li.unitPrice).toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>${(li.qty * li.unitPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pp-option-total">
                  Total: <strong>${optionTotal(opt).toFixed(2)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {proposal.notes && (
          <div className="pp-section">
            <h2 className="pp-section-title">Notes</h2>
            <p className="pp-notes-text">{proposal.notes}</p>
          </div>
        )}

        {/* Terms */}
        <div className="pp-section">
          <h2 className="pp-section-title">Terms & Conditions</h2>
          <div className="pp-terms-box">
            {(proposal.terms || '').split('\n').map((line, i) => (
              <p key={i} className="pp-terms-line">{line}</p>
            ))}
          </div>
        </div>

        {/* Signature area */}
        <div className="pp-section pp-sign-section">
          <h2 className="pp-section-title">Sign Below</h2>
          <div className="pp-signer-name-row">
            <label className="pp-sign-label">Your Name</label>
            <input
              className="pp-sign-name-input"
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          <SignatureCanvas onSignature={handleSignature} />
          <label className="pp-agree-row">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            <span>I agree to the terms and conditions above and authorize this electronic signature.</span>
          </label>
          <button
            className="pp-sign-btn"
            disabled={!signatureData || !agreed || signing}
            onClick={handleSign}
          >
            {signing ? 'Submitting...' : 'Accept & Sign'}
          </button>
        </div>

        {/* Footer */}
        <div className="pp-footer">
          <p>This document is an electronic proposal from Precision Roofing.</p>
          <p>Proposal ID: {proposal.id}</p>
        </div>
      </div>
    </div>
  );
}
