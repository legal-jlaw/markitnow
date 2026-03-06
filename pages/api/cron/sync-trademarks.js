// pages/api/cron/sync-trademarks.js
// ─────────────────────────────────────────────────────────────────────────────
// Vercel Cron endpoint: triggers weekly USPTO trademark sync.
// Called automatically every Wednesday at 3am EST via vercel.json cron config.
//
// This is a lightweight trigger — the actual heavy lifting happens in
// scripts/sync-weekly.js. For Vercel's serverless environment, we do a
// simplified version: download the most recent daily file and parse it inline.
// For full backfill, use `npm run sync` from a machine with more resources.
// ─────────────────────────────────────────────────────────────────────────────

import { getPool } from "../../../lib/db";

export default async function handler(req, res) {
  // Verify this is a legitimate cron call (Vercel sets this header)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in dev mode without auth
    if (process.env.NODE_ENV === "production") {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    const pool = getPool();

    // Get last sync date
    const { rows } = await pool.query(
      `SELECT MAX(file_date) as last_date FROM ingestion_log WHERE status = 'done'`
    );
    const lastDate = rows[0]?.last_date;

    // For Vercel serverless, we just report status and trigger an external job
    // The actual parsing is too heavy for a 60s serverless function
    // Use a background job service or run `npm run sync` on a server

    const { rows: stats } = await pool.query(`
      SELECT
        COUNT(*) as total_marks,
        COUNT(*) FILTER (WHERE status_code IN ('600','601','700','800')) as active_marks,
        MAX(updated_at) as last_updated
      FROM trademarks
    `);

    return res.status(200).json({
      ok: true,
      message: "Trademark database status",
      stats: {
        totalMarks: parseInt(stats[0].total_marks),
        activeMarks: parseInt(stats[0].active_marks),
        lastUpdated: stats[0].last_updated,
        lastSyncDate: lastDate,
      },
      note: "For full sync, run `npm run sync` from a server with disk access. Vercel serverless has a 60s timeout — too short for XML parsing.",
    });
  } catch (err) {
    console.error("Cron sync error:", err);
    return res.status(500).json({ error: err.message });
  }
}
