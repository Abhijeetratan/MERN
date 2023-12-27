const express = require("express");
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const PORT = process.env.PORT || 5000;

app.use(cors());

// MYSQL CONNECTION
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "ROOT",
    database: "employee"
});

db.connect((err) => {
    if (err) {
        console.error("Db connection error", err);
    } else {
        console.log("Db is connected");
    }
});

// CREATE TABLE query
db.query(
    "CREATE TABLE IF NOT EXISTS userss (username VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL)",
    (err) => {
        if (err) {
            console.error("Table creation error", err);
        }
    }
);

app.use(express.json());

app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // INSERT INTO query
        db.query(
            "INSERT INTO userss (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashedPassword],
            (err) => {
                if (err) {
                    console.error("Registration error", err);
                    res.status(500).json({ error: "Internal server error" });
                } else {
                    res.status(201).json({ message: "User registered" });
                }
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        db.query(
            "SELECT * FROM userss WHERE username=?",
            [username],
            async (err, result) => {
                if (err) {
                    console.error("Error retrieving user:", err);
                    return res.status(500).json({ error: "Internal Server Error" });
                }

                if (result.length > 0) {
                    const user = result[0];

                    const passwordMatch = await bcrypt.compare(password, user.password);

                    if (passwordMatch) {
                        const token = jwt.sign({ username }, process.env.JWT_SECRET || "your-secret-key");
                        return res.status(200).json({ token });
                    } else {
                        return res.status(401).json({ error: "Invalid credentials" });
                    }
                } else {
                    return res.status(401).json({ error: "Invalid credentials" });
                }
            }
        );
    } catch (error) {
        console.error("Login failed:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
