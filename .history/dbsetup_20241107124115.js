const { sqlPool } = require("./dbconnect.js");
const conn = sqlPool(); // Use the pool connection

const initDatabase = async () => {
  try {
    // Creating the database and switching to it (not needed for pool, but we'll handle it)
    conn.query("CREATE DATABASE IF NOT EXISTS wpr2101040107");
    console.log("Database created or already exists");

    await conn.query("USE wpr2101040107");

    // Create tables
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user (
        userId INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);
    console.log("Table 'user' created or already exists");

    await conn.query(`
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

    await initData(); // Initialize data
  } catch (error) {
    console.error("Error initializing database:", error.message);
  }
};

const initData = async () => {
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
