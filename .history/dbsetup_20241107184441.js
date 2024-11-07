const { sqlPool, sqlConnection } = require("./dbconnect.js");

const initDatabase = async () => {
  // Step 1: Use single connection to create database if not exists
  const singleConn = sqlConnection(); // Use a single connection for creating the database
  try {
    await singleConn.query("CREATE DATABASE IF NOT EXISTS wpr2101040107");
    console.log("Database created or already exists");
  } catch (error) {
    console.error("Error creating database:", error.message);
    return; // Exit if database creation fails
  } finally {
    await singleConn.end(); // Close single connection after creating the database
  }

  // Step 2: Use connection pool to connect to the created database and set up tables
  const conn = { sqlPool };
  try {
    await conn.query("USE wpr2101040107");

    // Create tables
    await sqlPool.query(`
      CREATE TABLE IF NOT EXISTS user (
        userId INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);
    console.log("Table 'user' created or already exists");

    await sqlPool.query(`
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

    await initData(conn); // Initialize data
  } catch (error) {
    console.error("Error initializing database:", error.message);
  }
};

const initData = async (conn) => {
  const body = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;

  try {
    await conn.query(`
      INSERT IGNORE INTO user (username, email, password)
      VALUES 
        ('MynameisA', 'a@a.com', 'aaa'),
        ('Dinh Tuan Kiet', 'kiet2608@gmail.com', 'kiet'),
        ('Alexander Smith', 'smithh@gmai.com', 'smith')
    `);
    console.log("Users inserted");

    await conn.query(
      `INSERT INTO email (senderId, recipientId, subject, body, attachment) VALUES
      (1, 2, 'A to Kiet', ?, 'none'),
      (1, 2, 'A to Kiet', ?, 'none'),
      (1, 3, 'A to Smith', ?, 'none'),
      (1, 3, 'A to Smith', ?, 'none'),
      (3, 1, 'Smith to A', ?, 'none'),
      (3, 1, 'Smith to A', ?, 'none'),
      (3, 2, 'Smith to Kiet', ?, 'none'),
      (3, 2, 'Smith to Kiet', ?, 'none'),
      (2, 1, 'Kiet to A', ?, 'none'),
      (2, 1, 'Kiet to A', ?, 'https://unsplash.com/illustrations/a-pink-square-with-a-bunch-of-flowers-on-it-z6OWGV0csV0'),
      (2, 3, 'Kiet to Smith', ?, 'none'),
      (2, 3, 'Kiet to Smith', ?, 'none')
    `,
      [body, body, body, body, body, body, body, body, body, body, body, body]
    );
    console.log("Emails inserted");
  } catch (error) {
    console.error("Error initializing data:", error.message);
  }
};

initDatabase();
