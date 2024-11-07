const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: "wpr",
  password: "fit2024",
  // Do not specify the database here initially
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const promisePool = pool.promise();

module.exports = {
  promisePool,
};
