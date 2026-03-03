import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

const NAV_ITEMS = ["How It Works", "Pricing", "For Attorneys"];

const SERVICES = [
  {
    category: "Search & Analysis",
    items: [
      {
        name: "Trademark Search",
        price: "Free",
        priceNote: "Always free",
        description: "Search the live USPTO database of 4M+ marks instantly. See active conflicts, dead marks, and status.",
        features: ["Live USPTO database", "Active & dead marks", "No account required", "Results in seconds"],
        cta: "Search Free",
        ctaAction: "search",
        highlight: false,
        badge: null,
      },
      {
        name: "AI Analysis Report",
        price: "$99",
        priceNote: "One-time",
        description: "Full AI-powered conflict analysis with risk scoring, DuPont factor breakdown, and filing recommendations.",
        features: ["Likelihood of confusion analysis", "Risk score (0–100)", "Class-by-class breakdown", "Filing strategy recommendations"],
        cta: "Get Report",
        ctaAction: "search",
        highlight: true,
        badge: "Most Popular",
      },
      {
        name: "Attorney Memo",
        price: "$149",
        priceNote: "One-time",
        description: "A formal attorney-reviewed legal memo covering all 13 DuPont factors with prosecution strategy.",
        features: ["All 13 DuPont factors analyzed", "Attorney-signed memo", "Risk matrix", "Prosecution strategy"],
        cta: "Get Memo",
        ctaAction: "search",
        highlight: false,
        badge: null,
      },
    ],
  },
  {
    category: "Filing Services",
    items: [
      {
        name: "Attorney-Filed TEAS Plus",
        price: "$399",
        priceNote: "+ USPTO fees",
        description: "Full trademark application filed by a U.S.-licensed DC attorney. Includes specimen review and class strategy.",
        features: ["Licensed DC attorney files", "Specimen review included", "Class strategy consultation", "USPTO filing fees separate (~$250/class)"],
        cta: "Start Filing",
        ctaAction: "file",
        highlight: true,
        badge: "$100 less than Trademarkia",
      },
      {
        name: "Statement of Use",
        price: "$249",
        priceNote: "+ USPTO fees",
        description: "Filed when your intent-to-use application is approved and you're ready to show use in commerce.",
        features: ["Specimen preparation review", "Attorney-filed SOU", "Use in commerce guidance", "USPTO fees separate"],
        cta: "File SOU",
        ctaAction: "contact",
        highlight: false,
        badge: null,
      },
      {
        name: "Trademark Revival",
        price: "$349",
        priceNote: "+ USPTO fees",
        description: "Revive an abandoned trademark application with a petition to the USPTO. Time-sensitive — act fast.",
        features: ["Petition to revive drafted", "Attorney-filed", "Urgency analysis included", "USPTO fees separate"],
        cta: "Revive Now",
        ctaAction: "contact",
        highlight: false,
        badge: "Time Sensitive",
      },
    ],
  },
  {
    category: "Ongoing Protection",
    items: [
      {
        name: "Portfolio Monitor",
        price: "$49",
        priceNote: "per mark / year",
        description: "We watch your trademark 24/7 and alert you to status changes, office actions, and upcoming deadlines.",
        features: ["Weekly USPTO status checks", "Deadline alerts (renewals, SOU)", "Office action notifications", "Client dashboard access"],
        cta: "Start Monitoring",
        ctaAction: "contact",
        highlight: false,
        badge: "Coming Soon",
      },
      {
        name: "Renewal Filing",
        price: "$199",
        priceNote: "+ USPTO fees",
        description: "Section 8 & 15 declarations (years 5–6) and Section 9 renewals (year 10+) filed by a licensed attorney.",
        features: ["Section 8 & 15 declarations", "Section 9 renewals", "Attorney-filed", "Deadline monitoring included"],
        cta: "File Renewal",
        ctaAction: "contact",
        highlight: false,
        badge: null,
      },
      {
        name: "Office Action Response",
        price: "$499+",
        priceNote: "quoted per case",
        description: "Attorney-drafted response to USPTO office actions. Complexity varies — contact us for a quote.",
        features: ["Attorney analysis of OA", "Full response drafted", "Likelihood of confusion arguments", "Quoted based on complexity"],
        cta: "Get Quote",
        ctaAction: "contact",
        highlight: false,
        badge: "Attorney Required",
      },
    ],
  },
];

