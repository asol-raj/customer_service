// config/db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',       // <-- standard name
  database: process.env.DB_NAME || 'supportdesk',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT || 10),
  queueLimit: 0,
  // optional: support big numbers as numbers
  // decimalNumbers: true
});

// Non-blocking check: try to get a connection but don't throw from module import
(async function testConnection() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log('✅ MySQL pool created and connection test succeeded.');
  } catch (err) {
    // Don't throw - just log. Let the app decide how to handle runtime errors.
    console.error('❌ MySQL connection test failed:', err.message);
  }
})();

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    console.log('Shutting down DB pool...');
    await pool.end();
    console.log('DB pool closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error closing DB pool', err);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = pool;
