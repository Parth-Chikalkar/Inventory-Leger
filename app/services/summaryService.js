function getSummary(db) {
  return db.all(`
    SELECT category, week_number,
           SUM(quantity) AS total_quantity,
           COUNT(*) AS entry_count
    FROM stock_entries
    GROUP BY category, week_number
    ORDER BY week_number ASC, category ASC
  `);
}

module.exports = { getSummary };
