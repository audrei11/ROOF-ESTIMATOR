import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getProject, getAllProjects } from '../utils/storage';
import { getAllMockProjects } from '../data/projectData';

/* ═══════════════════════════════════════════════════════════════════════════
   ProposalBuilder — Contractor creates / edits a proposal
   ─────────────────────────────────────────────────────────────────────────
   Routes:
     /proposals/new            → new blank proposal
     /proposals/new?project=id → new proposal linked to a measurement
     /proposals/edit/:id       → edit existing draft
   ═══════════════════════════════════════════════════════════════════════════ */

const API = '/api/proposals';

const DEFAULT_TERMS = `1. All work will be performed in a professional and workmanlike manner.
2. Work is guaranteed for a period of 10 years from date of completion.
3. Payment is due upon completion unless otherwise agreed upon in writing.
4. Any changes to the scope of work may result in additional charges.
5. Contractor will obtain all necessary permits and inspections.
6. Homeowner is responsible for moving personal property away from work areas.
7. This proposal is valid for 30 days from the date of issuance.`;

const EMPTY_LINE = { description: '', qty: 1, unit: 'ea', unitPrice: 0 };

const UNIT_OPTIONS = ['ea', 'sq', 'sq ft', 'ln ft', 'bundle', 'roll', 'sheet', 'hour'];

