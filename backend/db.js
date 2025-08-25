// db.js
const Database = require('better-sqlite3');
const path = require('path');

try {
  const dbPath = path.resolve(__dirname, 'database', 'ak_ledger.db');
  const db = new Database(dbPath);

  db.pragma('foreign_keys = ON');

  console.log('✅ Connected to SQLite database at:', dbPath);

  module.exports = db;
} catch (err) {
  console.error('❌ Failed to connect to SQLite database:', err.message);
  process.exit(1); // Exit the app if the DB connection fails
}
