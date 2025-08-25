// server/dbPool.js
require('dotenv').config();
const sql = require('mssql');

// build config from .env
const config = {
  user    : process.env.DB_USER,
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  server  : process.env.DB_SERVER   || process.env.DB_HOST,
  database: process.env.DB_NAME     || 'AK_Ledger',
  port    : parseInt(process.env.DB_PORT || '1433', 10),
  options : { trustServerCertificate: true }, // good for local dev / self-signed
  pool    : { max: 10 },
  connectionTimeout: 30000
};

// create one pool and start connecting immediately
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Ohh Yeah Connected to database');
    return pool;          // <- resolved value used by routes
  })
  .catch(err => {
    console.error('Database Connection Warr Gya', err);
    throw err;            // crash startup if DB is unreachable
  });

module.exports = poolPromise;      // <-- export the promise only
