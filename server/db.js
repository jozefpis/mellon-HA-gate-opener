import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The DB file keeps state locally in the project. Mount /app/data as a
// persistent volume so a redeploy doesn't wipe the data.
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'mellon.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    token       TEXT PRIMARY KEY,
    label       TEXT NOT NULL DEFAULT '',
    theme       TEXT NOT NULL DEFAULT 'basic',
    max_uses    INTEGER NOT NULL,
    used_count  INTEGER NOT NULL DEFAULT 0,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS openings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    token       TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    ip          TEXT,
    success     INTEGER NOT NULL DEFAULT 1
  );
`);

// ---- Migrations -----------------------------------------------------------
// Per-link locale override. Empty string means "inherit the server default".
const linkCols = db.prepare(`PRAGMA table_info(links)`).all().map((c) => c.name);
if (!linkCols.includes('locale')) {
  db.exec(`ALTER TABLE links ADD COLUMN locale TEXT NOT NULL DEFAULT ''`);
}

export default db;
