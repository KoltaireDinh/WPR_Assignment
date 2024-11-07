"use strict";
var path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const { pool } = require("./dbconnect.js");
const app = express();

app.use(express.static(__dirname));
app.use("/partials", express.static(__dirname + "/views/partials"));
app.use("/pages", express.static(__dirname + "/views/pages"));
app.use("/notification", express.static(__dirname + "/views/notification"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(cookieParser());
app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true,
  })
);

const cookieEncode = (val) => {
  return val;
};

app.get("/", function (req, res, next) {
  if (req.cookies.user != null) {
    return res.redirect("/inbox");
  }
  return res.redirect("/sign-in");
});

app.get("/get-cookie", (req, res) => {
  res.send(req.cookies);
});

app.get("/sign-in", function (req, res, next) {
  res.render("pages/signin/signin", { title: "Sign in" });
});

app.post("/sign-in", async (req, res) => {
  const { email, psw } = req.body;
  const sql = "SELECT * FROM `user` WHERE `email` = ? AND `password` = ?";

  try {
    const [rows] = await pool.query(sql, [email, psw]);
    if (rows.length > 0) {
      const user = {
        userId: rows[0].userId,
        email: rows[0].email,
        fullname: rows[0].fullname,
      };

      res.cookie("user", JSON.stringify(user), {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
      });

      console.log("Cookie set with user:", user);
      return res.json({
        status: 200,
        message: "Login successful",
        user: user,
      });
    } else {
      return res.status(401).json({
        status: 401,
        message: "Invalid credentials",
      });
    }
  } catch (err) {
    console.error("Sign-in error:", err);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  }
});

app.get("/sign-up", function (req, res, next) {
  res.render("pages/signup/signup", { title: "Sign up" });
});

app.post("/sign-up", async (req, res) => {
  const { fullname, email, psw } = req.body;
  console.log(email);

  const sql = "INSERT INTO USER(username, email, password) VALUES (?, ?, ?)";

  try {
    const [result] = await pool.query(sql, [fullname, email, psw]);
    console.log(result);
    res.json({ isSuccess: true });
  } catch (error) {
    console.log(error);
    res.json({ isSuccess: false, errorMessage: error.sqlMessage });
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("user");
  res.redirect("/sign-in");
});

app.get("/inbox", (req, res) => {
  console.log("Cookies received:", req.cookies);
  if (!req.cookies.user) {
    console.error("User not authenticated. Please sign in.");
    return res.redirect("/sign-in");
  }

  const user = JSON.parse(req.cookies.user);
  const params = req.query.page;
  if (params === undefined) {
    res.redirect("/inbox?page=1");
  }

  return res.render("layout/layout.ejs", {
    title: "Inbox page",
    name: user.username,
    id: user.userId,
  });
});

app.get("/outbox", (req, res) => {
  console.log("Cookies received:", req.cookies);
  if (!req.cookies.user) {
    return res.redirect("/sign-in");
  }
  const user = JSON.parse(req.cookies.user);
  const params = req.query.page;
  if (params === undefined) {
    return res.redirect("/outbox?page=1");
  }
  return res.render("layout/layout.ejs", {
    title: "Outbox page",
    name: user.username,
    id: user.userId,
  });
});

app.get("/get/email/:option/:id", async (req, res) => {
  const id = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;
  let sql = "";
  let countSql = "";

  try {
    if (req.params.option == "received-email") {
      sql = `
        SELECT 
          email.emailId, 
          email.subject, 
          email.body, 
          email.sent_at, 
          user.email as sender,
          user.username as senderName
        FROM email 
        INNER JOIN user ON user.userId = email.senderId 
        WHERE email.recipientId = ? 
        ORDER BY email.sent_at DESC
        LIMIT ? OFFSET ?
      `;
      countSql = `
        SELECT COUNT(*) as total
        FROM email
        WHERE email.recipientId = ?
      `;
    } else if (req.params.option == "sent-email") {
      sql = `
        SELECT 
          email.emailId, 
          email.subject, 
          email.body, 
          email.sent_at, 
          user.email as recipient,
          user.username as recipientName
        FROM email 
        INNER JOIN user ON user.userId = email.recipientId 
        WHERE email.senderId = ? 
        ORDER BY email.sent_at DESC
        LIMIT ? OFFSET ?
      `;
      countSql = `
        SELECT COUNT(*) as total
        FROM email
        WHERE email.senderId = ?
      `;
    }

    const [countResult] = await pool.query(countSql, [id]);
    const totalEmails = countResult[0].total;
    const totalPages = Math.ceil(totalEmails / limit);

    const [rows] = await pool.query(sql, [id, limit, offset]);

    res.json({
      emails: rows,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalEmails: totalEmails,
        emailsPerPage: limit,
      },
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

app.get("/email-detail/:id", async (req, res) => {
  const user = JSON.parse(decodeURIComponent(req.cookies.user));
  return res.render("layout/layout.ejs", {
    title: "Detail",
    name: user.username,
    id: user.userId,
  });
});

app.get("/get/email-detail/:id", async (req, res) => {
  const emailId = req.params.id;
  const sql = `SELECT email.subject, email.body, email.sent_at, email.attachment, user.email as sender
               FROM email
               INNER JOIN user ON user.userId = email.senderId
               WHERE email.emailId = ?`;

  try {
    const [rows] = await pool.query(sql, [emailId]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: "Email not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/compose", async (req, res) => {
  const user = JSON.parse(decodeURIComponent(req.cookies.user));
  return res.render("layout/layout.ejs", {
    title: "Compose",
    name: user.username,
    id: user.userId,
    status: "none",
  });
});

app.post("/compose", async (req, res) => {
  const emailData = req.body;
  const user = JSON.parse(decodeURIComponent(req.cookies.user));
  let status = "none";
  const sql = `INSERT INTO email (senderId, recipientId, subject, body, attachment)
  VALUES (?, ?, ?, ?, ?)`;

  try {
    const result = await pool.query(sql, [
      user.userId,
      emailData.to,
      emailData.subject,
      emailData.body,
      emailData.attachment,
    ]);
    console.log("Email Inserted:", result);
    status = "success";
  } catch (error) {
    console.log("Insert Failed:", error);
    status = "failed";
  }

  return res.render("layout/layout.ejs", {
    title: "Compose",
    name: user.username,
    id: user.userId,
    status: status,
  });
});

app.get("/get/all-available-emails", async (req, res) => {
  const user = JSON.parse(decodeURIComponent(req.cookies.user));
  const sql = `SELECT user.email, user.userId FROM user WHERE NOT user.userId = ?`;

  try {
    const [rows] = await pool.query(sql, [user.userId]);
    if (rows.length > 0) {
      return res.json(rows);
    } else {
      res.status(404).json({ error: "No users found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/get/:email", async (req, res) => {
  const sql = `SELECT user.email FROM user WHERE user.email = ?`;

  try {
    const [rows] = await pool.query(sql, [req.params.email]);
    return res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(8000, () => {
  console.log("Server running on port 8000");
});
