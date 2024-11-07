const mysql = require("mysql2");

const pool = mysql
  .createPool({
    host: "localhost",
    user: "wpr2",
    password: "fit2024",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();

// Function to ensure database creation
async function setupDatabase() {
  try {
    await pool.query("CREATE DATABASE IF NOT EXISTS wpr2101040107");
    await pool.query("USE wpr2101040107"); // Select the database after creation
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

setupDatabase();

module.exports = { promisePool: pool };
