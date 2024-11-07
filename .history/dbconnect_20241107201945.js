const mysql = require("mysql2");

const pool = mysql
  .createPool({
    host: "localhost",
    user: "wpr",
    password: "fit2024",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();

// Function to ensure database creation
async function setupDatabase() {
  await pool.query("CREATE DATABASE IF NOT EXISTS wpr2101040107");
  await pool.query("USE wpr2101040107"); // Select the database after creation
}

setupDatabase();

module.exports = { promisePool: pool };
