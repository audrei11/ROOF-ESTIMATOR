const { sql, initDb } = require('../_db');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  await initDb();
  const { id } = req.query;

  if (req.method === 'GET') {
    const result = await sql`SELECT * FROM proposals WHERE id = ${id}`;
    const proposal = result.rows[0];
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    proposal.options = JSON.parse(proposal.options || '[]');
    return res.json(proposal);
  }

  if (req.method === 'PUT') {
    const existing = await sql`SELECT id FROM proposals WHERE id = ${id}`;
    if (!existing.rows[0]) return res.status(404).json({ error: 'Proposal not found' });

    const {
      customerName, customerEmail, customerPhone,
      address, options, terms, notes, totalArea, pitch,
    } = req.body;

    const now = new Date().toISOString();

    await sql`
      UPDATE proposals SET
        customer_name = ${customerName || ''}, customer_email = ${customerEmail || ''},
        customer_phone = ${customerPhone || ''}, address = ${address || ''},
        options = ${JSON.stringify(options || [])}, terms = ${terms || ''},
        notes = ${notes || ''}, total_area = ${totalArea || 0},
        pitch = ${pitch || ''}, updated_at = ${now}
      WHERE id = ${id}
    `;

    return res.json({ success: true });
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM proposals WHERE id = ${id}`;
    return res.json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
