#!/usr/bin/env node
/**
 * Run db/migration.sql against the Supabase Postgres database.
 * Usage: node scripts/run-migration.js
 *
 * Reads DATABASE_URL from .env.local
 */

require("dotenv").config({ path: ".env.local" });
const dns = require("dns");
// Force IPv4 — Supabase IPv6 addresses are often unreachable from home networks
dns.setDefaultResultOrder("ipv4first");

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL || DATABASE_URL.includes("YOUR_PASSWORD")) {
  console.error("❌ DATABASE_URL is not set or still has placeholder values.");
  console.error("   Update .env.local with your real Supabase connection string.");
  process.exit(1);
}

async function run() {
  const sqlPath = path.join(__dirname, "..", "db", "migration.sql");
  if (!fs.existsSync(sqlPath)) {
    console.error("❌ db/migration.sql not found");
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  console.log("🔌 Connecting to Supabase (IPv4)...");

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  const client = await pool.connect();
  try {
    console.log("🚀 Running migration...");
    await client.query(sql);
    console.log("✅ Migration completed successfully!\n");

    // Verify tables
    const tables = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );
    console.log("📋 Tables:");
    tables.rows.forEach((r) => console.log(`   • ${r.tablename}`));

    // Verify functions
    const fns = await client.query(
      "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' ORDER BY routine_name"
    );
    console.log("\n⚙️  Functions:");
    fns.rows.forEach((r) => console.log(`   • ${r.routine_name}()`));

    // Check row counts
    const count = await client.query(
      "SELECT (SELECT count(*) FROM trademarks) AS trademarks, (SELECT count(*) FROM status_codes) AS status_codes"
    );
    console.log(`\n📊 Status codes loaded: ${count.rows[0].status_codes}`);
    console.log(`📊 Trademarks in DB: ${count.rows[0].trademarks}`);
    console.log("\n🎉 Database is ready. Next step: ingest USPTO data with 'npm run ingest'");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    if (err.position) {
      // Show context around the error
      const pos = parseInt(err.position);
      const snippet = sql.substring(Math.max(0, pos - 80), pos + 80);
      console.error("\n   Near:", snippet.replace(/\n/g, " ").trim());
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
