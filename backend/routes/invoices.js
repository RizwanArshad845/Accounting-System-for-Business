/////////////////////////////////////////////SQLite.db///////////////////////////////

const express = require("express");
const irouter = express.Router();
const db = require("../db"); // better-sqlite3 connection

// Helper: simulate TVP insert by using a JS array directly
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
}

// CREATE ▸ POST /invoices
irouter.post("/", (req, res, next) => {
  const { custName, custPhone, custAddress, items, paidNow = 0, credit } = req.body;

  const tx = db.transaction(() => {
    // 1) Upsert customer
    let user = db.prepare("SELECT id FROM User WHERE full_name = ? AND phone = ?").get(custName, custPhone);
    if (!user) {
      const insert = db.prepare("INSERT INTO User (full_name, phone, address) VALUES (?, ?, ?)");
      const info = insert.run(custName, custPhone, custAddress);
      user = { id: info.lastInsertRowid };
    }

    // 2) Calculate total and variety_list
    const total = calculateTotal(items);
    const vnames = items
      .map(i => db.prepare("SELECT name FROM Variety WHERE id = ?").get(i.varietyId)?.name)
      .filter(Boolean)
      .sort()
      .join(", ");

    // 3) Create invoice
    const invInfo = db.prepare(`
      INSERT INTO Invoice (customer_id, cust_name, cust_phone, cust_address, variety_list, total, status, paid_amount)
      VALUES (?, ?, ?, ?, ?, ?, 'OPEN', 0)
    `).run(user.id, custName, custPhone, custAddress, vnames, total);
    const invoiceId = invInfo.lastInsertRowid;

    // 4) Insert line items
    const itemInsert = db.prepare("INSERT INTO InvoiceItem (invoice_id, variety_id, qty, unit_price) VALUES (?, ?, ?, ?)");
    for (const item of items) {
      itemInsert.run(invoiceId, item.varietyId, item.qty, item.unitPrice);
    }

    // 5) Update status
    let status = "OPEN", due = null;
    if (paidNow >= total) status = "PAID";
    else if (credit?.enable) {
      status = "CREDIT";
      due = credit.dueAt || null;
    } else if (paidNow > 0) status = "PARTIAL";

    db.prepare("UPDATE Invoice SET paid_amount = ?, status = ?, due_at = ? WHERE id = ?")
      .run(paidNow, status, due, invoiceId);

    // 6) If CREDIT, log to CustomerLedger
    if (status === "CREDIT") {
      const prev = db.prepare(`
        SELECT balance FROM CustomerLedger
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `).get(user.id);

      const previousBalance = prev?.balance || 0;
      const newBalance = previousBalance + total;

      db.prepare(`
        INSERT INTO CustomerLedger (user_id, invoice_id, entry_type, amount, balance, remarks)
        VALUES (?, ?, 'INVOICE', ?, ?, ?)
      `).run(user.id, invoiceId, total, newBalance, 'Auto entry for credit invoice');
    }

    return { invoiceId };
  });

  try {
    const result = tx();
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});


// PAYMENT ▸ POST /invoices/:id/payments
irouter.post("/:id/payments", (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const amount = Number(req.body.amount);
    if (amount <= 0) return res.status(400).json({ error: "amount must be > 0" });

    const inv = db.prepare("SELECT * FROM Invoice WHERE id = ?").get(id);
    if (!inv) return res.status(404).json({ error: "invoice not found" });

    const newPaid = inv.paid_amount + amount;
    const newStatus = newPaid >= inv.total ? "PAID" : "CREDIT";

    db.prepare("UPDATE Invoice SET paid_amount = ?, status = ? WHERE id = ?").run(newPaid, newStatus, id);
    
    res.json({ status: newStatus, paid_amount: newPaid, total: inv.total });
  } catch (e) {
    next(e);
  }
});

