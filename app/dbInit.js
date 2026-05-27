function initDb(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      warehouse_id TEXT NOT NULL,
      category TEXT NOT NULL,
      item_name TEXT NOT NULL,
      week_number INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit TEXT NOT NULL,
      recorded_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
      UNIQUE (warehouse_id, category, item_name, week_number)
    )
  `);
}

module.exports = { initDb };
