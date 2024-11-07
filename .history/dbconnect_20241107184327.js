const mysql = require("mysql2");

const sqlPool = mysql.createPool({
  host: "localhost",
  user: "wpr",
  password: "fit2024",
  database: "wpr2101040107",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const sqlConnection = () => {
  return mysql
    .createConnection({
      user: "wpr",
      password: "fit2024",
    })
    .promise();
};

module.exports = {
  sqlPool,
  sqlConnection,
};
