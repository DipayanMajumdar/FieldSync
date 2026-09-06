const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DB_URI,
});

pool.query("SELECT NOW()")
  .then((r) => {
    console.log("DATABASE CONNECTED:", r.rows[0]);
  })
  .catch((e) => {
    console.error("DATABASE CONNECTION FAILED:", e);
  });

module.exports = pool;