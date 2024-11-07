const { promisePool } = require("./dbconnect.js");

const initDatabase = async () => {
  // Step 1: Use a single connection to create the database if it does not exist
  const singleConn = await promisePool.getConnection();
  try {
    await singleConn.query("CREATE DATABASE IF NOT EXISTS wpr2101040107");
    console.log("Database created or already exists");
  } catch (error) {
    console.error("Error creating database:", error.message);
    return; // Exit if database creation fails
  } finally {
    singleConn.release(); // Release the connection back to the pool
  }

  // Step 2: Use the new pool to set up tables
  try {
    await promisePool.query("USE wpr2101040107");
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS user (
        userId INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);
    console.log("Table 'user' created or already exists");

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS email (
        emailId INT PRIMARY KEY AUTO_INCREMENT,
        senderId INT,
        recipientId INT,
        subject VARCHAR(255),
        body TEXT,
        attachment VARCHAR(255) DEFAULT 'none',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipientId) REFERENCES user(userId),
        FOREIGN KEY (senderId) REFERENCES user(userId)
      )
    `);
    console.log("Table 'email' created or already exists");

    await initData(promisePool); // Initialize data
  } catch (error) {
    console.error("Error initializing database:", error.message);
  }
};

initDatabase();
