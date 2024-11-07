const mysql = require("mysql2/promise");
const { promisePool } = require("./dbconnect.js");

const initDatabase = async () => {
  const connection = await promisePool.getConnection();
  try {
    // Tạo database nếu chưa tồn tại
    await connection.query("CREATE DATABASE IF NOT EXISTS wpr2101040107");
    console.log("Database created or already exists");

    // Sử dụng database vừa tạo
    await connection.query("USE wpr2101040107");

    // Tạo bảng `user`
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user (
        userId INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);
    console.log("Table 'user' created or already exists");

    // Tạo bảng `email`
    await connection.query(`
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

    await initData(connection); // Khởi tạo dữ liệu mẫu
  } catch (error) {
    console.error("Error initializing database:", error.message);
  } finally {
    connection.release(); // Giải phóng kết nối
  }
};

const initData = async (connection) => {
  const body = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.`;

  try {
    await connection.query(`
      INSERT IGNORE INTO user (username, email, password)
      VALUES 
        ('MynameisA', 'a@a.com', 'aaa'),
        ('Dinh Tuan Kiet', 'kiet2608@gmail.com', 'kiet'),
        ('Alexander Smith', 'smithh@gmai.com', 'smith')
    `);
    console.log("Users inserted");

    await connection.query(
      `INSERT INTO email (senderId, recipientId, subject, body, attachment) VALUES
      (1, 2, 'A to Kiet', ?, 'none'),
      (1, 3, 'A to Smith', ?, 'none')
    `,
      [body, body]
    );
    console.log("Emails inserted");
  } catch (error) {
    console.error("Error initializing data:", error.message);
  }
};

initDatabase();
