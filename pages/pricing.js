import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

const SERVICES = [
  {
    category: "Search & Analysis",
    items: [
      {
        name: "Trademark Search",
        ourFee: "Free",
        usptoFee: null,
        totalNote: "Always free",
        description: "Search the live USPTO database of 4M+ marks instantly. See active conflicts, dead marks, and status.",
        features: ["Live USPTO database", "Active & dead marks", "No account required", "Results in seconds"],
        cta: "Search Free",
        ctaAction: "search",
        highlight: false,
        badge: null,
      },
      {
        name: "AI Analysis Report",
        ourFee: "$99",
        usptoFee: null,
        totalNote: "No USPTO fee",
        description: "Full AI-powered conflict analysis with risk scoring, DuPont factor breakdown, and filing recommendations.",
        features: ["Likelihood of confusion analysis", "Risk score (0–100)", "Class-by-class breakdown", "Filing strategy recommendations"],
        cta: "Get Report",
        ctaAction: "search",
        highlight: true,
        badge: "Most Popular",
      },
      {
        name: "Attorney Memo",
        ourFee: "$149",
        usptoFee: null,
        totalNote: "No USPTO fee",
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
        name: "Attorney-Filed Application",
        ourFee: "$399",
        usptoFee: "$350/class",
        totalNote: "Total: $749+ per class",
        description: "Full trademark application filed by a U.S.-licensed DC attorney. Includes specimen review and class strategy.",
        features: ["Licensed DC attorney files", "Specimen review included", "Class strategy consultation", "Our fee: $399 + USPTO: $350/class"],
        cta: "Start Filing",
        ctaAction: "file",
        highlight: true,
        badge: "$100 less than Trademarkia",
      },
      {
        name: "Statement of Use",
        ourFee: "$249",
        usptoFee: "$150/class",
        totalNote: "Total: $399+ per class",
        description: "Filed when your intent-to-use application is approved and you're ready to show use in commerce.",
        features: ["Specimen preparation review", "Attorney-filed SOU", "Use in commerce guidance", "Our fee: $249 + USPTO: $150/class"],
        cta: "File SOU",
        ctaAction: "contact",
        highlight: false,
        badge: null,
      },
      {
        name: "Trademark Revival",
        ourFee: "$349",
        usptoFee: "Varies",
        totalNote: "USPTO fee varies by type",
        description: "Revive an abandoned trademark application with a petition to the USPTO. Time-sensitive — act fast.",
        features: ["Petition to revive drafted", "Attorney-filed", "Urgency analysis included", "Our fee: $349 + USPTO fees"],
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
        ourFee: "$49/yr",
        usptoFee: null,
        totalNote: "Per mark, no USPTO fee",
        description: "We watch your trademark 24/7 and alert you to status changes, office actions, and upcoming deadlines.",
        features: ["Weekly USPTO status checks", "Deadline alerts (renewals, SOU)", "Office action notifications", "Client dashboard access"],
        cta: "Start Monitoring",
        ctaAction: "contact",
        highlight: false,
        badge: "Coming Soon",
      },
      {
        name: "Renewal Filing",
        ourFee: "$199",
        usptoFee: "$325/class",
        totalNote: "Total: $524+ per class",
        description: "Section 8 & 15 declarations (years 5–6) and Section 9 renewals (year 10+) filed by a licensed attorney.",
        features: ["Section 8 & 15 declarations", "Section 9 renewals", "Attorney-filed", "Our fee: $199 + USPTO: $325/class"],
        cta: "File Renewal",
        ctaAction: "contact",
        highlight: false,
        badge: null,
      },
      {
        name: "Office Action Response",
        ourFee: "$499+",
        usptoFee: null,
        totalNote: "Quoted per case, no USPTO fee",
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

const FAQS = [
  { q: "What are USPTO filing fees?", a: "USPTO fees are government fees paid directly to the U.S. Patent and Trademark Office — separate from our service fee. The base application fee is $350/class (as of January 2025). Statement of Use is $150/class. Renewals (Section 8 & 9) are $325/class. We always show you the total cost before you pay anything." },
  { q: "Who is the attorney?", a: "All filings are handled by a U.S.-licensed attorney in the District of Columbia with experience in trademark prosecution and entertainment industry clients." },
  { q: "What if I get an Office Action?", a: "Office Action responses are quoted per case starting at $499. Contact us after receiving your OA and we'll give you a quote within 24 hours. There is no additional USPTO fee to respond to most office actions." },
  { q: "What's the difference between the $99 report and the $149 memo?", a: "The $99 AI Report is a consumer-friendly risk analysis with a confidence score and plain-English explanation. The $149 Attorney Memo is a formal legal document covering all 13 DuPont factors, suitable for business decisions or sharing with investors." },
  { q: "When do I need a Statement of Use?", a: "If you filed an intent-to-use application, you'll need to file a Statement of Use once the USPTO approves your application and you begin using the mark in commerce. The USPTO fee is $150/class plus our $249 service fee. Deadlines are strict — this is a good reason to use Portfolio Monitor." },
];

export default function Pricing() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  function handleCTA(action) {
    if (action === "search") router.push("/");
    else if (action === "file") router.push("/file");
    else window.location.href = "mailto:legal@jarralslaw.com?subject=MarkItNow Inquiry";
  }

  return (
    <>
      <Head>
        <title>Pricing — MarkItNow.ai</title>
        <meta name="description" content="Transparent trademark pricing. Search free, AI report $99, attorney filing $399 + $350 USPTO fee." />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0f2419 0%, #1a3c2e 50%, #0f2419 100%)", fontFamily: "Poppins, sans-serif" }}>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div onClick={() => router.push("/")} style={{ fontWeight: 900, fontSize: 24, color: "#c9a84c", letterSpacing: -0.5, cursor: "pointer" }}>
            MarkItNow<span style={{ color: "#7ecba1" }}>.ai</span>
          </div>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {["How It Works", "Pricing", "For Attorneys"].map(item => (
              <span key={item} onClick={() => item === "Pricing" ? null : router.push("/")} style={{ color: item === "Pricing" ? "#c9a84c" : "#7ecba1", fontSize: 14, fontWeight: item === "Pricing" ? 700 : 500, cursor: "pointer", opacity: item === "Pricing" ? 1 : 0.8 }}>{item}</span>
            ))}
            <button onClick={() => router.push("/file")} style={{ background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              File Now
            </button>
          </div>
        </nav>

        {/* Hero */}
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "72px 24px 56px", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 16, letterSpacing: -2 }}>
            Simple, transparent<br /><span style={{ color: "#c9a84c" }}>pricing.</span>
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: 500, margin: "0 auto 0" }}>
            Our service fee plus USPTO government fees — always shown separately so you know exactly what you're paying.
          </p>
        </div>

        {/* Fee Legend */}
        <div style={{ maxWidth: 600, margin: "0 auto 56px", padding: "0 24px" }}>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 8, padding: "8px 16px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#c9a84c" }} />
              <span style={{ fontSize: 13, color: "#c9a84c", fontWeight: 600 }}>Our service fee</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>USPTO government fee (paid to USPTO)</span>
            </div>
          </div>
        </div>

        {/* Service Categories */}
        {SERVICES.map((category) => (
          <div key={category.category} style={{ maxWidth: 1200, margin: "0 auto 72px", padding: "0 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
              <div style={{ width: 4, height: 24, background: "#c9a84c", borderRadius: 2 }} />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>{category.category}</h2>
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
                      background: service.highlight ? "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.05) 100%)" : "rgba(255,255,255,0.04)",
                      border: service.highlight ? "1px solid rgba(201,168,76,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16, padding: 28, position: "relative",
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
                      }}>{service.badge}</div>
                    )}

                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: "0 0 16px" }}>{service.name}</h3>

                    {/* Fee Breakdown */}
                    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: service.usptoFee ? 8 : 0 }}>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Our fee</span>
                        <span style={{ fontSize: 22, fontWeight: 900, color: "#c9a84c" }}>{service.ourFee}</span>
                      </div>
                      {service.usptoFee && (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>USPTO fee</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>{service.usptoFee}</span>
                          </div>
                          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Total</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.6)" }}>{service.totalNote}</span>
                          </div>
                        </>
                      )}
                      {!service.usptoFee && (
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{service.totalNote}</div>
                      )}
                    </div>

                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 18 }}>{service.description}</p>

                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {service.features.filter(f => !f.includes("Our fee:")).map(f => (
                        <li key={f} style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#7ecba1" }}>✓</span> {f}
                        </li>
                      ))}
                    </ul>

                    <button onClick={() => handleCTA(service.ctaAction)} style={{
                      width: "100%", background: service.highlight ? "#c9a84c" : "rgba(255,255,255,0.08)",
                      color: service.highlight ? "#0a0a0a" : "#fff",
                      border: service.highlight ? "none" : "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 10, padding: "12px 20px", fontWeight: 800, fontSize: 14,
                      cursor: "pointer", fontFamily: "Poppins, sans-serif",
                    }}>
                      {service.cta} →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* FAQ */}
        <div style={{ maxWidth: 720, margin: "0 auto 100px", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
            <div style={{ width: 4, height: 24, background: "#c9a84c", borderRadius: 2 }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>FAQ</h2>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>

          {FAQS.map(({ q, a }, i) => (
            <div key={q} onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 20, marginBottom: 20, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>{q}</h3>
                <span style={{ color: "#c9a84c", fontSize: 20, fontWeight: 300, flexShrink: 0, marginLeft: 16 }}>{openFaq === i ? "−" : "+"}</span>
              </div>
              {openFaq === i && (
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: "12px 0 0" }}>{a}</p>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ maxWidth: 900, margin: "0 auto 80px", padding: "0 24px" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(126,203,161,0.1) 100%)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 20, padding: "56px 48px", textAlign: "center" }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 14, letterSpacing: -1 }}>Start with a free search</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 28 }}>No account required. See your conflicts in seconds.</p>
            <button onClick={() => router.push("/")} style={{ background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 12, padding: "14px 36px", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
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
