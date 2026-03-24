const { sql, initDb } = require('../../_db');

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
  const now = new Date().toISOString();

  await sql`
    UPDATE proposals SET status = 'sent', sent_at = ${now}, updated_at = ${now} WHERE id = ${id}
  `;

  return res.json({ success: true, status: 'sent' });
};
