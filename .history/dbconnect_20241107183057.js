const mysql = require("mysql2");

const sqlConnection = () => {
  return mysql
    .createConnection({
      user: "wpr",
      password: "fit2024",
    })
    .promise();
};

const sqlPool = mysql.createPool({
  host: "localhost",
  user: "wpr",
  password: "fit2024",
  database: "wpr<your_student_id>",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = {
  sqlConnection,
  sqlPool,
};