const COMPARE = [
  { service: "Trademark Search", markitnow: "Free", trademarkia: "Free", legalzoom: "Free" },
  { service: "AI Analysis Report", markitnow: "$99", trademarkia: "N/A", legalzoom: "N/A" },
  { service: "Attorney Memo", markitnow: "$149", trademarkia: "N/A", legalzoom: "N/A" },
  { service: "Attorney Filing", markitnow: "$399", trademarkia: "$499", legalzoom: "$599+" },
  { service: "Renewal Filing", markitnow: "$199", trademarkia: "$299", legalzoom: "$399+" },
  { service: "Portfolio Monitoring", markitnow: "$49/yr", trademarkia: "N/A", legalzoom: "N/A" },
];

export default function Pricing() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState(null);

  function handleCTA(action) {
    if (action === "search") router.push("/");
    else if (action === "file") router.push("/file");
    else if (action === "contact") window.location.href = "mailto:legal@jarralslaw.com?subject=MarkItNow Inquiry";
  }

  return (
    <>
      <Head>
        <title>Pricing — MarkItNow.ai</title>
        <meta name="description" content="Transparent trademark pricing. Search free, AI report $99, attorney filing $399. Always less than Trademarkia." />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0f2419 0%, #1a3c2e 50%, #0f2419 100%)", fontFamily: "Poppins, sans-serif" }}>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div onClick={() => router.push("/")} style={{ fontWeight: 900, fontSize: 24, color: "#c9a84c", letterSpacing: -0.5, cursor: "pointer" }}>
            MarkItNow<span style={{ color: "#7ecba1" }}>.ai</span>
          </div>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {NAV_ITEMS.map(item => (
              <span key={item} onClick={() => item === "Pricing" ? null : router.push("/")} style={{ color: item === "Pricing" ? "#c9a84c" : "#7ecba1", fontSize: 14, fontWeight: item === "Pricing" ? 700 : 500, cursor: "pointer", opacity: item === "Pricing" ? 1 : 0.8 }}>{item}</span>
            ))}
            <button onClick={() => router.push("/file")} style={{ background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
              File Now
            </button>
          </div>
        </nav>

        {/* Hero */}
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#c9a84c", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 24 }}>
            Transparent Pricing. No Surprises.
          </div>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 20, letterSpacing: -2 }}>
            Everything you need.<br />
            <span style={{ color: "#c9a84c" }}>Nothing you don't.</span>
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto" }}>
            From free search to full attorney filing — pick exactly what your trademark needs. No subscriptions required unless you want portfolio monitoring.
          </p>
        </div>

        {/* Service Categories */}
        {SERVICES.map((category) => (
          <div key={category.category} style={{ maxWidth: 1200, margin: "0 auto 80px", padding: "0 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
              <div style={{ width: 4, height: 28, background: "#c9a84c", borderRadius: 2 }} />
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: -0.5 }}>{category.category}</h2>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
              {category.items.map((service, idx) => {
                const cardKey = `${category.category}-${idx}`;
                const isHovered = hoveredCard === cardKey;
                return (
                  <div
                    key={service.name}
                    onMouseEnter={() => setHoveredCard(cardKey)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      background: service.highlight
                        ? "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.05) 100%)"
                        : "rgba(255,255,255,0.04)",
                      border: service.highlight ? "1px solid rgba(201,168,76,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      padding: 28,
                      position: "relative",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                      boxShadow: isHovered ? "0 20px 40px rgba(0,0,0,0.3)" : "none",
                    }}
                  >
                    {service.badge && (
                      <div style={{
                        position: "absolute", top: -12, right: 20,
                        background: service.badge === "Coming Soon" ? "#1a3c2e" : service.badge === "Time Sensitive" ? "#7c2d12" : "#c9a84c",
                        border: service.badge === "Coming Soon" ? "1px solid rgba(201,168,76,0.4)" : "none",
                        color: service.badge === "Coming Soon" ? "#c9a84c" : service.badge === "Time Sensitive" ? "#fca5a5" : "#0a0a0a",
                        fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20, letterSpacing: 0.5, textTransform: "uppercase"
                      }}>
                        {service.badge}
                      </div>
                    )}

                    <div style={{ marginBottom: 16 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 4px", letterSpacing: -0.3 }}>{service.name}</h3>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: 32, fontWeight: 900, color: service.highlight ? "#c9a84c" : "#fff" }}>{service.price}</span>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{service.priceNote}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 20 }}>{service.description}</p>

                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {service.features.map(f => (
                        <li key={f} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#7ecba1", fontSize: 14 }}>✓</span> {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleCTA(service.ctaAction)}
                      style={{
                        width: "100%",
                        background: service.highlight ? "#c9a84c" : "rgba(255,255,255,0.08)",
                        color: service.highlight ? "#0a0a0a" : "#fff",
                        border: service.highlight ? "none" : "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 10, padding: "12px 20px",
                        fontWeight: 800, fontSize: 14, cursor: "pointer",
                        transition: "all 0.2s",
                        fontFamily: "Poppins, sans-serif",
                      }}
                    >
                      {service.cta} →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Comparison Table */}
        <div style={{ maxWidth: 900, margin: "0 auto 100px", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: -1, marginBottom: 12 }}>
              How we compare
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>Same services. Less money. Licensed attorney.</p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: "rgba(201,168,76,0.1)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ padding: "16px 24px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>Service</div>
              <div style={{ padding: "16px 24px", fontSize: 13, fontWeight: 800, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>MarkItNow</div>
              <div style={{ padding: "16px 24px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>Trademarkia</div>
              <div style={{ padding: "16px 24px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>LegalZoom</div>
            </div>

            {COMPARE.map((row, i) => (
              <div key={row.service} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", borderBottom: i < COMPARE.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                <div style={{ padding: "16px 24px", fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{row.service}</div>
                <div style={{ padding: "16px 24px", fontSize: 14, fontWeight: 800, color: "#7ecba1", textAlign: "center" }}>{row.markitnow}</div>
                <div style={{ padding: "16px 24px", fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>{row.trademarkia}</div>
                <div style={{ padding: "16px 24px", fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>{row.legalzoom}</div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 16 }}>
            Competitor prices as of March 2026. USPTO government filing fees are separate and not included above.
          </p>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 720, margin: "0 auto 100px", padding: "0 24px" }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: -1, marginBottom: 48, textAlign: "center" }}>Frequently Asked Questions</h2>
          {[
            { q: "Are USPTO filing fees included?", a: "No. USPTO government fees are separate and paid directly to the USPTO. For TEAS Plus applications, the fee is $250 per class. We'll always tell you the total cost upfront before you pay anything." },
            { q: "Who is the attorney?", a: "All filings are handled by a U.S.-licensed attorney in the District of Columbia with experience in trademark prosecution and entertainment industry clients." },
            { q: "What if I get an Office Action?", a: "Office Action responses are quoted per case starting at $499. The complexity varies widely depending on the examiner's objections. Contact us after receiving your OA and we'll give you a quote within 24 hours." },
            { q: "What's the difference between the $99 report and the $149 memo?", a: "The $99 AI Report is a consumer-friendly risk analysis with a confidence score and plain-English explanation. The $149 Attorney Memo is a formal legal document covering all 13 DuPont factors, suitable for business decisions or sharing with investors." },
            { q: "When do I need a Statement of Use?", a: "If you filed an intent-to-use application, you'll need to file a Statement of Use once the USPTO approves your application and you begin using the mark in commerce. Deadlines are strict — this is a good reason to use Portfolio Monitor." },
          ].map(({ q, a }) => (
            <div key={q} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 28, marginBottom: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{q}</h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div style={{ maxWidth: 900, margin: "0 auto 80px", padding: "0 24px" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(126,203,161,0.1) 100%)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 20, padding: "60px 48px", textAlign: "center" }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", marginBottom: 16, letterSpacing: -1 }}>Start with a free search</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 32 }}>No account required. See your conflicts in seconds. Upgrade only if you need to.</p>
            <button onClick={() => router.push("/")} style={{ background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 12, padding: "16px 40px", fontWeight: 900, fontSize: 16, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              Search Free →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#c9a84c" }}>MarkItNow<span style={{ color: "#7ecba1" }}>.ai</span></div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>© 2026 Aggressive Counsel PLLC. Not legal advice until retained.</div>
        </div>
      </div>
    </>
  );
}
