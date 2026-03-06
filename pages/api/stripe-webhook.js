// pages/api/stripe-webhook.js
// ─────────────────────────────────────────────────────────────────────────────
// Stripe webhook handler
//
// Fires on: checkout.session.completed
//
// Flow:
//   1. Verify Stripe signature (security)
//   2. Extract email, mark, product from session
//   3. Run Analysis Agent (Agent 1) to generate report data
//   4. Run Lead Profile Agent (Agent 3) with buyer segment
//   5. Send PDF delivery email via Resend
//   6. Trigger post-purchase drip sequence
//
// Requires env vars:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET  (from Stripe Dashboard > Webhooks)
//   NEXT_PUBLIC_ANTHROPIC_KEY
//   RAPIDAPI_KEY
//   RESEND_API_KEY
//
// Stripe Dashboard setup:
//   Endpoint URL: https://markitnow.ai/api/stripe-webhook
//   Events: checkout.session.completed
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  api: {
    bodyParser: false, // Required for Stripe signature verification
  },
};

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const RAPIDAPI_HOST = "uspto-trademark.p.rapidapi.com";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL 
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  || "https://markitnow-two.vercel.app";

// ── Raw body reader (required for Stripe signature verification) ──────────────

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// ── Stripe signature verification ────────────────────────────────────────────

async function verifyStripeSignature(rawBody, signature, secret) {
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

// ── Run Analysis Agent inline (avoids internal fetch latency) ─────────────────

async function runAnalysisAgent(mark, goodsServices, classCode) {
  const rapidKey = process.env.RAPIDAPI_KEY;
  const anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_KEY;

  // Call our own analysis agent endpoint
  const res = await fetch(`${BASE_URL}/api/analysis-agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mark, goodsServices, classCode }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Analysis agent failed: ${err.error}`);
  }

  return res.json();
}

// ── Generate HTML report for email delivery ───────────────────────────────────

