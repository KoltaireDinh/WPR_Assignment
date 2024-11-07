// dbconnect.js
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "wpr",
  password: "fit2024",
  database: "wpr2101040107",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = { pool };
