const mysql = require("mysql2");

const sqlConnection = () => {
  return mysql
    .createConnection({
      user: "wpr",
      password: "fit2024",
    })
    .promise();
};

const sqlPool = () => {
  return mysql
    .createPool({
      user: "wpr",
      password: "fit2024",
      database: "wpr2101040107",
    })
    .promise();
};

module.exports = {
  sqlConnection,
  sqlPool,
};
