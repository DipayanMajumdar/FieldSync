require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const pool = new Pool({ connectionString: process.env.DB_URI, ssl: { rejectUnauthorized: false } });
async function run() {
  const result = await pool.query("SELECT id, email, role FROM users WHERE email = 'engineer@fieldsync.com'");
  if (result.rows.length > 0) { console.log('User exists:', result.rows[0]); }
  else {
    const hash = await bcrypt.hash('engineer123', 10);
    const ins = await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role", ['Field Engineer', 'engineer@fieldsync.com', hash, 'field_engineer']);
    console.log('Created:', ins.rows[0]);
  }
  pool.end();
}
run();

