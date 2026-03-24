const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      customer_name TEXT DEFAULT '',
      customer_email TEXT DEFAULT '',
      customer_phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      options TEXT DEFAULT '[]',
      terms TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      selected_option INTEGER,
      status TEXT DEFAULT 'draft',
      total_area REAL DEFAULT 0,
      pitch TEXT DEFAULT '',
      signature_image TEXT,
      signer_name TEXT,
      signer_ip TEXT,
      signed_at TEXT,
      viewed_at TEXT,
      sent_at TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `;
}

module.exports = { sql, initDb };
