// pages/api/drip.js
// Handles scheduled drip emails — called internally from subscribe.js
// In production, replace setTimeout with a real queue (Resend Scheduled, Inngest, QStash)
// For MVP: this endpoint is called immediately but uses Resend's scheduledAt param

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, mark, day, subject, apiKey } = req.body;
  if (!email || !mark || !day || !apiKey) return res.status(400).json({ error: "Missing params" });

  const scheduledAt = new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString();

  const emailBuilders = {
    3: buildDay3Email,
    7: buildDay7Email,
    14: buildDay14Email,
    30: buildDay30Email,
  };

  const builder = emailBuilders[day];
  if (!builder) return res.status(400).json({ error: "Invalid day" });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MarkItNow.ai <hello@markitnow.ai>",
        to: email,
        subject,
        html: builder(mark, email),
        scheduled_at: scheduledAt,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error(`Drip day ${day} failed:`, err);
    }

    return res.status(200).json({ success: true, scheduled_at: scheduledAt });
  } catch (err) {
    console.error("Drip error:", err);
    return res.status(200).json({ success: true });
  }
}

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────

function emailWrapper(mark, content, footer) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
      <tr><td style="background:#111;padding:28px 40px;">
        <span style="font-size:22px;font-weight:900;color:#fff;">MarkItNow<span style="color:#c9a84c;">.ai</span></span>
      </td></tr>
      <tr><td style="padding:40px;">${content}</td></tr>
      <tr><td style="background:#f8f8f8;padding:24px 40px;border-top:1px solid #eee;">
        <p style="font-size:12px;color:#bbb;margin:0;line-height:1.6;">© 2026 MarkItNow.ai · Not legal advice · Legal services provided by licensed partner law firms<br>${footer}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function ctaButton(href, text) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td align="center">
      <a href="${href}" style="display:inline-block;background:#c9a84c;color:#111;font-size:15px;font-weight:900;padding:16px 36px;border-radius:12px;text-decoration:none;">${text}</a>
    </td></tr>
  </table>`;
}

// DAY 3 — Competitor urgency
function buildDay3Email(mark, email) {
  const content = `
    <p style="font-size:13px;color:#888;margin:0 0 8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Day 3 Follow-up</p>
    <h1 style="font-size:26px;font-weight:900;color:#111;margin:0 0 20px;line-height:1.2;">A competitor could file <span style="color:#c9a84c;">"${mark}"</span> this week.</h1>

    <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px;">Trademark law is first to file, not first to use. That means whoever submits their application first gets the priority date — even if you've been using your brand longer.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;border:1px solid #fed7d7;border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:24px;">
        <p style="font-size:13px;font-weight:700;color:#c53030;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">What happens if they file first</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${["Your application gets blocked by their prior filing", "You receive a likelihood of confusion refusal", "You may be forced to rebrand — even years in", "You have no legal basis to make them stop"].map(item =>
            `<tr><td style="padding:5px 0;font-size:14px;color:#555;"><span style="color:#e74c3c;font-weight:900;margin-right:8px;">✗</span>${item}</td></tr>`
          ).join("")}
        </table>
      </td></tr>
    </table>

    <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 8px;">The fastest way to lock in your priority date is to file. The fastest way to know if filing is safe is an AI conflict analysis on <strong>"${mark}"</strong>.</p>

    ${ctaButton(`https://markitnow.ai/file?mark=${encodeURIComponent(mark)}`, "Lock In Your Priority Date →")}

    <p style="font-size:13px;color:#aaa;line-height:1.6;margin:0;">Already filed? Make sure no one is filing against you with our <a href="https://markitnow.ai/protect" style="color:#c9a84c;font-weight:700;">Monitor plan from $79/month</a>.</p>`;

  return emailWrapper(mark, content, `<a href="https://markitnow.ai/unsubscribe?email=${encodeURIComponent(email)}" style="color:#ddd;">Unsubscribe</a>`);
}

// DAY 7 — Office Action education
function buildDay7Email(mark, email) {
  const content = `
    <p style="font-size:13px;color:#888;margin:0 0 8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">What most applicants don't know</p>
    <h1 style="font-size:26px;font-weight:900;color:#111;margin:0 0 20px;line-height:1.2;">Most first-time trademark filers get rejected. Here's why.</h1>

    <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px;">The USPTO issues an <strong>Office Action</strong> — a formal objection — on the majority of applications filed without attorney review. Most applicants don't know this until they're staring at a legal document with a 3-month response deadline.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f8;border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:24px;">
        <p style="font-size:13px;font-weight:700;color:#555;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px;">Common Office Action reasons</p>
        ${[
          ["Likelihood of confusion", "A similar mark already exists in your class. This is the #1 reason applications get blocked."],
          ["Merely descriptive", "Your mark describes your goods or services too directly to be registrable as-is."],
          ["Specimen issues", "Your specimen doesn't properly show the mark being used in commerce."],
          ["ID of goods and services", "Your description is too broad, too vague, or uses non-approved language."],
        ].map(([title, desc]) => `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
            <tr>
              <td width="12" style="vertical-align:top;padding-top:3px;"><div style="width:8px;height:8px;border-radius:50%;background:#c9a84c;"></div></td>
              <td style="padding-left:10px;"><strong style="font-size:13px;color:#111;">${title}</strong><br><span style="font-size:12px;color:#888;line-height:1.5;">${desc}</span></td>
            </tr>
          </table>`).join("")}
      </td></tr>
    </table>

    <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 8px;">An AI conflict analysis identifies these issues <em>before</em> you file — so your application is built to get through, not bounce back.</p>

    ${ctaButton(`https://markitnow.ai/file?mark=${encodeURIComponent(mark)}`, "Check \"${mark}\" Before You File →")}

    <p style="font-size:13px;color:#aaa;line-height:1.6;margin:0;">Already received an Office Action? Our attorneys can draft a response starting at $499. <a href="mailto:legal@jarralslaw.com" style="color:#c9a84c;font-weight:700;">Email us directly.</a></p>`;

  return emailWrapper(mark, content, `<a href="https://markitnow.ai/unsubscribe?email=${encodeURIComponent(email)}" style="color:#ddd;">Unsubscribe</a>`);
}

// DAY 14 — Still unprotected, direct close
function buildDay14Email(mark, email) {
  const content = `
    <p style="font-size:13px;color:#888;margin:0 0 8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Two weeks since your search</p>
    <h1 style="font-size:26px;font-weight:900;color:#111;margin:0 0 20px;line-height:1.2;"><span style="color:#c9a84c;">"${mark}"</span> still isn't protected.</h1>

    <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 24px;">You searched two weeks ago. In that time, new trademark applications have been filed every business day. We don't know if any of them conflict with yours — and neither do you.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #c9a84c;border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:28px;">
        <p style="font-size:13px;font-weight:700;color:#b8860b;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px;">Where you could be in 30 days</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="48%" style="vertical-align:top;padding-right:16px;">
              <p style="font-size:12px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Without acting today</p>
              ${["Still no priority date", "No conflict monitoring", "Competitors filing freely", "Same risk, more time lost"].map(i =>
                `<p style="font-size:13px;color:#aaa;margin:0 0 6px;"><span style="color:#e74c3c;font-weight:900;margin-right:6px;">✗</span>${i}</p>`
              ).join("")}
            </td>
            <td width="4%"></td>
            <td width="48%" style="vertical-align:top;">
              <p style="font-size:12px;font-weight:700;color:#b8860b;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">With a $99 report today</p>
              ${["Full conflict picture", "Know your risk score", "Build a filing strategy", "AI analysis in minutes"].map(i =>
                `<p style="font-size:13px;color:#444;margin:0 0 6px;"><span style="color:#c9a84c;font-weight:900;margin-right:6px;">✓</span>${i}</p>`
              ).join("")}
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    ${ctaButton(`https://markitnow.ai/file?mark=${encodeURIComponent(mark)}`, "Get the $99 Analysis Now →")}

    <p style="font-size:14px;color:#555;line-height:1.7;margin:0;">Not ready to file yet? At minimum, <a href="https://markitnow.ai/protect" style="color:#c9a84c;font-weight:700;">start monitoring for $79/month</a> so you know the moment something threatens your brand.</p>`;

  return emailWrapper(mark, content, `<a href="https://markitnow.ai/unsubscribe?email=${encodeURIComponent(email)}" style="color:#ddd;">Unsubscribe</a>`);
}

// DAY 30 — Final, loss framing, scarcity
function buildDay30Email(mark, email) {
  const content = `
    <p style="font-size:13px;color:#888;margin:0 0 8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Final message</p>
    <h1 style="font-size:26px;font-weight:900;color:#111;margin:0 0 20px;line-height:1.2;">This is the last time we'll reach out about <span style="color:#c9a84c;">"${mark}"</span>.</h1>

    <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px;">Thirty days ago you searched your brand name. We don't know what you decided — maybe you filed elsewhere, maybe you're still thinking about it. Either way, this is our last reminder.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:28px;">
        <p style="font-size:16px;font-weight:900;color:#fff;margin:0 0 12px;line-height:1.4;">The cost of waiting isn't zero.</p>
        <p style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7;margin:0 0 16px;">Every day without a registration means no statutory damages, no presumption of ownership, no nationwide priority. You can use a mark for years and still lose it to someone who filed after you.</p>
        <p style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7;margin:0;">The search was free. The analysis is $99. The filing is $399. The cost of a dispute is $50,000+. The math isn't subtle.</p>
      </td></tr>
    </table>

    ${ctaButton(`https://markitnow.ai/file?mark=${encodeURIComponent(mark)}`, "Protect \"${mark}\" Today →")}

    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 12px;">If you have questions before committing, reply to this email. A licensed trademark attorney reads every response.</p>
    <p style="font-size:13px;color:#aaa;line-height:1.6;margin:0;">After this email we won't contact you again about this search unless you reach out to us.</p>`;

  return emailWrapper(mark, content, `<a href="https://markitnow.ai/unsubscribe?email=${encodeURIComponent(email)}" style="color:#ddd;">Unsubscribe</a>`);
}
