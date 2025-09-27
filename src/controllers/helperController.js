// src/controller/advanceQueryController.js
const fs = require('fs');
const path = require('path');
const db = require('../config/db');             // your mysql2 pool
const savedQueries = require('../queries'); // module.exports = { test: 'SELECT ...' }
const log = console.log;

const SQL_FOLDER = path.join(__dirname, '..', 'sqls'); // expects files like src/config/sqls/myquery.sql
const sqlFileCache = new Map();

// log(SQL_FOLDER);

/** Helpers */
function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function countPlaceholders(sql) {
  // count '?' placeholders. (mysql2 uses '?')
  const matches = sql.match(/\?/g);
  return matches ? matches.length : 0;
}

function sanitizeFnName(fn) {
  // allow a-z0-9_- and optionally subfolders (no '..'), prevent path traversal
  if (!fn || typeof fn !== 'string') return null;
  const cleaned = String(fn).trim();
  if (!cleaned) return null;
  if (cleaned.includes('..')) return null;
  // Allow letters, numbers, underscores, hyphen, slash
  if (!/^[a-zA-Z0-9_\-\/]+$/.test(cleaned)) return null;
  return cleaned;
}

async function loadSqlFile(fn) {
  const safe = sanitizeFnName(fn);
  if (!safe) throw new Error('Invalid sql file name');
  // Build absolute path and restrict to SQL_FOLDER
  const p = path.join(SQL_FOLDER, safe + '.sql');
  const real = path.resolve(p);
  if (!real.startsWith(path.resolve(SQL_FOLDER) + path.sep) && real !== path.resolve(SQL_FOLDER)) {
    throw new Error('Invalid sql file path');
  }
  if (!fs.existsSync(real)) throw new Error('SQL file not found');
  if (sqlFileCache.has(real)) return sqlFileCache.get(real);
  const sql = fs.readFileSync(real, 'utf8');
  sqlFileCache.set(real, sql);
  return sql;
}

/**
 * Main controller
 * Expected request JSON body:
 *  { fn?: 'fileNameWithoutExt', key?: 'queryKey', qry?: 'SELECT ...', values?: [...] }
 */
exports.advanceQuery = async (req, res) => {
  try {
    const payload = (isPlainObject(req.body) ? req.body : {});
    const { fn = null, key = null, qry = '', values = [] } = payload;

    // Validate values: must be array if provided, otherwise treat as []
    const params = Array.isArray(values) ? values : [values];

    // Source selection precedence: fn -> key -> qry
    let sql = null;
    if (fn) {
      // load .sql file from SQL_FOLDER
      try {
        sql = await loadSqlFile(fn);
      } catch (err) {
        return res.status(404).json({ success: false, message: `SQL file error: ${err.message}` });
      }
    } else if (key) {
      if (!savedQueries || typeof savedQueries !== 'object' || !Object.prototype.hasOwnProperty.call(savedQueries, key)) {
        return res.status(404).json({ success: false, message: `Query key not found: ${key}` });
      }
      sql = String(savedQueries[key] || '').trim();
      if (!sql) return res.status(404).json({ success: false, message: `Query for key "${key}" is empty` });
    } else if (qry) {
      sql = String(qry || '').trim();
      if (!sql) return res.status(400).json({ success: false, message: 'Empty qry provided' });

      // SECURITY: Only allow a single SELECT statement for direct queries
      // - must start with SELECT (allow whitespace/comments before)
      const start = sql.replace(/^\s+/, '').slice(0, 10).toLowerCase();
      if (!/^select\b/i.test(start)) {
        return res.status(400).json({ success: false, message: 'Direct queries (qry) must be a SELECT statement' });
      }
      // Disallow semicolons to prevent multiple statements
      if (/;/.test(sql)) {
        return res.status(400).json({ success: false, message: 'Direct SELECT queries must not contain semicolons or multiple statements' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Missing query source. Provide one of fn, key, or qry.' });
    }

    // Basic SQL sanity: ensure not empty
    if (!sql || !sql.trim()) {
      return res.status(400).json({ success: false, message: 'Resolved SQL is empty' });
    }

    // Ensure the SQL contains only SELECT when source was 'qry' OR even for key/fn we can allow any SQL,
    // but since you said only direct queries should be select, we enforce SELECT only for 'qry' already.
    // For fn/key we assume the author of saved SQLs wrote safe statements (you can add additional allowlist logic).

    // Validate placeholder count vs params length
    const placeholders = countPlaceholders(sql);
    if (placeholders > 0 && placeholders !== params.length) {
      // allow params fewer if using named parameters or other style — but for safety complain
      return res.status(400).json({
        success: false,
        message: `Placeholder count (${placeholders}) does not match values.length (${params.length}).`
      });
    }

    // Execute the query (uses mysql2 pool execute -> parameterized)
    const [rows] = await db.execute(sql, params);

    return res.json({ success: true, rowCount: Array.isArray(rows) ? rows.length : 0, data: rows });
  } catch (err) {
    console.error('advanceQuery error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};
