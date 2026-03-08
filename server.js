const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

/* CREATE UPLOADS FOLDER IF NOT EXISTS */

if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

/* Allow images to be accessed */

app.use("/uploads", express.static("uploads"));

/* ROOT ROUTE */

app.get("/", (req, res) => {
    res.send("MissLit API running 🚀");
});

/* SQL Server configuration */

const config = {
    user: "misslituser",
    password: "Deepak@123",
    server: "localhost\\SQLEXPRESS",
    database: "MissLitDB",
    options: {
        trustServerCertificate: true
    }
};

/* Connect to SQL Server */

let pool;

sql.connect(config)
.then((connection) => {
    pool = connection;
    console.log("Connected to SQL Server");
})
.catch(err => {
    console.log("Database not connected:", err);
});

/* Multer configuration */

const storage = multer.diskStorage({

    destination: function(req, file, cb){
        cb(null, "uploads/");
    },

    filename: function(req, file, cb){
        cb(null, Date.now() + "-" + file.originalname);
    }

});

const upload = multer({ storage: storage });

/* INSERT PARTICIPANT */

app.post("/participants", upload.single("photo"), async (req, res) => {

    if (!pool) {
        return res.status(500).send("Database not connected");
    }

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

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

    } catch(err){

        console.log(err);
        res.status(500).send("Database error");

    }

});

/* GET PARTICIPANTS */

app.get("/participants", async (req,res)=>{

    if (!pool) {
        return res.status(500).send("Database not connected");
    }

    try{

        const request = pool.request();

        const result = await request.query(`
            SELECT * FROM Participants
        `);

        res.json(result.recordset);

    }catch(err){

        console.log(err);
        res.status(500).send("Error retrieving participants");

    }

});

/* START SERVER */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});