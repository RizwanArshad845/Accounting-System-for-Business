const express = require("express");
const vrouter = express.Router();
const db = require("../db"); // Assumes a better-sqlite3 connection

// SEARCH ▸ GET /varieties?search=…&limit=…
vrouter.get("/", (req, res, next) => {
  try {
    const kw = (req.query.search || "").trim() + "%";
    const limit = Number(req.query.limit) || 15;

    const stmt = db.prepare(`
      SELECT id, name, category, unit_cost, unit_price, qty_on_hand, reorder_level, created_at, updated_at
      FROM Variety
      WHERE name LIKE ?
      ORDER BY name
      LIMIT ?
    `);

    const rows = stmt.all(kw, limit);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// DETAIL ▸ GET /varieties/:id
vrouter.get("/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const stmt = db.prepare(`SELECT * FROM Variety WHERE id = ?`);
    const row = stmt.get(id);

    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  } catch (e) {
    next(e);
  }
});

// ADD ▸ POST /varieties
vrouter.post("/", (req, res, next) => {
  try {
    const { name, category, unitPrice, qty = 0 } = req.body;

    // Add validation
    if (!name || !category || unitPrice === undefined) {
      return res.status(400).json({ error: "Missing required fields: name, category, unitPrice" });
    }

    // Validate field lengths based on your schema constraints
    if (name.length > 120) {
      return res.status(400).json({ error: "Name must be 120 characters or less" });
    }
    if (category && category.length > 80) {
      return res.status(400).json({ error: "Category must be 80 characters or less" });
    }

    const stmt = db.prepare(`
      INSERT INTO Variety (name, category, unit_price, qty_on_hand, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const info = stmt.run(name, category, unitPrice, qty);
    const newRow = db.prepare(`SELECT * FROM Variety WHERE id = ?`).get(info.lastInsertRowid);
    res.status(201).json(newRow);
  } catch (e) {
    console.error("Error adding variety:", e);
    next(e);
  }
});

// UPDATE ▸ PUT /varieties/:id
vrouter.put("/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, category, unitPrice, qty, reorder } = req.body;

    const existing = db.prepare(`SELECT * FROM Variety WHERE id = ?`).get(id);
    if (!existing) return res.status(404).json({ error: "not found" });

    // Validate field lengths if provided
    if (name && name.length > 120) {
      return res.status(400).json({ error: "Name must be 120 characters or less" });
    }
    if (category && category.length > 80) {
      return res.status(400).json({ error: "Category must be 80 characters or less" });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (category !== undefined) {
      updates.push("category = ?");
      values.push(category);
    }
    if (unitPrice !== undefined) {
      updates.push("unit_price = ?");
      values.push(unitPrice);
    }
    if (qty !== undefined) {
      updates.push("qty_on_hand = ?");
      values.push(qty);
    }
    if (reorder !== undefined) {
      updates.push("reorder_level = ?");
      values.push(reorder);
    }
    
    // Always update the updated_at timestamp
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id); // Add id for WHERE clause

    if (updates.length === 1) {
      // Only updated_at would be updated, so nothing to do
      const updated = db.prepare(`SELECT * FROM Variety WHERE id = ?`).get(id);
      return res.json(updated);
    }

    const sql = `UPDATE Variety SET ${updates.join(", ")} WHERE id = ?`;
    const stmt = db.prepare(sql);
    stmt.run(...values);

    // Return the full updated row
    const updated = db.prepare(`SELECT * FROM Variety WHERE id = ?`).get(id);
    res.json(updated);
  } catch (e) {
    console.error("Error updating variety:", e);
    next(e);
  }
});

// STOCK-IN ▸ POST /varieties/stock-in
vrouter.post("/stock-in", (req, res, next) => {
  try {
    const { varietyId, addQty } = req.body;

    if (!varietyId || addQty === undefined) {
      return res.status(400).json({ error: "Missing varietyId or addQty" });
    }

    const stmt = db.prepare(`
      UPDATE Variety
      SET qty_on_hand = qty_on_hand + ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const info = stmt.run(addQty, varietyId);

    if (info.changes === 0) {
      return res.status(404).json({ error: "Variety not found" });
    }
    
    // Return updated variety
    const updated = db.prepare(`SELECT * FROM Variety WHERE id = ?`).get(varietyId);
    res.json(updated);
  } catch (e) {
    console.error("Error updating stock:", e);
    next(e);
  }
});

// DELETE ▸ DELETE /varieties/:id
vrouter.delete("/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const stmt = db.prepare(`DELETE FROM Variety WHERE id = ?`);
    const info = stmt.run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: "Variety not found" });
    }
    res.sendStatus(204);
  } catch (e) {
    console.error("Error deleting variety:", e);
    next(e);
  }
});

module.exports = vrouter;