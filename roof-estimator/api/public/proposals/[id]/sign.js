const { sql, initDb } = require('../../../_db');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await initDb();
  const { id } = req.query;

  const result = await sql`SELECT status FROM proposals WHERE id = ${id}`;
  const proposal = result.rows[0];
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  if (proposal.status === 'signed') {
    return res.status(400).json({ error: 'Proposal already signed' });
  }

  const { signatureImage, signerName, selectedOption } = req.body;
  if (!signatureImage) return res.status(400).json({ error: 'Signature is required' });

  const now = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

  await sql`
    UPDATE proposals SET
      status = 'signed', signature_image = ${signatureImage}, signer_name = ${signerName || ''},
      signer_ip = ${ip}, signed_at = ${now}, selected_option = ${selectedOption ?? 0}, updated_at = ${now}
    WHERE id = ${id}
  `;

  const signedResult = await sql`SELECT * FROM proposals WHERE id = ${id}`;
  const signed = signedResult.rows[0];
  signed.options = JSON.parse(signed.options || '[]');

  return res.json({ success: true, proposal: signed });
};
