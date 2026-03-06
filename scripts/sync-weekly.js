#!/usr/bin/env node
// ============================================================================
// MarkItNow.ai — Weekly USPTO Sync
// ============================================================================
// Downloads the latest daily trademark XML files from USPTO bulk data,
// then runs the parser to upsert new/updated records.
//
// USPTO publishes daily files every business day. This script:
//   1. Checks the ingestion_log to find the last file we processed
//   2. Downloads any new daily files since then
//   3. Parses and inserts them
//
// Run via cron (e.g. every Wednesday at 3am):
//   0 3 * * 3 node /path/to/scripts/sync-weekly.js
//
// Or via Vercel Cron (see vercel.json config)
// ============================================================================

const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");

require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase")
    ? { rejectUnauthorized: false }
    : undefined,
});

// USPTO bulk data base URL for daily trademark applications
const USPTO_BASE = "https://bulkdata.uspto.gov/data/trademark/dailyxml/applications";

const DATA_DIR = path.resolve(__dirname, "../data/daily");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function getBusinessDays(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`  ⬇️  Downloading: ${path.basename(destPath)}`);
    const file = fs.createWriteStream(destPath);

    https.get(url, (response) => {
      if (response.statusCode === 404) {
        fs.unlinkSync(destPath);
        resolve(false); // File doesn't exist on server (holiday, etc.)
        return;
      }
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        https.get(response.headers.location, (res2) => {
          res2.pipe(file);
          file.on("finish", () => { file.close(); resolve(true); });
        }).on("error", reject);
        return;
      }
      if (response.statusCode !== 200) {
        fs.unlinkSync(destPath);
        resolve(false);
        return;
      }
      response.pipe(file);
      file.on("finish", () => { file.close(); resolve(true); });
    }).on("error", (err) => {
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

// ---------------------------------------------------------------------------
// Main sync logic
// ---------------------------------------------------------------------------

async function main() {
  console.log("🔄 MarkItNow.ai — Weekly USPTO Sync");
  console.log("====================================\n");

  // Create data directory if needed
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // 1. Find the last processed date
  let lastDate;
  try {
    const { rows } = await pool.query(
      `SELECT MAX(file_date) as last_date FROM ingestion_log WHERE status = 'done'`
    );
    lastDate = rows[0]?.last_date ? new Date(rows[0].last_date) : null;
  } catch {
    lastDate = null;
  }

  if (!lastDate) {
    // Default to 7 days ago if no history
    lastDate = new Date();
    lastDate.setDate(lastDate.getDate() - 8);
    console.log("📌 No ingestion history found. Syncing last 7 days.\n");
  } else {
    console.log(`📌 Last processed: ${lastDate.toISOString().slice(0, 10)}\n`);
  }

  // 2. Get business days from last processed to yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const startFrom = new Date(lastDate);
  startFrom.setDate(startFrom.getDate() + 1); // Day after last processed

  const businessDays = getBusinessDays(startFrom, yesterday);

  if (businessDays.length === 0) {
    console.log("✅ Already up to date! No new files to process.\n");
    await pool.end();
    return;
  }

  console.log(`📅 ${businessDays.length} business days to check\n`);

  // 3. Download and process each day's file
  let totalDownloaded = 0;
  let totalRecords = 0;

  for (const date of businessDays) {
    const dateStr = formatDate(date);
    const filename = `apc${dateStr}.zip`;
    const filePath = path.join(DATA_DIR, filename);

    // Check if already processed
    const { rows } = await pool.query(
      "SELECT status FROM ingestion_log WHERE filename = $1 AND status = 'done'",
      [filename]
    );
    if (rows.length > 0) {
      console.log(`  ⏭️  ${filename} already processed`);
      continue;
    }

    // Try to download
    const url = `${USPTO_BASE}/${filename}`;
    try {
      const success = await downloadFile(url, filePath);
      if (!success) {
        console.log(`  ⚠️  ${filename} not available (holiday/weekend?)`);
        continue;
      }

      totalDownloaded++;

      // Log the start
      await pool.query(
        `INSERT INTO ingestion_log (filename, file_date, started_at, status)
         VALUES ($1, $2, NOW(), 'processing')
         ON CONFLICT (filename) DO UPDATE SET started_at = NOW(), status = 'processing'`,
        [filename, date.toISOString().slice(0, 10)]
      );

      // Run the parser on this file
      console.log(`  🔄 Parsing ${filename}...`);
      const result = execSync(
        `node ${path.resolve(__dirname, "parse-uspto-xml.js")} "${filePath}"`,
        { encoding: "utf-8", timeout: 600000 } // 10 min timeout per file
      );
      console.log(`  ${result.trim().split("\n").pop()}`);

      // Mark as done
      await pool.query(
        `UPDATE ingestion_log SET status = 'done', completed_at = NOW() WHERE filename = $1`,
        [filename]
      );

      // Clean up downloaded file to save disk space
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`  ❌ Error processing ${filename}: ${err.message}`);
      await pool.query(
        `UPDATE ingestion_log SET status = 'error', error_message = $1 WHERE filename = $2`,
        [err.message, filename]
      );
    }
  }

  console.log(`\n====================================`);
  console.log(`📦 Downloaded: ${totalDownloaded} files`);
  console.log(`✅ Sync complete!`);
  console.log(`====================================\n`);

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
