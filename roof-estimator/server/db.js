const Database = require('better-sqlite3');
const path = require('path');

/* ═══════════════════════════════════════════════════════════════════════════
   SQLite Database — proposals.db
   ─────────────────────────────────────────────────────────────────────────
   This file creates (or opens) a single database file in the server/ folder.
   The file is created automatically the first time the server starts.
   ═══════════════════════════════════════════════════════════════════════════ */

const dbPath = path.join(__dirname, 'proposals.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
db.exec(`
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
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

module.exports = db;
