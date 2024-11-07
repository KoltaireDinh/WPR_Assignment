"use strict";
var path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const { sqlPool } = require("./dbconnect.js");
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

app.post("/sign-in", async (req, res, next) => {
  const { email, psw } = req.body;
  const sql = "SELECT * FROM `user` WHERE `email` = ? AND `password` = ?";
  const conn = sqlPool();

  try {
    const [rows] = await conn.query(sql, [email, psw]);
    if (rows.length > 0) {
      const user = rows[0];
      console.log("Setting cookie for user:", user);

      res.cookie("user", JSON.stringify(user), {
        httpOnly: false, // Change to false so JavaScript can access it
        secure: false, // Change to true in production with HTTPS
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      return res.json({ body: "Login success", status: 200 });
    } else {
      return res.json({ body: "Login failed", status: 400 });
    }
  } catch (err) {
    console.error("Sign-in error:", err);
    return res.json({ body: "Error during login", status: 500 });
  }
});

app.get("/sign-up", function (req, res, next) {
  res.render("pages/signup/signup", { title: "Sign up" });
});

app.post("/sign-up", async (req, res, next) => {
  const { fullname, email, psw } = req.body;
  console.log(email);

  const sql = "INSERT INTO USER(username, email, password) VALUES (?, ?, ?)";
  const conn = sqlPool();

  await conn
    .query(sql, [fullname, email, psw])
    .then((data) => {
      console.log(data);
      res.json({ isSuccess: true });
    })
    .catch((data) => {
      console.log(data);
      res.json({ isSuccess: false, errorMessage: data.sqlMessage });
    });
});
app.get("/logout", (req, res) => {
  // Clear the user cookie
  res.clearCookie("user");

  // Redirect to the sign-in page
  res.redirect("/sign-in");
});
app.get("/inbox", (req, res) => {
  console.log("Cookies received:", req.cookies);
  if (!req.cookies.user) {
    console.error("User not authenticated. Please sign in.");
    return res.redirect("/sign-in");
  }

  // Parse the cookie to verify
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
  const user = req.cookies.user; // Access cookie directly
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
  let sql = "";
  const conn = sqlPool();

  console.log("Fetching emails for user:", id);
  console.log("Option:", req.params.option);

  try {
    if (req.params.option == "received-email") {
      sql = `
        SELECT 
          email.emailId, 
          email.subject, 
          email.body, 
          email.sent_at, 
          user.email as sender 
        FROM email 
        INNER JOIN user ON user.userId = email.senderId 
        WHERE email.recipientId = ? 
        ORDER BY email.sent_at DESC
      `;
    } else if (req.params.option == "sent-email") {
      sql = `
        SELECT 
          email.emailId, 
          email.subject, 
          email.body, 
          email.sent_at, 
          user.email as recipient 
        FROM email 
        INNER JOIN user ON user.userId = email.recipientId 
        WHERE email.senderId = ? 
        ORDER BY email.sent_at DESC
      `;
    }

    console.log("Executing SQL:", sql);
    console.log("With ID:", id);

    const [rows] = await conn.query(sql, [id]);
    console.log("Query results:", rows);

    res.json(rows || []);
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

// Fetch email detail by ID
app.get("/get/email-detail/:id", async (req, res) => {
  const emailId = req.params.id;
  const sql = `SELECT email.subject, email.body, email.sent_at, email.attachment, user.email as sender
               FROM email
               INNER JOIN user ON user.userId = email.senderId
               WHERE email.emailId = ?`;

  const conn = sqlPool();
  try {
    const [rows] = await conn.query(sql, [emailId]);
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
  const conn = sqlPool();
  let sql = `INSERT INTO email (senderId, recipientId, subject, body, attachment)
  VALUES (?, ?, ?, ?, ?)`;
  console.log("Before Insert:", emailData); // Add this line
  await conn
    .query(sql, [
      user.userId,
      emailData.to,
      emailData.subject,
      emailData.body,
      emailData.attachment,
    ])
    .then((rs) => {
      console.log("Email Inserted:", rs); // Add this line
      status = "success";
    })
    .catch((rs) => {
      console.log("Insert Failed:", rs); // Add this line
      status = "failed";
    });

  return res.render("layout/layout.ejs", {
    title: "Compose",
    name: user.username,
    id: user.userId,
    status: status,
  });
});

app.get("/get/all-available-emails", async (req, res) => {
  const user = JSON.parse(decodeURIComponent(req.cookies.user));
  const conn = sqlPool();
  let sql = "";
  sql = `select user.email, user.userId from user where not user.userID = ?`;

  try {
    const [rows] = await conn.query(sql, [user.userId]);
    if (rows.length > 0) {
      return res.json(rows);
    } else {
    }
  } catch (err) {}
});

app.get("/get/:email", async (req, res) => {
  const conn = sqlPool();
  let sql = "";
  sql = `select user.email from user where user.email = ?`;

  const [rows] = await conn.query(sql, [req.params.email]);

  return res.json(rows);
});

app.listen(8000);