export default function ProposalBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const editId = searchParams.get('edit');

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [totalArea, setTotalArea] = useState(0);
  const [pitch, setPitch] = useState('');
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Multi-option pricing: up to 3 options
  const [options, setOptions] = useState([
    { name: 'Option A', lineItems: [{ ...EMPTY_LINE }] },
  ]);

  // Load project data if linked
  useEffect(() => {
    if (projectId) {
      const allProjects = [...getAllMockProjects(), ...getAllProjects()];
      const project = allProjects.find(p => p.id === projectId) || getProject(projectId);
      if (project) {
        setAddress(project.address || '');
        setTotalArea(project.totalArea || 0);
        setPitch(project.pitch || '');
      }
    }
  }, [projectId]);

  // Load existing proposal if editing
  useEffect(() => {
    if (!editId) return;
    fetch(`${API}/${editId}`)
      .then(r => r.json())
      .then(data => {
        setCustomerName(data.customer_name || '');
        setCustomerEmail(data.customer_email || '');
        setCustomerPhone(data.customer_phone || '');
        setAddress(data.address || '');
        setTotalArea(data.total_area || 0);
        setPitch(data.pitch || '');
        setTerms(data.terms || DEFAULT_TERMS);
        setNotes(data.notes || '');
        if (data.options?.length) setOptions(data.options);
      })
      .catch(err => console.error('Failed to load proposal:', err));
  }, [editId]);

  // Add a pricing option (max 3)
  const addOption = () => {
    if (options.length >= 3) return;
    const labels = ['Option A', 'Option B', 'Option C'];
    setOptions([...options, { name: labels[options.length], lineItems: [{ ...EMPTY_LINE }] }]);
  };

  // Remove a pricing option
  const removeOption = (idx) => {
    if (options.length <= 1) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  // Update a line item field
  const updateLine = (optIdx, lineIdx, field, value) => {
    const next = options.map((opt, oi) => {
      if (oi !== optIdx) return opt;
      return {
        ...opt,
        lineItems: opt.lineItems.map((li, li2) => {
          if (li2 !== lineIdx) return li;
          return { ...li, [field]: field === 'qty' || field === 'unitPrice' ? Number(value) || 0 : value };
        }),
      };
    });
    setOptions(next);
  };

  // Add line item to an option
  const addLine = (optIdx) => {
    const next = options.map((opt, i) => {
      if (i !== optIdx) return opt;
      return { ...opt, lineItems: [...opt.lineItems, { ...EMPTY_LINE }] };
    });
    setOptions(next);
  };

  // Remove line item
  const removeLine = (optIdx, lineIdx) => {
    const next = options.map((opt, i) => {
      if (i !== optIdx) return opt;
      if (opt.lineItems.length <= 1) return opt; // keep at least 1
      return { ...opt, lineItems: opt.lineItems.filter((_, li) => li !== lineIdx) };
    });
    setOptions(next);
  };

  // Calculate option total
  const optionTotal = (opt) => opt.lineItems.reduce((sum, li) => sum + (li.qty * li.unitPrice), 0);

  // Save proposal
  const saveProposal = async (andSend = false) => {
    setSaving(true);
    try {
      const body = {
        projectId, customerName, customerEmail, customerPhone,
        address, options, terms, notes, totalArea, pitch,
      };

      let id = editId;
      if (editId) {
        await fetch(`${API}/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        id = data.id;
      }

      if (andSend && id) {
        await fetch(`${API}/${id}/send`, { method: 'POST' });
      }

      navigate('/proposals');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save proposal. Is the server running on port 3001?');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-page">
      {/* Top bar */}
      <div className="pb-topbar">
        <button className="pb-back-btn" onClick={() => navigate('/proposals')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Proposals
        </button>
        <h1 className="pb-topbar-title">{editId ? 'Edit Proposal' : 'New Proposal'}</h1>
        <div className="pb-topbar-actions">
          <button className="pb-save-btn" disabled={saving} onClick={() => saveProposal(false)}>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="pb-send-btn" disabled={saving || !customerName.trim()} onClick={() => saveProposal(true)}>
            {saving ? 'Sending...' : 'Save & Send'}
          </button>
        </div>
      </div>

      <div className="pb-body">
        {/* Left column: form */}
        <div className="pb-form">

          {/* Customer info */}
          <div className="pb-section">
            <h2 className="pb-section-title">Customer Information</h2>
            <div className="pb-field-row">
              <div className="pb-field">
                <label className="pb-label">Full Name *</label>
                <input className="pb-input" placeholder="John Smith" value={customerName}
                  onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div className="pb-field">
                <label className="pb-label">Email</label>
                <input className="pb-input" type="email" placeholder="john@email.com" value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)} />
              </div>
            </div>
            <div className="pb-field-row">
              <div className="pb-field">
                <label className="pb-label">Phone</label>
                <input className="pb-input" type="tel" placeholder="(555) 123-4567" value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)} />
              </div>
              <div className="pb-field">
                <label className="pb-label">Property Address</label>
                <input className="pb-input" placeholder="123 Main St, City, State" value={address}
                  onChange={e => setAddress(e.target.value)} />
              </div>
            </div>
            {(totalArea > 0 || pitch) && (
              <div className="pb-measurement-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h18v18H3z"/><path d="M3 9h18M9 3v18"/>
                </svg>
                {totalArea > 0 && <span>{Math.round(totalArea).toLocaleString()} sq ft</span>}
                {pitch && <span>Pitch: {pitch}</span>}
                <span className="pb-measurement-linked">Linked to measurement</span>
              </div>
            )}
          </div>

          {/* Pricing options */}
          <div className="pb-section">
            <div className="pb-section-header">
              <h2 className="pb-section-title">Pricing</h2>
              {options.length < 3 && (
                <button className="pb-add-option-btn" onClick={addOption}>
                  + Add Option
                </button>
              )}
            </div>

            {options.map((opt, optIdx) => (
              <div key={optIdx} className="pb-option-card">
                <div className="pb-option-header">
                  <input className="pb-option-name" value={opt.name}
                    onChange={e => {
                      const next = [...options];
                      next[optIdx] = { ...opt, name: e.target.value };
                      setOptions(next);
                    }}
                  />
                  {options.length > 1 && (
                    <button className="pb-option-remove" onClick={() => removeOption(optIdx)} title="Remove option">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Line items table */}
                <table className="pb-line-table">
                  <thead>
                    <tr>
                      <th className="pb-th" style={{ width: '40%' }}>Description</th>
                      <th className="pb-th" style={{ width: '10%' }}>Qty</th>
                      <th className="pb-th" style={{ width: '15%' }}>Unit</th>
                      <th className="pb-th" style={{ width: '15%' }}>Unit Price</th>
                      <th className="pb-th" style={{ width: '15%' }}>Total</th>
                      <th className="pb-th" style={{ width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {opt.lineItems.map((li, liIdx) => (
                      <tr key={liIdx} className="pb-line-row">
                        <td><input className="pb-line-input" placeholder="e.g. Tear-off existing shingles"
                          value={li.description} onChange={e => updateLine(optIdx, liIdx, 'description', e.target.value)} /></td>
                        <td><input className="pb-line-input pb-line-num" type="number" min="0" step="1"
                          value={li.qty} onChange={e => updateLine(optIdx, liIdx, 'qty', e.target.value)} /></td>
                        <td>
                          <select className="pb-line-select" value={li.unit}
                            onChange={e => updateLine(optIdx, liIdx, 'unit', e.target.value)}>
                            {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td>
                          <div className="pb-price-wrap">
                            <span className="pb-dollar">$</span>
                            <input className="pb-line-input pb-line-num" type="number" min="0" step="0.01"
                              value={li.unitPrice} onChange={e => updateLine(optIdx, liIdx, 'unitPrice', e.target.value)} />
                          </div>
                        </td>
                        <td className="pb-line-total">${(li.qty * li.unitPrice).toFixed(2)}</td>
                        <td>
                          {opt.lineItems.length > 1 && (
                            <button className="pb-line-remove" onClick={() => removeLine(optIdx, liIdx)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="pb-option-footer">
                  <button className="pb-add-line-btn" onClick={() => addLine(optIdx)}>+ Add Line Item</button>
                  <div className="pb-option-total">
                    Total: <strong>${optionTotal(opt).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Terms */}
          <div className="pb-section">
            <h2 className="pb-section-title">Terms & Conditions</h2>
            <textarea className="pb-textarea" rows={8} value={terms}
              onChange={e => setTerms(e.target.value)} />
          </div>

          {/* Notes */}
          <div className="pb-section">
            <h2 className="pb-section-title">Additional Notes</h2>
            <textarea className="pb-textarea" rows={3} value={notes}
              placeholder="Any special instructions or notes for the homeowner..."
              onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        {/* Right column: live preview */}
        <div className="pb-preview-wrap">
          <div className="pb-preview-label">Preview</div>
          <div className="pb-preview">
            <div className="pb-prev-header">
              <div className="pb-prev-logo">T</div>
              <div>
                <div className="pb-prev-company">Precision Roofing</div>
                <div className="pb-prev-sub">Roofing Proposal</div>
              </div>
            </div>
            <div className="pb-prev-divider" />
            <div className="pb-prev-row">
              <div><span className="pb-prev-label">Prepared for:</span> {customerName || '—'}</div>
              <div><span className="pb-prev-label">Date:</span> {new Date().toLocaleDateString()}</div>
            </div>
            <div className="pb-prev-address">{address || 'No address'}</div>
            {totalArea > 0 && <div className="pb-prev-meta">{Math.round(totalArea).toLocaleString()} sq ft &middot; {pitch || 'No pitch'}</div>}
            <div className="pb-prev-divider" />
            {options.map((opt, i) => (
              <div key={i} className="pb-prev-option">
                <div className="pb-prev-option-name">{opt.name}</div>
                {opt.lineItems.filter(li => li.description).map((li, j) => (
                  <div key={j} className="pb-prev-line">
                    <span>{li.description}</span>
                    <span>${(li.qty * li.unitPrice).toFixed(2)}</span>
                  </div>
                ))}
                <div className="pb-prev-option-total">
                  <span>Total</span>
                  <span>${optionTotal(opt).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
