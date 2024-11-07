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

module.exports = { promisePool: pool };
