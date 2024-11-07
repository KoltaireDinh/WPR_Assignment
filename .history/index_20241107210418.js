"use strict";
var path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const { promisePool } = require("./dbconnect.js");
const app = express();
async function setupDatabase() {
  await promisePool.query("CREATE DATABASE IF NOT EXISTS wpr2101040107");
  await promisePool.query("USE wpr2101040107");
}

setupDatabase();
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
    const [rows] = await promisePool.query(sql, [email, psw]);
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

  const sql = "INSERT INTO USER(username, email, password) VALUES (?, ?, ?)";
  try {
    const [result] = await promisePool.query(sql, [fullname, email, psw]);
    res.json({ isSuccess: true });
  } catch (error) {
    res.json({ isSuccess: false, errorMessage: error.sqlMessage });
  }
  await promisePool.query("USE wpr2101040107");
});

app.get("/logout", (req, res) => {
  res.clearCookie("user");
  res.redirect("/sign-in");
});

app.get("/inbox", (req, res) => {
  if (!req.cookies.user) {
    console.error("User not authenticated. Please sign in.");
    return res.redirect("/sign-in");
  }

  const user = JSON.parse(req.cookies.user);
  const params = req.query.page;
  if (params === undefined) {
    return res.redirect("/inbox?page=1");
  }

  return res.render("layout/layout.ejs", {
    title: "Inbox page",
    name: user.username,
    id: user.userId,
  });
});

app.get("/outbox", (req, res) => {
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
    } else {
      return res.status(400).json({ error: "Invalid option" });
    }

    const [countResult] = await promisePool.query(countSql, [id]);
    const totalEmails = countResult[0].total;
    const totalPages = Math.ceil(totalEmails / limit);

    const [rows] = await promisePool.query(sql, [id, limit, offset]);

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
    res.status(500).json({
      error: "Database error",
      details: err.message,
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalEmails: 0,
        emailsPerPage: limit,
      },
    });
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

// In your main server file
app.get("/get/email-detail/:id", async (req, res) => {
  const emailId = req.params.id;
  const sql = `
    SELECT 
      email.emailId,
      email.subject,
      email.body,
      email.sent_at,
      email.attachment,
      sender.email as sender,
      sender.username as senderName,
      recipient.email as recipient,
      recipient.username as recipientName
    FROM email
    INNER JOIN user as sender ON sender.userId = email.senderId
    INNER JOIN user as recipient ON recipient.userId = email.recipientId
    WHERE email.emailId = ?
  `;

  try {
    const [rows] = await promisePool.query(sql, [emailId]);
    if (rows.length > 0) {
      const email = rows[0];
      // Handle null subject
      email.subject = email.subject || "(no subject)";
      res.json(email);
    } else {
      res.status(404).json({ error: "Email not found" });
    }
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Add a route for downloading attachments if present
app.get("/download/:emailId", async (req, res) => {
  const emailId = req.params.id;
  const sql = "SELECT attachment, attachment_name FROM email WHERE emailId = ?";

  try {
    const [rows] = await promisePool.query(sql, [emailId]);
    if (rows.length > 0 && rows[0].attachment) {
      res.download(rows[0].attachment, rows[0].attachment_name);
    } else {
      res.status(404).json({ error: "Attachment not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Error downloading attachment" });
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
    const result = await promisePool.query(sql, [
      user.userId,
      emailData.to,
      emailData.subject,
      emailData.body,
      emailData.attachment,
    ]);
    status = "success";
  } catch (error) {
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
    const [rows] = await promisePool.query(sql, [user.userId]);
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
    const [rows] = await promisePool.query(sql, [req.params.email]);
    return res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});
app.delete("/delete-emails", async (req, res) => {
  const emailIds = req.body.emailIds; // Expecting an array of email IDs

  if (!Array.isArray(emailIds) || emailIds.length === 0) {
    return res.status(400).json({ error: "No email IDs provided" });
  }

  const sql = "DELETE FROM email WHERE emailId IN (?)";

  try {
    await promisePool.query(sql, [emailIds]);
    res.status(200).json({ message: "Emails deleted successfully" });
  } catch (error) {
    console.error("Error deleting emails:", error);
    res.status(500).json({ error: "Failed to delete emails" });
  }
});
app.listen(8000, () => {
  console.log("Server running on port 8000");
});
