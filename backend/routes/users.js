/////////////////////////////////---------According to SQLite----------------------////////////////////////
const express = require("express");
const router = express.Router();
const db = require("../db"); // SQLite database connection (better-sqlite3 instance)

// SEARCH ▸ GET /users?search=Ali&limit=15
router.get("/", (req, res, next) => {
  try {
    const kw = (req.query.search || "").trim() + "%";
    const limit = parseInt(req.query.limit) || 15;
    const stmt = db.prepare(`SELECT id, full_name, phone, address 
                             FROM User 
                             WHERE full_name LIKE ? 
                             ORDER BY full_name 
                             LIMIT ?`);
    const rows = stmt.all(kw, limit);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// UPDATE ▸ PUT /users/:id
router.put("/:id", (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { full_name, phone, address } = req.body;

    const getStmt = db.prepare(`SELECT * FROM User WHERE id = ?`);
    const existing = getStmt.get(id);
    if (!existing) return res.status(404).json({ error: "user not found" });

    const stmt = db.prepare(`UPDATE User
                             SET full_name = COALESCE(?, full_name),
                                 phone     = COALESCE(?, phone),
                                 address   = COALESCE(?, address)
                             WHERE id = ?`);
    stmt.run(full_name, phone, address, id);

    const updated = getStmt.get(id);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// DELETE ▸ DELETE /users/:id
router.delete("/:id", (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const stmt = db.prepare(`DELETE FROM User WHERE id = ?`);
    const info = stmt.run(id);
    if (info.changes === 0) return res.status(404).json({ error: "user not found" });
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
});

// HISTORY ▸ GET /users/:id/varieties
router.get("/:id/varieties", (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const stmt = db.prepare(`SELECT v.name, h.total_qty, h.total_spent, h.last_buy
                             FROM   UserVarietyHistory h
                             JOIN   Variety v ON v.id = h.variety_id
                             WHERE  h.user_id = ?
                             ORDER  BY h.last_buy DESC`);
    const rows = stmt.all(id);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

module.exports = router;

