require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function runMigrations() {
  const sql = fs.readFileSync(path.join(__dirname, '001_initial_schema.sql'), 'utf8');
  try {
    await db.query(sql);
    console.log('Migration applied: 001_initial_schema.sql');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

runMigrations();
