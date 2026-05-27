const express = require("express");
const path = require("path");
const { loadSqlJs, createDb } = require("./database");
const { initDb } = require("./dbInit");
const { createRouter } = require("./routes/entries");
const { errorHandler } = require("./errorHandler");

function createApp(db) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use("/", createRouter(db));
  app.use(errorHandler);
  return app;
}

if (require.main === module) {
  (async () => {
    await loadSqlJs();
    const db = createDb();
    initDb(db);
    const app = createApp(db);
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Inventory Ledger API running on http://localhost:${PORT}`);
    });
  })();
}

module.exports = { createApp };
