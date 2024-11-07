const mysql = require("mysql2");

const sqlConnection = () => {
  return mysql
    .createConnection({
      user: "root",
      password: "admin",
    })
    .promise();
};

const sqlPool = () => {
  return mysql
    .createPool({
      user: "root",
      password: "admin",
      database: "wpr2023",
    })
    .promise();
};

module.exports = {
  sqlConnection,
  sqlPool,
};
