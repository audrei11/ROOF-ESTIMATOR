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

  if (proposal.status === 'sent') {
    const now = new Date().toISOString();
    await sql`
      UPDATE proposals SET status = 'viewed', viewed_at = ${now}, updated_at = ${now} WHERE id = ${id}
    `;
  }

  return res.json({ success: true });
};
