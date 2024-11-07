const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "localhost",
  user: "wpr",
  password: "fit2024",
  database: "wpr<your_student_id>",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const sqlConnection = () => {
  return mysql
    .createConnection({
      user: "root",
      password: "admin",
    })
    .promise();
};

module.exports = {
  sqlPool,
  sqlConnection,
};
