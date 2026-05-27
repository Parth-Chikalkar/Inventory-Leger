const express = require("express");
const { validateEntry } = require("../validation");
const { getSummary } = require("../services/summaryService");

function createRouter(db) {
  const router = express.Router();

  router.post("/entries", (req, res) => {
    const errors = validateEntry(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: "validation_error", detail: errors });
    }

    const { warehouse_id, category, item_name, week_number, quantity, unit, recorded_by } = req.body;

    try {
      const result = db.run(
        `INSERT INTO stock_entries (warehouse_id, category, item_name, week_number, quantity, unit, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [warehouse_id, category, item_name, week_number, quantity, unit, recorded_by]
      );
      const entry = db.get("SELECT * FROM stock_entries WHERE id = ?", [result.lastInsertRowid]);
      return res.status(201).json(entry);
    } catch (err) {
      if (err.message && err.message.includes("UNIQUE constraint failed")) {
        return res.status(409).json({
          error: "duplicate_entry",
          message: `An entry for this item in week ${week_number} already exists.`
        });
      }
      throw err;
    }
  });

  router.get("/entries", (req, res) => {
    const { category, warehouse_id, week_number, min_quantity } = req.query;

    let sql = "SELECT * FROM stock_entries WHERE 1=1";
    const params = [];

    if (category) { sql += " AND category = ?"; params.push(category); }
    if (warehouse_id) { sql += " AND warehouse_id = ?"; params.push(warehouse_id); }
    if (week_number) { sql += " AND week_number = ?"; params.push(Number(week_number)); }
    if (min_quantity !== undefined) { sql += " AND quantity >= ?"; params.push(Number(min_quantity)); }

    sql += " ORDER BY id ASC";

    const entries = db.all(sql, params);
    return res.status(200).json({ count: entries.length, entries });
  });

  router.get("/summary", (req, res) => {
    const summary = getSummary(db);
    return res.status(200).json({ summary });
  });

  router.delete("/entries/:id", (req, res) => {
    const id = Number(req.params.id);
    const existing = db.get("SELECT id FROM stock_entries WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({
        error: "not_found",
        message: `Entry with id ${id} does not exist.`
      });
    }
    db.run("DELETE FROM stock_entries WHERE id = ?", [id]);
    return res.status(200).json({ message: `Entry with id ${id} deleted successfully.` });
  });

  return router;
}

module.exports = { createRouter };
