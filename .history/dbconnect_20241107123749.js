const mysql = require("mysql2");

// Create and export the connection pool
const sqlPool = () => {
  return mysql
    .createPool({
      host: "localhost",
      user: "wpr",
      password: "fit2024",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
    .promise(); // Return a promise-based pool
};

module.exports = { sqlPool };
