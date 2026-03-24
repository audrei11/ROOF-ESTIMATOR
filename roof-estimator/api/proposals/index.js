const { sql, initDb } = require('../_db');
const crypto = require('crypto');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
}

function generateId() {
  return 'prop_' + crypto.randomBytes(6).toString('hex');
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  await initDb();

  if (req.method === 'GET') {
    const result = await sql`SELECT * FROM proposals ORDER BY created_at DESC`;
    const proposals = result.rows.map(p => ({
      ...p,
      options: JSON.parse(p.options || '[]'),
    }));
    return res.json(proposals);
  }

  if (req.method === 'POST') {
    const {
      projectId, customerName, customerEmail, customerPhone,
      address, options, terms, notes, totalArea, pitch,
    } = req.body;

    const id = generateId();
    const now = new Date().toISOString();

    await sql`
      INSERT INTO proposals (id, project_id, customer_name, customer_email, customer_phone,
        address, options, terms, notes, total_area, pitch, status, created_at, updated_at)
      VALUES (${id}, ${projectId || null}, ${customerName || ''}, ${customerEmail || ''},
        ${customerPhone || ''}, ${address || ''}, ${JSON.stringify(options || [])},
        ${terms || ''}, ${notes || ''}, ${totalArea || 0}, ${pitch || ''}, 'draft', ${now}, ${now})
    `;

    return res.json({ success: true, id, status: 'draft' });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
