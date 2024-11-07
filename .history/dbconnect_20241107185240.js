const mysql = require("mysql2");
const pool = mysql.createPool({
  host: "localhost",
  user: "wpr",
  password: "fit2024",
  database: "wpr2101040107",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Promisify the pool query method for easier async/await usage
const promisePool = pool.promise();

module.exports = {
  promisePool,
};
