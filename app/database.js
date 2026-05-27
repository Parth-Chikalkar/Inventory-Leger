const initSqlJs = require("sql.js");

let SQL = null;

async function loadSqlJs() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

function createDb() {
  if (!SQL) throw new Error("sql.js not loaded yet");
  const raw = new SQL.Database();

  function run(sql, params) {
    raw.run(sql, params || []);
    const id = raw.exec("SELECT last_insert_rowid() as id")[0];
    return { lastInsertRowid: id ? id.values[0][0] : null };
  }

  function all(sql, params) {
    const result = raw.exec(sql, params || []);
    if (!result || result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  }

  function get(sql, params) {
    const rows = all(sql, params);
    return rows[0] || null;
  }

  function exec(sql) {
    raw.exec(sql);
  }

  function close() {
    raw.close();
  }

  return { run, all, get, exec, close };
}

module.exports = { loadSqlJs, createDb };
