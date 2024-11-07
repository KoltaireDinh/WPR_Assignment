const mysql = require("mysql2");
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "wpr",
  password: process.env.DB_PASSWORD || "fit2024",
  database: process.env.DB_NAME || "wpr2101040107",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Promisify the pool query method for easier async/await usage
const promisePool = pool.promise();

module.exports = {
  promisePool,
};
