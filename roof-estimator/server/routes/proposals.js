const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const { sendProposalEmail } = require('../mailer');

/* ═══════════════════════════════════════════════════════════════════════════
   Proposals API Routes
   ─────────────────────────────────────────────────────────────────────────
   POST   /api/proposals          → Create a new proposal
   GET    /api/proposals           → List all proposals
   GET    /api/proposals/:id       → Get a single proposal
   PUT    /api/proposals/:id       → Update a proposal
   DELETE /api/proposals/:id       → Delete a proposal
   POST   /api/proposals/:id/send  → Mark as sent
   GET    /api/public/proposals/:id       → Public view (homeowner)
   POST   /api/public/proposals/:id/view  → Record that homeowner opened it
   POST   /api/public/proposals/:id/sign  → Submit signature
   ═══════════════════════════════════════════════════════════════════════════ */

// Helper: generate a short unique ID
function generateId() {
  return 'prop_' + crypto.randomBytes(6).toString('hex');
}

/* ─── Create proposal ─────────────────────────────────────────────────── */
router.post('/', (req, res) => {
  const {
    projectId, customerName, customerEmail, customerPhone,
    address, options, terms, notes, totalArea, pitch,
  } = req.body;

  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO proposals (id, project_id, customer_name, customer_email, customer_phone,
      address, options, terms, notes, total_area, pitch, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
  `).run(
    id, projectId || null, customerName || '', customerEmail || '', customerPhone || '',
    address || '', JSON.stringify(options || []), terms || '', notes || '',
    totalArea || 0, pitch || '', now, now
  );

  res.json({ success: true, id, status: 'draft' });
});

/* ─── List all proposals ──────────────────────────────────────────────── */
router.get('/', (_req, res) => {
  const proposals = db.prepare('SELECT * FROM proposals ORDER BY created_at DESC').all();
  // Parse JSON fields
  const parsed = proposals.map(p => ({
    ...p,
    options: JSON.parse(p.options || '[]'),
  }));
  res.json(parsed);
});

/* ─── Get single proposal ─────────────────────────────────────────────── */
router.get('/:id', (req, res) => {
  const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
  proposal.options = JSON.parse(proposal.options || '[]');
  res.json(proposal);
});

/* ─── Update proposal ─────────────────────────────────────────────────── */
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM proposals WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Proposal not found' });

  const {
    customerName, customerEmail, customerPhone,
    address, options, terms, notes, totalArea, pitch,
  } = req.body;

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE proposals SET
      customer_name = ?, customer_email = ?, customer_phone = ?,
      address = ?, options = ?, terms = ?, notes = ?,
      total_area = ?, pitch = ?, updated_at = ?
    WHERE id = ?
  `).run(
    customerName || '', customerEmail || '', customerPhone || '',
    address || '', JSON.stringify(options || []), terms || '', notes || '',
    totalArea || 0, pitch || '', now, req.params.id
  );

  res.json({ success: true });
});

/* ─── Delete proposal ─────────────────────────────────────────────────── */
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM proposals WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

/* ─── Mark as sent + email customer ──────────────────────────────────── */
router.post('/:id/send', async (req, res) => {
  const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  const now = new Date().toISOString();
  db.prepare(`UPDATE proposals SET status = 'sent', sent_at = ?, updated_at = ? WHERE id = ?`)
    .run(now, now, req.params.id);

  // Send email to customer (non-blocking — don't fail if email errors)
  let emailSent = false;
  let emailError = null;
  try {
    proposal.options = JSON.parse(proposal.options || '[]');
    await sendProposalEmail(proposal);
    emailSent = true;
  } catch (err) {
    emailError = err.message;
    console.error('[Mailer] Failed to send proposal email:', err.message);
  }

  res.json({ success: true, status: 'sent', emailSent, emailError });
});

/* ═══════════════════════════════════════════════════════════════════════════
   Public routes — these are what the HOMEOWNER accesses (no auth needed)
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Public: View proposal ───────────────────────────────────────────── */
router.get('/public/:id', (req, res) => {
  const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
  proposal.options = JSON.parse(proposal.options || '[]');
  // Don't expose internal fields to public
  delete proposal.signer_ip;
  res.json(proposal);
});

/* ─── Public: Record view ─────────────────────────────────────────────── */
router.post('/public/:id/view', (req, res) => {
  const proposal = db.prepare('SELECT status FROM proposals WHERE id = ?').get(req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  // Only update to 'viewed' if currently 'sent' (don't downgrade 'signed')
  if (proposal.status === 'sent') {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE proposals SET status = 'viewed', viewed_at = ?, updated_at = ? WHERE id = ?
    `).run(now, now, req.params.id);
  }

  res.json({ success: true });
});

/* ─── Public: Sign proposal ───────────────────────────────────────────── */
router.post('/public/:id/sign', (req, res) => {
  const proposal = db.prepare('SELECT status FROM proposals WHERE id = ?').get(req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  if (proposal.status === 'signed') {
    return res.status(400).json({ error: 'Proposal already signed' });
  }

  const { signatureImage, signerName, selectedOption } = req.body;
  if (!signatureImage) {
    return res.status(400).json({ error: 'Signature is required' });
  }

  const now = new Date().toISOString();
  // Get client IP
  const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

  db.prepare(`
    UPDATE proposals SET
      status = 'signed', signature_image = ?, signer_name = ?,
      signer_ip = ?, signed_at = ?, selected_option = ?, updated_at = ?
    WHERE id = ?
  `).run(signatureImage, signerName || '', ip, now, selectedOption ?? 0, now, req.params.id);

  // Return full proposal for PDF generation
  const signed = db.prepare('SELECT * FROM proposals WHERE id = ?').get(req.params.id);
  signed.options = JSON.parse(signed.options || '[]');
  res.json({ success: true, proposal: signed });
});

module.exports = router;
