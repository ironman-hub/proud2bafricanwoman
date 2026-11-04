// Create or reset an admin account:  npm run make-admin -- email@example.com NewPassword123
// Works locally, and against the live Turso database if TURSO_DATABASE_URL / TURSO_AUTH_TOKEN are in .env
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { createClient } = require('@libsql/client');
const [emailArg, password, name = 'Nelly'] = process.argv.slice(2);
if (!emailArg || !password || password.length < 8) { console.log('Usage: npm run make-admin -- email@example.com Password123   (8+ characters)'); process.exit(1); }
const email = emailArg.trim().toLowerCase();
(async () => {
  const dir = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
  fs.mkdirSync(dir, { recursive: true });
  const db = createClient({ url: process.env.TURSO_DATABASE_URL || 'file:' + path.join(dir, 'shop.db'), authToken: process.env.TURSO_AUTH_TOKEN });
  await db.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, is_admin INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))");
  const hash = bcrypt.hashSync(password, 10);
  const r = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] });
  if (r.rows.length) await db.execute({ sql: 'UPDATE users SET is_admin = 1, password_hash = ? WHERE id = ?', args: [hash, r.rows[0].id] });
  else await db.execute({ sql: 'INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, 1)', args: [name, email, hash] });
  console.log(`✓ Admin ready: ${email} — log in at /account`);
})().catch(e => { console.error(e.message); process.exit(1); });