// LIST ▸ GET /invoices
irouter.get("/", (req, res, next) => {
  try {
    const { search = "", status = null, from = null, to = null, page = "1", limit = "20" } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    const kw = `%${search}%`;
    const where = [];
    const params = [];

    if (search) {
      where.push("(cust_name LIKE ? OR cust_phone LIKE ? OR variety_list LIKE ?)");
      params.push(kw, kw, kw);
    }
    if (status) {
      where.push("status = ?");
      params.push(status);
    }
    if (from) {
      where.push("issued_at >= ?");
      params.push(from);
    }
    if (to) {
      where.push("issued_at < datetime(?, '+1 day')");
      params.push(to);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const stmt = db.prepare(`
      SELECT id,customer_id,cust_name, cust_phone, issued_at, total,
             paid_amount, (total - paid_amount) AS balance,
             status, due_at
      FROM Invoice
      ${whereClause}
      ORDER BY issued_at DESC
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(...params, limitNum, offset);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// DETAIL ▸ GET /invoices/:id
irouter.get("/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const header = db.prepare("SELECT * FROM Invoice WHERE id = ?").get(id);
    if (!header) return res.status(404).json({ error: "not found" });

    const items = db.prepare("SELECT * FROM InvoiceItem WHERE invoice_id = ?").all(id);
    res.json({ header, items });
  } catch (e) {
    next(e);
  }
});
///PUT to update invoices
irouter.put("/:id", (req, res, next) => {
  const id = Number(req.params.id)
  const { custName, custPhone, custAddress, items, paidNow = 0, credit } = req.body

  try {
    const tx = db.transaction(() => {
      // 1) Update customer info
      db.prepare(`
        UPDATE Invoice
        SET cust_name = ?, cust_phone = ?, cust_address = ?
        WHERE id = ?
      `).run(custName, custPhone, custAddress, id)

      // 2) Delete previous items
      db.prepare("DELETE FROM InvoiceItem WHERE invoice_id = ?").run(id)

      // 3) Insert updated items
      const itemInsert = db.prepare("INSERT INTO InvoiceItem (invoice_id, variety_id, qty, unit_price) VALUES (?, ?, ?, ?)")
      for (const item of items) {
        itemInsert.run(id, item.varietyId, item.qty, item.unitPrice)
      }

      // 4) Recalculate total and variety_list
      const total = items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0)
      const vnames = items
        .map((i) => db.prepare("SELECT name FROM Variety WHERE id = ?").get(i.varietyId)?.name)
        .filter(Boolean)
        .sort()
        .join(", ")

      // 5) Update invoice total, paid amount, status, due date
      let status = "OPEN", due = null
      if (paidNow >= total) status = "PAID"
      else if (credit?.enable) {
        status = "CREDIT"
        due = credit.dueAt || null
      } else if (paidNow > 0) status = "PARTIAL"

      db.prepare(`
        UPDATE Invoice
        SET total = ?, paid_amount = ?, status = ?, due_at = ?, variety_list = ?
        WHERE id = ?
      `).run(total, paidNow, status, due, vnames, id)

      return { invoiceId: id }
    })

    const result = tx()
    res.json(result)
  } catch (e) {
    next(e)
  }
})
irouter.delete("/:id", (req, res, next) => {
  const tx = db.transaction((id) => {
    // ✅ First delete dependent rows in CustomerLedger
    db.prepare("DELETE FROM CustomerLedger WHERE invoice_id = ?").run(id);

    // ✅ Then delete dependent rows in InvoiceItem
    db.prepare("DELETE FROM InvoiceItem WHERE invoice_id = ?").run(id);

    // ✅ Finally delete the invoice itself
    const info = db.prepare("DELETE FROM Invoice WHERE id = ?").run(id);
    if (info.changes === 0) throw new Error("not found");
  });

  try {
    tx(Number(req.params.id));
    res.sendStatus(204); // No content, success
  } catch (e) {
    if (e.message === "not found") return res.status(404).json({ error: "invoice not found" });
    next(e);
  }
});

module.exports = irouter;

