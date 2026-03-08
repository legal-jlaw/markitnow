// pages/api/retry-deliveries.js
// ─────────────────────────────────────────────────────────────────────────────
// Retries failed email deliveries from the payments table.
// Can be called by a cron job or manually.
//
// GET /api/retry-deliveries?key=<STRIPE_WEBHOOK_SECRET>
//
// Finds payments where email_status='failed' and next_retry_at <= NOW(),
// re-runs the analysis + email delivery pipeline, and updates the record.
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  maxDuration: 120,
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  || "https://markitnow-two.vercel.app";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  // Simple auth: require the webhook secret as a query param
  const key = req.query.key;
  if (!key || key !== process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let db;
  try {
    const { getPool } = require("../../lib/db");
    db = getPool();
  } catch {
    return res.status(500).json({ error: "Database not available" });
  }

  // Find failed deliveries that are due for retry
  const { rows: failed } = await db.query(
    `SELECT id, stripe_session_id, email, mark, product, goods_services, class_code, retry_count
     FROM payments
     WHERE email_status = 'failed'
       AND (next_retry_at IS NULL OR next_retry_at <= NOW())
       AND retry_count < 10
     ORDER BY paid_at ASC
     LIMIT 10`
  );

  if (failed.length === 0) {
    return res.status(200).json({ message: "No failed deliveries to retry", retried: 0 });
  }

  const results = [];

  for (const payment of failed) {
    try {
      // Re-run analysis
      const analysisRes = await fetch(`${BASE_URL}/api/analysis-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mark: payment.mark,
          goodsServices: payment.goods_services,
          classCode: payment.class_code,
        }),
      });

      if (!analysisRes.ok) throw new Error("Analysis failed");
      const report = await analysisRes.json();

      // Re-send email
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) throw new Error("RESEND_API_KEY not set");

      const isMemo = payment.product === "memo";
      const subject = isMemo
        ? `Your AI Legal Memo for "${payment.mark}" is ready`
        : `Your AI Analysis Report for "${payment.mark}" is ready`;

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MarkItNow.ai <reports@markitnow.ai>",
          to: payment.email,
          subject,
          html: `<p>Your ${isMemo ? "AI Legal Memo" : "AI Analysis Report"} for "${payment.mark}" is ready. Please visit <a href="${BASE_URL}/search?mark=${encodeURIComponent(payment.mark)}">MarkItNow.ai</a> to view your results.</p>`,
        }),
      });

      if (!emailRes.ok) {
        const err = await emailRes.json();
        throw new Error(`Resend error: ${err.message}`);
      }

      const emailData = await emailRes.json();

      // Mark as delivered
      await db.query(
        `UPDATE payments SET
           email_status = 'success',
           resend_email_id = $1,
           delivered_at = NOW(),
           retry_count = retry_count + 1,
           last_retry_at = NOW(),
           next_retry_at = NULL,
           updated_at = NOW()
         WHERE id = $2`,
        [emailData.id, payment.id]
      );

      results.push({ id: payment.id, email: payment.email, status: "delivered" });

    } catch (err) {
      const newRetryCount = payment.retry_count + 1;
      // Exponential backoff: 1h, 2h, 4h, 8h, etc.
      const nextRetryMs = Math.min(1000 * 60 * 60 * Math.pow(2, newRetryCount - 1), 24 * 60 * 60 * 1000);

      await db.query(
        `UPDATE payments SET
           retry_count = $1,
           last_retry_at = NOW(),
           next_retry_at = NOW() + interval '${Math.floor(nextRetryMs / 1000)} seconds',
           email_error = $2,
           updated_at = NOW()
         WHERE id = $3`,
        [newRetryCount, err.message, payment.id]
      );

      results.push({ id: payment.id, email: payment.email, status: "failed", error: err.message });
    }
  }

  return res.status(200).json({
    retried: results.length,
    results,
  });
}
