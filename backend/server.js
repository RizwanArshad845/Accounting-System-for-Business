const express = require("express");
const cors    = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

// mount resource routers
app.use("/users",     require("./routes/users.js"));
app.use("/varieties", require("./routes/varieties.js"));
app.use("/invoices",  require("./routes/invoices.js"));
const ledgerRoutes = require("./routes/ledger")
app.use("/ledger", ledgerRoutes)

// global error handler (simple)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));