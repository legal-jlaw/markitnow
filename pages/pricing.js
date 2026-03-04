import ChatWidget from "../components/ChatWidget";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

const SERVICES = [
  {
    category: "Search & Analysis",
    items: [
      { name: "Trademark Search", ourFee: "Free", usptoFee: null, totalNote: "Always free", description: "Search the live USPTO database of 4M+ marks instantly.", features: ["Live USPTO database", "Active & dead marks", "No account required", "Results in seconds"], cta: "Search Free", ctaAction: "search", highlight: false, badge: null },
      { name: "AI Analysis Report", ourFee: "$99", usptoFee: null, totalNote: "No USPTO fee", description: "Full AI-powered conflict analysis with risk scoring and DuPont factor breakdown.", features: ["Likelihood of confusion analysis", "Risk score (0–100)", "Class-by-class breakdown", "Filing strategy recommendations"], cta: "Get Report", ctaAction: "search", highlight: true, badge: "Most Popular" },
      { name: "Attorney Memo", ourFee: "$149", usptoFee: null, totalNote: "No USPTO fee", description: "Formal attorney-reviewed memo covering all 13 DuPont factors.", features: ["All 13 DuPont factors analyzed", "Attorney-signed memo", "Risk matrix", "Prosecution strategy"], cta: "Get Memo", ctaAction: "search", highlight: false, badge: null },
    ],
  },
  {
    category: "Filing Services",
    items: [
      { name: "Attorney-Filed Application", ourFee: "$399", usptoFee: "$350/class", totalNote: "Total: $749+ per class", description: "Full trademark application filed by a U.S.-U.S. Licensed Attorney.", features: ["U.S. Licensed Attorney files", "Specimen review included", "Class strategy consultation", "USPTO fee: $350/class"], cta: "Start Filing", ctaAction: "file", highlight: true, badge: "$100 less than Trademarkia" },
      { name: "DIY Guided Filing", ourFee: "$69", usptoFee: "$350/class", totalNote: "Total: $419+ per class", description: "AI walks you through every step. You file directly on USPTO.gov.", features: ["Step-by-step wizard", "AI class recommendations", "USPTO-compliant description", "Direct USPTO.gov instructions"], cta: "Start DIY", ctaAction: "diy", highlight: false, badge: null },
      { name: "Statement of Use", ourFee: "$249", usptoFee: "$150/class", totalNote: "Total: $399+ per class", description: "Filed when your intent-to-use application is approved.", features: ["Specimen preparation review", "Attorney-filed SOU", "Use in commerce guidance", "USPTO fee: $150/class"], cta: "File SOU", ctaAction: "contact", highlight: false, badge: null },
      { name: "Trademark Revival", ourFee: "$349", usptoFee: "Varies", totalNote: "USPTO fee varies", description: "Revive an abandoned trademark application. Time-sensitive.", features: ["Petition to revive drafted", "Attorney-filed", "Urgency analysis", "USPTO fees extra"], cta: "Revive Now", ctaAction: "contact", highlight: false, badge: "Time Sensitive" },
    ],
  },
  {
    category: "Ongoing Protection",
    items: [
      { name: "Portfolio Monitor", ourFee: "$49/yr", usptoFee: null, totalNote: "Per mark, no USPTO fee", description: "Weekly USPTO status checks with deadline alerts and notifications.", features: ["Weekly USPTO checks", "Deadline alerts", "Office action notifications", "Client dashboard"], cta: "Start Monitoring", ctaAction: "contact", highlight: false, badge: "Coming Soon" },
      { name: "Renewal Filing", ourFee: "$199", usptoFee: "$325/class", totalNote: "Total: $524+ per class", description: "Section 8 & 15 declarations and Section 9 renewals filed by attorney.", features: ["Section 8 & 15 declarations", "Section 9 renewals", "Attorney-filed", "USPTO fee: $325/class"], cta: "File Renewal", ctaAction: "contact", highlight: false, badge: null },
      { name: "Office Action Response", ourFee: "$499+", usptoFee: null, totalNote: "Quoted per case", description: "Attorney-drafted response to USPTO office actions.", features: ["Attorney OA analysis", "Full response drafted", "DuPont arguments", "Quoted by complexity"], cta: "Get Quote", ctaAction: "contact", highlight: false, badge: "Attorney Required" },
    ],
  },
];


