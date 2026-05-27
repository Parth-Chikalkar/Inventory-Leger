const { loadSqlJs, createDb } = require("../app/database");
const { initDb } = require("../app/dbInit");
const { createApp } = require("../app/server");

async function buildTestApp() {
  await loadSqlJs();
  const db = createDb();
  initDb(db);
  const app = createApp(db);
  return { app, db };
}

const validEntry = {
  warehouse_id: "WH-01",
  category: "Electronics",
  item_name: "USB Hub",
  week_number: 10,
  quantity: 50,
  unit: "units",
  recorded_by: "Alice"
};

function makeEntry(overrides = {}) {
  return { ...validEntry, ...overrides };
}

module.exports = { buildTestApp, validEntry, makeEntry };
