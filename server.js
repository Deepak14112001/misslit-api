require("dotenv").config();

const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");

const app = express();

/* PORT */
const PORT = process.env.PORT || 3000;

/* Middleware */
app.use(cors());
app.use(express.json());

/* Create uploads folder if not exists */
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/* Allow access to uploaded images */
app.use("/uploads", express.static("uploads"));

/* Root route */
app.get("/", (req, res) => {
  res.send("MissLit API running 🚀");
});

/* SQL Server config */
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    trustServerCertificate: true
  }
};

/* SQL connection pool */
let pool = null;

async function connectDB() {
  try {
    pool = await sql.connect(config);
    console.log("Connected to SQL Server");
  } catch (err) {
    console.log("Database connection failed");
    console.log(err.message);
  }
}

connectDB();

/* Multer configuration */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/* Optional: Submission deadline */
const endTime = new Date("2026-03-10T18:00:00");

/* Insert participant */
app.post("/participants", upload.single("photo"), async (req, res) => {

  if (new Date() > endTime) {
    return res.status(403).send("Submission closed");
  }

  if (!pool) {
    return res.status(500).send("Database not connected");
  }

  const name = req.body.name;
  const dob = req.body.dob;
  const gender = req.body.gender;
  const photoPath = req.file ? req.file.filename : null;

  try {

    const request = pool.request();

    request.input("name", sql.VarChar, name);
    request.input("dob", sql.Date, dob);
    request.input("gender", sql.VarChar, gender);
    request.input("photo", sql.VarChar, photoPath);

    await request.query(`
      INSERT INTO Participants (Name, DOB, Gender, PhotoPath)
      VALUES (@name, @dob, @gender, @photo)
    `);

    res.json({
      success: true,
      message: "Participant saved successfully"
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Database error");
  }
});

/* Get participants */
app.get("/participants", async (req, res) => {

  if (!pool) {
    return res.status(500).send("Database not connected");
  }

  try {

    const request = pool.request();

    const result = await request.query(`
      SELECT * FROM Participants ORDER BY Id DESC
    `);

    res.json(result.recordset);

  } catch (err) {
    console.log(err);
    res.status(500).send("Error retrieving participants");
  }
});

/* Start server */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});