export default function Pricing() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState(null);
  
  function handleCTA(action) {
    if (action === "search") router.push("/");
    else if (action === "file") router.push("/file");
    else if (action === "diy") router.push("/diy");
    else window.location.href = "mailto:legal@jarralslaw.com?subject=MarkItNow Inquiry";
  }

  return (
    <>
      <Head>
        <title>Pricing — MarkItNow.ai</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "Poppins, sans-serif" }}>

        {/* Nav */}
        <nav style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", height: 64 }}>
          <div onClick={() => router.push("/")} style={{ fontWeight: 900, fontSize: 22, color: "#111", letterSpacing: -0.5, cursor: "pointer" }}>
            MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span>
          </div>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {["How It Works", "Pricing", "FAQ"].map(item => (
              <span key={item} style={{ color: item === "Pricing" ? "#c9a84c" : "#555", fontSize: 14, fontWeight: item === "Pricing" ? 700 : 500, cursor: "pointer" }}>{item}</span>
            ))}
            <button onClick={() => router.push("/file")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>File Now</button>
          </div>
        </nav>

        {/* Hero */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "64px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "#111", lineHeight: 1.1, marginBottom: 14, letterSpacing: -1.5 }}>
            Simple, transparent pricing.
          </h1>
          <p style={{ fontSize: 17, color: "#777", maxWidth: 480, margin: "0 auto" }}>
            Our service fee plus USPTO government fees — always shown separately.
          </p>
          {/* Fee legend */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 8, padding: "7px 14px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#c9a84c" }} />
              <span style={{ fontSize: 13, color: "#b8860b", fontWeight: 600 }}>Our service fee</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f4f4f4", border: "1px solid #e0e0e0", borderRadius: 8, padding: "7px 14px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#aaa" }} />
              <span style={{ fontSize: 13, color: "#777", fontWeight: 600 }}>USPTO government fee (paid to USPTO)</span>
            </div>
          </div>
        </div>

        {/* Services */}
        {SERVICES.map(category => (
          <div key={category.category} style={{ maxWidth: 1200, margin: "0 auto 56px", padding: "48px 24px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <div style={{ width: 4, height: 22, background: "#c9a84c", borderRadius: 2 }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>{category.category}</h2>
              <div style={{ flex: 1, height: 1, background: "#e8e8e8" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {category.items.map((service, idx) => {
                const cardKey = `${category.category}-${idx}`;
                const isHovered = hoveredCard === cardKey;
                return (
                  <div key={service.name} onMouseEnter={() => setHoveredCard(cardKey)} onMouseLeave={() => setHoveredCard(null)}
                    style={{ background: "#fff", border: `1px solid ${service.highlight ? "#c9a84c" : "#e8e8e8"}`, borderRadius: 14, padding: 24, position: "relative", transition: "box-shadow 0.2s, transform 0.2s", boxShadow: isHovered ? "0 8px 32px rgba(0,0,0,0.1)" : "0 2px 8px rgba(0,0,0,0.04)", transform: isHovered ? "translateY(-2px)" : "none" }}>
                    {service.badge && (
                      <div style={{ position: "absolute", top: -11, right: 16, background: service.badge === "Coming Soon" ? "#f4f4f4" : service.badge === "Time Sensitive" ? "#fef2f2" : service.badge === "Attorney Required" ? "#f0f4ff" : "#111", border: service.badge === "Coming Soon" ? "1px solid #e0e0e0" : "none", color: service.badge === "Coming Soon" ? "#999" : service.badge === "Time Sensitive" ? "#dc2626" : service.badge === "Attorney Required" ? "#3b5bdb" : "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: 0.5, textTransform: "uppercase" }}>{service.badge}</div>
                    )}
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111", margin: "0 0 14px" }}>{service.name}</h3>

                    {/* Fee Box */}
                    <div style={{ background: "#f9f9f9", border: "1px solid #efefef", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: service.usptoFee ? 6 : 0 }}>
                        <span style={{ fontSize: 12, color: "#999" }}>Our fee</span>
                        <span style={{ fontSize: 22, fontWeight: 900, color: "#c9a84c" }}>{service.ourFee}</span>
                      </div>
                      {service.usptoFee && (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 12, color: "#999" }}>USPTO fee</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "#aaa" }}>{service.usptoFee}</span>
                          </div>
                          <div style={{ borderTop: "1px solid #e8e8e8", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 11, color: "#bbb", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Total</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "#555" }}>{service.totalNote}</span>
                          </div>
                        </>
                      )}
                      {!service.usptoFee && <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>{service.totalNote}</div>}
                    </div>

                    <p style={{ fontSize: 13, color: "#777", lineHeight: 1.6, marginBottom: 14 }}>{service.description}</p>

                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 18px", display: "flex", flexDirection: "column", gap: 6 }}>
                      {service.features.filter(f => !f.includes("USPTO fee:")).map(f => (
                        <li key={f} style={{ fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ color: "#c9a84c", fontWeight: 800 }}>✓</span> {f}
                        </li>
                      ))}
                    </ul>

                    <button onClick={() => handleCTA(service.ctaAction)} style={{ width: "100%", background: service.highlight ? "#111" : "#f4f4f4", color: service.highlight ? "#fff" : "#111", border: service.highlight ? "none" : "1px solid #e0e0e0", borderRadius: 8, padding: "11px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                      {service.cta} →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* CTA Banner */}
        <div style={{ background: "#111", padding: "64px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 12, letterSpacing: -1 }}>Start with a free search</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 28 }}>No account required. See your conflicts in seconds.</p>
          <button onClick={() => router.push("/")} style={{ background: "#c9a84c", color: "#111", border: "none", borderRadius: 10, padding: "14px 36px", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
            Search Free →
          </button>
        </div>

        {/* Footer */}
        <div style={{ background: "#fff", borderTop: "1px solid #e0e0e0", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#111" }}>MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span></div>
          <div style={{ fontSize: 13, color: "#aaa" }}>© 2026 MarkItNow.ai · Search and AI reports are informational only and do not constitute legal advice · Attorney filing services provided by licensed partner law firms</div>
        </div>
      </div>
      <ChatWidget />
    </>
  );
}