const express = require("express");
const lrouter = express.Router();
const db = require("../db"); // SQLite instance via better-sqlite3

// GET /ledger/entries?userId=...
lrouter.get("/entries", (req, res, next) => {
  try {
    const userId = parseInt(req.query.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }
    
    const stmt = db.prepare(`
      SELECT * FROM CustomerLedger
      WHERE user_id = ?
      ORDER BY created_at ASC
    `);
    const rows = stmt.all(userId);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /ledger — Add a new entry (e.g., PAYMENT or INVOICE)
lrouter.post("/", (req, res, next) => {
  try {
    const { userId, invoiceId, entryType, amount, remarks } = req.body;

    if (!userId || !entryType || amount === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Step 1: Fetch last balance
    const lastEntry = db.prepare(`
      SELECT balance FROM CustomerLedger
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId);

    const lastBalance = lastEntry?.balance || 0;
    const newBalance = entryType === "PAYMENT"
      ? lastBalance - amount
      : lastBalance + amount;

    // Step 2: Insert new ledger entry
    const insertStmt = db.prepare(`
      INSERT INTO CustomerLedger
        (user_id, invoice_id, entry_type, amount, balance, remarks)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      userId,
      invoiceId || null,
      entryType,
      amount,
      newBalance,
      remarks || null
    );

    res.status(201).json({ message: "Ledger entry added" });
  } catch (err) {
    next(err);
  }
});

// PUT /ledger/:id - Fixed to recalculate balances
lrouter.put("/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { entryType, amount, remarks } = req.body;

    if (!entryType || amount === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Fetch the entry being updated
    const entry = db.prepare(`SELECT * FROM CustomerLedger WHERE id = ?`).get(id);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    // Start transaction to ensure data consistency
    const transaction = db.transaction(() => {
      // Update the entry
      db.prepare(`
        UPDATE CustomerLedger
        SET entry_type = ?, amount = ?, remarks = ?
        WHERE id = ?
      `).run(entryType, amount, remarks, id);

      // Recalculate balances for all entries after this one
      recalculateBalances(entry.user_id);
    });

    transaction();
    res.json({ message: "Ledger entry updated" });
  } catch (err) {
    next(err);
  }
});

// DELETE /ledger/:id - Fixed to recalculate balances
lrouter.delete("/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);

    // Get the entry before deleting to know the user_id
    const entry = db.prepare(`SELECT user_id FROM CustomerLedger WHERE id = ?`).get(id);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const transaction = db.transaction(() => {
      const info = db.prepare(`DELETE FROM CustomerLedger WHERE id = ?`).run(id);
      if (info.changes === 0) {
        throw new Error("Entry not found");
      }

      // Recalculate balances for remaining entries
      recalculateBalances(entry.user_id);
    });

    transaction();
    res.sendStatus(204);
  } catch (err) {
    if (err.message === "Entry not found") {
      return res.status(404).json({ error: "Entry not found" });
    }
    next(err);
  }
});

// Helper function to recalculate all balances for a user
function recalculateBalances(userId) {
  const entries = db.prepare(`
    SELECT id, entry_type, amount FROM CustomerLedger
    WHERE user_id = ?
    ORDER BY created_at ASC
  `).all(userId);

  let balance = 0;
  const updateStmt = db.prepare(`UPDATE CustomerLedger SET balance = ? WHERE id = ?`);

  for (const entry of entries) {
    if (entry.entry_type === "PAYMENT") {
      balance -= entry.amount;
    } else {
      balance += entry.amount;
    }
    updateStmt.run(balance, entry.id);
  }
}

module.exports = lrouter;