function buildReportEmail(mark, email, report, product) {
  const risk = report?.scoring?.overallRisk || "UNKNOWN";
  const riskColors = {
    HIGH: { bg: "#fff0f0", border: "#e53e3e", text: "#c53030" },
    MEDIUM: { bg: "#fffbeb", border: "#d69e2e", text: "#b7791f" },
    LOW: { bg: "#f0fff4", border: "#38a169", text: "#276749" },
    UNKNOWN: { bg: "#f7fafc", border: "#a0aec0", text: "#718096" },
  };
  const colors = riskColors[risk] || riskColors.UNKNOWN;
  const action = report?.analysis?.recommendation?.action || "CONSULT_ATTORNEY";
  const actionLabels = {
    PROCEED: "Clear to File",
    PROCEED_WITH_CAUTION: "Proceed with Caution",
    REBRAND_RECOMMENDED: "Rebrand Recommended",
    CONSULT_ATTORNEY: "Attorney Review Needed",
  };

  const topConflict = report?.analysis?.topConflict;
  const nextSteps = report?.analysis?.recommendation?.nextSteps || [];
  const scoredConflicts = report?.scoring?.scoredConflicts || [];

  const conflictRows = scoredConflicts.slice(0, 5).map((c) => {
    const riskBadgeColor = { HIGH: "#e53e3e", MEDIUM: "#d69e2e", LOW: "#38a169" }[c.riskScore] || "#a0aec0";
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#111;font-weight:600;">${c.markName || "-"}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#777;">${c.owner || "-"}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#777;">${c.status || "-"}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">
          <span style="background:${riskBadgeColor};color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;">${c.riskScore}</span>
        </td>
      </tr>`;
  }).join("");

  const nextStepsList = nextSteps.map((step, i) => `
    <tr>
      <td style="padding:6px 0;vertical-align:top;width:28px;">
        <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#c9a84c;color:#fff;font-size:11px;font-weight:800;text-align:center;line-height:22px;">${i + 1}</span>
      </td>
      <td style="padding:6px 0 6px 8px;font-size:13px;color:#333;line-height:1.6;">${step}</td>
    </tr>`).join("");

  const isMemo = product === "memo";
  const productLabel = isMemo ? "AI Legal Memo" : "AI Analysis Report";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your ${productLabel} - ${mark}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td style="background:#111;padding:28px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td><span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">MarkItNow<span style="color:#c9a84c;">.ai</span></span></td>
            <td align="right"><span style="font-size:11px;color:rgba(255,255,255,0.5);font-weight:600;text-transform:uppercase;letter-spacing:1px;">${productLabel}</span></td>
          </tr>
        </table>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:40px;">

        <p style="font-size:14px;color:#888;margin:0 0 8px;">Mark analyzed</p>
        <h1 style="font-size:28px;font-weight:900;color:#111;margin:0 0 24px;">"${mark}"</h1>

        <!-- Risk banner -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${colors.bg};border:1.5px solid ${colors.border};border-radius:12px;margin:0 0 28px;">
          <tr><td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="font-size:11px;font-weight:700;color:${colors.text};text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Overall Risk</p>
                  <p style="font-size:32px;font-weight:900;color:${colors.text};margin:0 0 4px;">${risk}</p>
                  <p style="font-size:13px;color:#555;margin:0;">${report?.retrieval?.activeCount || 0} active conflicts out of ${report?.retrieval?.totalFound || 0} total results</p>
                </td>
                <td align="right" style="vertical-align:top;">
                  <span style="display:inline-block;background:#111;color:#fff;font-size:12px;font-weight:700;padding:8px 16px;border-radius:6px;">${actionLabels[action] || action}</span>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>

        <!-- Executive Summary -->
        <p style="font-size:13px;font-weight:700;color:#111;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Executive Summary</p>
        <p style="font-size:14px;color:#333;line-height:1.7;margin:0 0 28px;">${report?.analysis?.executiveSummary || "Analysis completed."}</p>

        ${topConflict?.markName ? `
        <!-- Top Conflict -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border:1px solid #fde8c8;border-radius:12px;margin:0 0 28px;">
          <tr><td style="padding:20px 24px;">
            <p style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Highest-Risk Conflict</p>
            <p style="font-size:17px;font-weight:800;color:#111;margin:0 0 4px;">${topConflict.markName}</p>
            ${topConflict.serialNumber ? `<p style="font-size:11px;color:#999;margin:0 0 12px;">Serial No. ${topConflict.serialNumber}</p>` : ""}
            <p style="font-size:13px;color:#555;line-height:1.6;margin:0 0 8px;"><strong>Why it matters:</strong> ${topConflict.whyItMatters || ""}</p>
            <p style="font-size:13px;color:#555;line-height:1.6;margin:0;"><strong>What to do:</strong> ${topConflict.whatToDoAboutIt || ""}</p>
          </td></tr>
        </table>` : ""}

        ${conflictRows ? `
        <!-- Conflict Table -->
        <p style="font-size:13px;font-weight:700;color:#111;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Scored Conflicts (Top ${Math.min(5, scoredConflicts.length)} of ${scoredConflicts.length})</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;margin:0 0 28px;">
          <tr style="background:#f8f8f8;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#777;text-transform:uppercase;letter-spacing:0.5px;">Mark</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#777;text-transform:uppercase;letter-spacing:0.5px;">Owner</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#777;text-transform:uppercase;letter-spacing:0.5px;">Status</th>
            <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#777;text-transform:uppercase;letter-spacing:0.5px;">Risk</th>
          </tr>
          ${conflictRows}
        </table>` : ""}

        ${nextStepsList ? `
        <!-- Next Steps -->
        <p style="font-size:13px;font-weight:700;color:#111;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Recommended Next Steps</p>
        <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
          ${nextStepsList}
        </table>` : ""}

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-radius:12px;margin:0 0 28px;">
          <tr><td style="padding:24px;text-align:center;">
            <p style="font-size:13px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Ready to file?</p>
            <p style="font-size:14px;color:#aaa;margin:0 0 16px;line-height:1.6;">Attorney-filed TEAS Plus application. Your mark, your class, professionally prepared.</p>
            <a href="${BASE_URL}/file?mark=${encodeURIComponent(mark)}" style="display:inline-block;background:#c9a84c;color:#111;font-size:14px;font-weight:900;padding:14px 28px;border-radius:8px;text-decoration:none;">File with an Attorney - $399 + USPTO fees</a>
          </td></tr>
        </table>

        <!-- Disclaimer -->
        <p style="font-size:12px;color:#aaa;line-height:1.7;margin:0;">${report?.analysis?.disclaimer || "This report is AI-generated and provided for informational purposes only. It does not constitute legal advice."}</p>

      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f8f8f8;padding:24px 40px;border-top:1px solid #eee;">
        <p style="font-size:12px;color:#bbb;margin:0;line-height:1.6;">
          © 2026 MarkItNow.ai · AI-generated report · Not legal advice<br>
          <a href="${BASE_URL}/unsubscribe?email=${encodeURIComponent(email)}" style="color:#ddd;">Unsubscribe</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Send email via Resend ──────────────────────────────────────────────────────

async function sendReportEmail(email, mark, report, product) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Webhook] RESEND_API_KEY not set - skipping email delivery");
    return;
  }

  const isMemo = product === "memo";
  const subject = isMemo
    ? `Your AI Legal Memo for "${mark}" is ready`
    : `Your AI Analysis Report for "${mark}" is ready`;

  const html = buildReportEmail(mark, email, report, product);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MarkItNow.ai <reports@markitnow.ai>",
      to: email,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Resend error: ${err.message}`);
  }

  return res.json();
}

