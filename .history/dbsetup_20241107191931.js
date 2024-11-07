const mysql = require("mysql2/promise");
const { promisePool } = require("./dbconnect.js");

const initDatabase = async () => {
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

  // Now create a new pool with the database specified
  const dbPool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: "wpr",
    password: "fit2024",
    database: "wpr2101040107", // Specify the database now
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const dbPromisePool = dbPool.promise();

  try {
    await dbPromisePool.query(`
      CREATE TABLE IF NOT EXISTS user (
        userId INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);
    console.log("Table 'user' created or already exists");

    await dbPromisePool.query(`
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

    await initData(dbPromisePool); // Initialize data
  } catch (error) {
    console.error("Error initializing database:", error.message);
  } finally {
    await dbPool.end(); // Close the pool
  }
};

const initData = async (dbPromisePool) => {
  // Your data initialization logic here
};

initDatabase();
