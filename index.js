import express from "express";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost/mydb",
});

async function init() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      note TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

const app = express();
app.use(express.json());

app.get("/healthcheck", (req, res) => {
    res.status(200).json({
        status: 200,
        data: { time: Date.now().toString() },
    });
});

app.get("/notes", async (req, res, next) => {
    try {
        const { rows } = await pool.query("SELECT * FROM notes");
        res.status(200).json({ status: 200, data: rows });
    } catch (err) {
        next(err);
    }
});
app.post("/notes", async (req, res, next) => {
    try {
        const { notes } = req.body;
        if (!Array.isArray(notes)) {
            res.status(400).send();
            return;
        }
        await Promise.all(notes.map(note => {
            return pool.query("INSERT INTO notes(note) VALUES ($1)", [note])
        }));
        res.status(201).json({ status: 201, data: {} });
    } catch (err) {
        next(err);
    }
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ status: 500, error: "Internal Server Error" });
});

init()
    .then(() => {
        app.listen(8080, () => console.log("listening on 8080"));
    })
    .catch((e) => {
        console.error("Failed to init DB", e);
        process.exit(1);
    });

process.on("SIGTERM", async () => {
    await pool.end();
    process.exit(0);
});
