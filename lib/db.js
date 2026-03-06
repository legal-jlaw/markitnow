// lib/db.js — Supabase/Postgres connection for MarkItNow.ai
// Uses pg Pool with connection string from DATABASE_URL

const dns = require("dns");
// Force IPv4 — Supabase IPv6 addresses are often unreachable from home/dev networks
dns.setDefaultResultOrder("ipv4first");

const { Pool } = require("pg");

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL not set in environment variables");
    }

    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("supabase")
        ? { rejectUnauthorized: false }
        : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected pool error:", err);
    });
  }
  return pool;
}

// Search trademarks using the database function we defined in migration.sql
async function searchTrademarks(query, { status = "all", classCode = null, limit = 200, offset = 0 } = {}) {
  const db = getPool();
  const { rows } = await db.query(
    `SELECT * FROM search_trademarks_ranked($1, $2, $3, $4, $5)`,
    [query, status, classCode, limit, offset]
  );
  return rows;
}

// Get total count for a search (for pagination)
async function countTrademarks(query, { status = "all", classCode = null } = {}) {
  const db = getPool();
  // Use a count wrapper around the search function
  const { rows } = await db.query(
    `SELECT COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_active = true) as active_count
     FROM search_trademarks($1, $2, $3, 10000, 0)`,
    [query, status, classCode]
  );
  return {
    total: parseInt(rows[0].total) || 0,
    activeCount: parseInt(rows[0].active_count) || 0,
  };
}

// Get a single trademark by serial number (for detail pages)
async function getTrademarkBySerial(serialNumber) {
  const db = getPool();
  const { rows: [trademark] } = await db.query(
    `SELECT t.*,
            COALESCE(sc.label, t.status_label) as status_label,
            COALESCE(sc.is_active, false) as is_active
     FROM trademarks t
     LEFT JOIN status_codes sc ON sc.code = t.status_code
     WHERE t.serial_number = $1`,
    [serialNumber]
  );
  if (!trademark) return null;

  const [owners, classifications, goodsServices] = await Promise.all([
    db.query("SELECT * FROM owners WHERE serial_number = $1 ORDER BY entry_number", [serialNumber]),
    db.query("SELECT * FROM classifications WHERE serial_number = $1", [serialNumber]),
    db.query("SELECT * FROM goods_services WHERE serial_number = $1", [serialNumber]),
  ]);

  return {
    ...trademark,
    owners: owners.rows,
    classifications: classifications.rows,
    goodsServices: goodsServices.rows,
  };
}

// Check database health (used by API to decide: use DB or fallback to RapidAPI)
async function isDatabaseReady() {
  try {
    const db = getPool();
    const { rows } = await db.query("SELECT COUNT(*) as count FROM trademarks LIMIT 1");
    return parseInt(rows[0].count) > 0;
  } catch {
    return false;
  }
}

module.exports = {
  getPool,
  searchTrademarks,
  countTrademarks,
  getTrademarkBySerial,
  isDatabaseReady,
};
