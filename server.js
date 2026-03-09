require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");

const app = express();

/* Render PORT */
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* Create uploads folder if not exists */
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/* Allow uploaded images access */
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

let pool = null;

/* Connect DB safely */
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

/* Multer config */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

/* Insert participant */
app.post("/participants", upload.single("photo"), async (req, res) => {

  if (!pool) {
    return res.status(500).send("Database not connected");
  }

  const name = req.body.name;
  const dob = req.body.dob;
  const gender = req.body.gender;
  const photoPath = req.file ? req.file.filename : null;

  try {
    const request = pool.request();

    await request.query(`
      INSERT INTO Participants (Name, DOB, Gender, PhotoPath)
      VALUES ('${name}', '${dob}', '${gender}', '${photoPath}')
    `);

    res.send("Participant saved successfully");

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
    const result = await request.query(`SELECT * FROM Participants`);
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