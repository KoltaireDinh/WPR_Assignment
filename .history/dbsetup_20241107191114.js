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

  // Step 3: Use the new pool to set up tables
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

const initData = async (promisePool) => {
  const body = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;

  try {
    await promisePool.query(`
      INSERT IGNORE INTO user (username, email, password)
      VALUES 
        ('MynameisA', 'a@a.com', 'aaa'),
        ('D inh Tuan Kiet', 'kiet2608@gmail.com', 'kiet'),
        ('Alexander Smith', 'smithh@gmai.com', 'smith')
    `);
    console.log("Users inserted");

    await promisePool.query(
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
