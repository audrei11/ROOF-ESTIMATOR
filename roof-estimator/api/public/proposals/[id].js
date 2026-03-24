const { sql, initDb } = require('../../_db');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await initDb();
  const { id } = req.query;

  const result = await sql`SELECT * FROM proposals WHERE id = ${id}`;
  const proposal = result.rows[0];
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  proposal.options = JSON.parse(proposal.options || '[]');
  delete proposal.signer_ip;

  return res.json(proposal);
};
