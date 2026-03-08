const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const multer = require("multer");

const app = express();

app.use(cors());
app.use(express.json());

/* Allow images to be accessed */

app.use("/uploads", express.static("uploads"));

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

sql.connect(config)
.then(() => {
    console.log("Connected to SQL Server");
})
.catch(err => {
    console.log(err);
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

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const name = req.body.name;
    const dob = req.body.dob;
    const gender = req.body.gender;

    const photoPath = req.file ? req.file.filename : null;

    try {

        const request = new sql.Request();

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

    try{

        const request = new sql.Request();

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