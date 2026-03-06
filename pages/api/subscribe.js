// pages/api/subscribe.js
// Captures email, stores lead data, triggers Day 1 email immediately via Resend
// Set RESEND_API_KEY in Vercel environment variables
// Get your free API key at resend.com - free tier: 3,000 emails/month

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, mark, source, conflictCount, activeCount, goodsServices } = req.body;
  if (!email?.trim()) return res.status(400).json({ error: "Email required" });

  const apiKey = process.env.RESEND_API_KEY;

  // Log capture regardless of email provider status
  console.log("EMAIL CAPTURE:", { email, mark, source, timestamp: new Date().toISOString() });

  // ── lead-profile-agent: fire and forget ──
  // Profiles the lead, segments them, generates personalized email copy
  // Non-blocking - subscribe response is not delayed
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://markitnow-two.vercel.app";
  fetch(`${baseUrl}/api/lead-profile-agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, mark, conflictCount, activeCount, goodsServices, source }),
  }).then(async (r) => {
    const profile = await r.json();
    console.log("LEAD PROFILE:", JSON.stringify({
      email,
      segment: profile.segment?.segment,
      urgencyScore: profile.profile?.urgencyScore,
      subject: profile.emailCopy?.subject,
    }));
  }).catch((e) => console.error("lead-profile-agent error:", e));

  if (!apiKey) {
    console.warn("RESEND_API_KEY not set - email not sent");
    return res.status(200).json({ success: true, warning: "Email provider not configured" });
  }

  try {
    // Send Day 1 email immediately
    await sendEmail(apiKey, {
      to: email,
      subject: `Your USPTO search results for "${mark}"`,
      html: buildDay1Email(mark, email),
    });

    // Schedule remaining drip emails via Resend's scheduled sends
    // Day 3, 7, 14, 30 - each triggered via the /api/drip route with a delay
    const drip = [
      { day: 3, subject: `A competitor could file "${mark}" this week` },
      { day: 7, subject: `What happens if your trademark application gets rejected` },
      { day: 14, subject: `"${mark}" still isn't protected` },
      { day: 30, subject: `Final reminder: your brand is still unprotected` },
    ];

    // Fire and forget - schedule each drip
    for (const d of drip) {
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "https://markitnow-two.vercel.app"}/api/drip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mark, day: d.day, subject: d.subject, apiKey }),
      }).catch(() => {}); // Non-blocking
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    return res.status(200).json({ success: true }); // Still return success to user
  }
}

async function sendEmail(apiKey, { to, subject, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MarkItNow.ai <hello@markitnow.ai>",
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Resend API error");
  }
  return res.json();
}

function buildDay1Email(mark, email) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Your USPTO Search Results</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td style="background:#111;padding:28px 40px;">
        <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">MarkItNow<span style="color:#c9a84c;">.ai</span></span>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:40px;">
        <p style="font-size:15px;color:#888;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your Search Results</p>
        <h1 style="font-size:28px;font-weight:900;color:#111;margin:0 0 20px;line-height:1.2;">You searched for <span style="color:#c9a84c;">"${mark}"</span></h1>
        <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 28px;">Here's what you need to know about your search - and what to do next.</p>

        <!-- Risk box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border:1px solid #fde8c8;border-radius:12px;margin:0 0 28px;">
          <tr><td style="padding:24px;">
            <p style="font-size:13px;font-weight:700;color:#92400e;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">What you're up against</p>
            <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 8px;">The USPTO database has over 4 million active and dead marks. A single conflicting registration in your class can block your application - even if your brand is already in use.</p>
            <p style="font-size:14px;color:#555;line-height:1.7;margin:0;">The free search shows you what's there. The AI analysis tells you what it means for <strong>"${mark}"</strong> specifically.</p>
          </td></tr>
        </table>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
          <tr><td align="center">
            <a href="https://markitnow.ai/file?mark=${encodeURIComponent(mark)}" style="display:inline-block;background:#c9a84c;color:#111;font-size:15px;font-weight:900;padding:16px 36px;border-radius:12px;text-decoration:none;letter-spacing:-0.3px;">Get Your AI Analysis Report - $99 →</a>
          </td></tr>
        </table>

        <p style="font-size:13px;color:#aaa;text-align:center;margin:0 0 32px;">Risk score, DuPont factor breakdown, class-by-class conflict analysis. PDF delivered instantly.</p>

        <!-- Insurance math -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-radius:12px;margin:0 0 28px;">
          <tr>
            <td width="50%" style="padding:20px 24px;border-right:1px solid #eee;">
              <p style="font-size:11px;font-weight:700;color:#c0392b;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Cost of a trademark dispute</p>
              <p style="font-size:28px;font-weight:900;color:#c0392b;margin:0 0 4px;">$50,000+</p>
              <p style="font-size:12px;color:#aaa;margin:0;line-height:1.5;">Average litigation cost. Does not include rebranding.</p>
            </td>
            <td width="50%" style="padding:20px 24px;">
              <p style="font-size:11px;font-weight:700;color:#2d7a4f;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Cost of knowing now</p>
              <p style="font-size:28px;font-weight:900;color:#2d7a4f;margin:0 0 4px;">$99</p>
              <p style="font-size:12px;color:#aaa;margin:0;line-height:1.5;">Full AI conflict analysis. Instant PDF.</p>
            </td>
          </tr>
        </table>

        <p style="font-size:14px;color:#555;line-height:1.7;margin:0;">Questions? Reply to this email - a real person reads every response.</p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f8f8f8;padding:24px 40px;border-top:1px solid #eee;">
        <p style="font-size:12px;color:#bbb;margin:0;line-height:1.6;">© 2026 MarkItNow.ai · Not legal advice · Legal services provided by licensed partner law firms<br>
        <a href="https://markitnow.ai/unsubscribe?email=${encodeURIComponent(email)}" style="color:#ddd;">Unsubscribe</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}
