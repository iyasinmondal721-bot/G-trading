import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("trading_journal.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    asset TEXT NOT NULL,
    entry_price REAL,
    exit_price REAL,
    profit_loss REAL NOT NULL,
    day_total REAL,
    rules_followed INTEGER DEFAULT 1,
    notes_good TEXT,
    notes_bad TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  INSERT OR IGNORE INTO settings (key, value) VALUES ('initial_balance', '0');
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/trades", (req, res) => {
    try {
      const trades = db.prepare("SELECT * FROM trades ORDER BY date DESC, created_at DESC").all();
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  app.get("/api/withdrawals", (req, res) => {
    try {
      const withdrawals = db.prepare("SELECT * FROM withdrawals ORDER BY date DESC").all();
      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch withdrawals" });
    }
  });

  app.post("/api/withdrawals", (req, res) => {
    const { date, amount, notes } = req.body;
    if (!date || amount === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const info = db.prepare("INSERT INTO withdrawals (date, amount, notes) VALUES (?, ?, ?)").run(date, amount, notes);
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: "Failed to save withdrawal" });
    }
  });

  app.get("/api/settings", (req, res) => {
    try {
      const settings = db.prepare("SELECT * FROM settings").all();
      const settingsObj = settings.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      res.json(settingsObj);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", (req, res) => {
    const { key, value } = req.body;
    try {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value.toString());
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.post("/api/trades", (req, res) => {
    const { date, asset, entry_price, exit_price, profit_loss, day_total, rules_followed, notes_good, notes_bad } = req.body;
    
    if (!date || !asset || profit_loss === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const info = db.prepare(`
        INSERT INTO trades (date, asset, entry_price, exit_price, profit_loss, day_total, rules_followed, notes_good, notes_bad)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(date, asset, entry_price, exit_price, profit_loss, day_total, rules_followed ? 1 : 0, notes_good, notes_bad);
      
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to save trade" });
    }
  });

  app.delete("/api/trades/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM trades WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete trade" });
    }
  });

  app.post("/api/reset", (req, res) => {
    try {
      db.prepare("DELETE FROM trades").run();
      db.prepare("DELETE FROM withdrawals").run();
      db.prepare("UPDATE settings SET value = '0' WHERE key = 'initial_balance'").run();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