// ── Trigger post-purchase drip ────────────────────────────────────────────────

function triggerPostPurchaseDrip(email, mark, product, report) {
  const risk = report?.scoring?.overallRisk || "UNKNOWN";

  // Post-purchase sequence is different from pre-purchase drip
  // Day 3: "Now that you have your report, here's what to do next"
  // Day 7: Push toward filing or subscription
  // Day 14: Upsell to Watch plan if not yet subscribed
  const drips = [
    {
      day: 3,
      subject: risk === "HIGH"
        ? `Next steps for "${mark}" - your report found active conflicts`
        : `Next steps for "${mark}" - your report is ready to act on`,
    },
    { day: 7, subject: `Have you filed "${mark}" yet? Here's how to do it right` },
    { day: 14, subject: `Protect "${mark}" after filing - monitoring matters` },
  ];

  for (const d of drips) {
    fetch(`${BASE_URL}/api/drip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        mark,
        day: d.day,
        subject: d.subject,
        source: "post_purchase",
        product,
      }),
    }).catch(() => {});
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = await verifyStripeSignature(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook signature invalid: ${err.message}` });
  }

  // Only handle completed checkouts
  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ received: true, skipped: event.type });
  }

  const session = event.data.object;
  const email = session.customer_details?.email || session.customer_email;
  const mark = session.metadata?.mark;
  const product = session.metadata?.product || "report";
  const goodsServices = session.metadata?.goodsServices || null;
  const classCode = session.metadata?.classCode || null;
  const amountPaid = session.amount_total / 100;

  console.log(`[Webhook] Payment confirmed: ${email} | mark: "${mark}" | product: ${product} | amount: $${amountPaid}`);

  if (!email || !mark) {
    console.error("[Webhook] Missing email or mark in session metadata");
    return res.status(200).json({ received: true, error: "Missing email or mark" });
  }

  // Respond to Stripe immediately - processing happens async
  res.status(200).json({ received: true });

  // ── Async processing after responding to Stripe ──
  try {
    // Step 1: Run Analysis Agent
    console.log(`[Webhook] Running Analysis Agent for "${mark}"`);
    const report = await runAnalysisAgent(mark, goodsServices, classCode);
    console.log(`[Webhook] Analysis complete - Risk: ${report?.scoring?.overallRisk}`);

    // Step 2: Run Lead Profile Agent (buyer segment - highest value)
    fetch(`${BASE_URL}/api/lead-profile-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        mark,
        conflictCount: report?.retrieval?.totalFound || 0,
        activeCount: report?.retrieval?.activeCount || 0,
        goodsServices,
        source: "stripe_paid",
        product,
        amountPaid,
      }),
    }).then(async (r) => {
      const profile = await r.json();
      console.log(`[Webhook] Lead profiled: ${profile.segment?.segment} | urgency: ${profile.profile?.urgencyScore}`);
    }).catch((e) => console.error("[Webhook] Lead profile error:", e));

    // Step 3: Deliver report via email
    console.log(`[Webhook] Sending report email to ${email}`);
    await sendReportEmail(email, mark, report, product);
    console.log(`[Webhook] Report delivered to ${email}`);

    // Step 4: Trigger post-purchase drip
    triggerPostPurchaseDrip(email, mark, product, report);
    console.log(`[Webhook] Post-purchase drip queued for ${email}`);

  } catch (err) {
    console.error("[Webhook] Processing error:", err.message);
    // TODO: Add to retry queue / alert Wali via email if delivery fails
  }
}
