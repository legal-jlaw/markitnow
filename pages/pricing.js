import ChatWidget from "../components/ChatWidget";
import Nav from "../components/Nav";
import { useRouter } from "next/router";
import Head from "next/head";

export default function Pricing() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Trademark Pricing & Brand Protection Plans | MarkItNow.ai</title>
        <meta name="description" content="Transparent trademark pricing. Brand Protection Plans from $49/month. One-time filing services from free to $399. USPTO fees always shown separately." />
        <meta name="keywords" content="trademark filing cost, brand protection plan, USPTO filing fee 2025, trademark monitoring service, trademark attorney fee, trademark registration price" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; }
        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .services-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        @media (max-width: 900px) {
          .plans-grid { grid-template-columns: 1fr; }
          .services-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .page-hero { padding: 48px 20px !important; }
          .content-wrap { padding: 0 16px !important; }
          .footer { flex-direction: column !important; gap: 12px !important; padding: 24px 16px !important; text-align: center !important; }
          .footer-right { flex-direction: column !important; gap: 8px !important; align-items: center !important; }
          table { font-size: 12px !important; }
          table td, table th { padding: 10px 12px !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "Poppins, sans-serif" }}>
        <Nav />

        {/* Hero */}
        <div className="page-hero" style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "64px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 48px)", fontWeight: 900, color: "#111", lineHeight: 1.1, marginBottom: 14, letterSpacing: -1.5 }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: 16, color: "#777", maxWidth: 520, margin: "0 auto 24px" }}>
            Two ways to protect your brand. Ongoing protection plans, or one-time filing services. USPTO fees always shown separately.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#c9a84c" }} />
              <span style={{ color: "#b8860b", fontWeight: 600 }}>Our service fee</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ccc" }} />
              <span style={{ color: "#888", fontWeight: 600 }}>USPTO government fee (paid to USPTO)</span>
            </div>
          </div>
        </div>

        {/* Layer 1 — Brand Protection Plans */}
        <div className="content-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 0" }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
              <div style={{ width: 4, height: 24, background: "#c9a84c", borderRadius: 2 }} />
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: 0 }}>Brand Protection Plans</h2>
              <div style={{ background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700, color: "#b8860b", letterSpacing: 1 }}>RECURRING</div>
            </div>
            <p style={{ fontSize: 14, color: "#777", margin: "0 0 0 18px" }}>Ongoing monitoring, alerts, and attorney access. Cancel anytime.</p>
          </div>

          <div className="plans-grid" style={{ marginBottom: 20 }}>
            {[
              {
                name: "Monitor",
                price: "$49",
                period: "/month per mark",
                annual: "$399/year (save $189)",
                highlight: false,
                badge: null,
                signup_bonus: true,
                features: [
                  "24/7 USPTO conflict monitoring",
                  "Renewal & deadline alerts",
                  "Instant notification on similar filings",
                  "Monthly brand health report",
                  "Cancel anytime",
                ],
                cta: "Start Monitoring",
              },
              {
                name: "Protect",
                price: "$99",
                period: "/month per mark",
                annual: "$799/year (save $389)",
                highlight: true,
                badge: "Most Popular",
                signup_bonus: true,
                features: [
                  "Everything in Monitor",
                  "Quarterly AI conflict scans",
                  "One Office Action response included/year",
                  "Priority attorney email access",
                  "Competitor filing alerts",
                  "Cancel anytime",
                ],
                cta: "Start Protecting",
              },
              {
                name: "Shield",
                price: "$249",
                period: "/month per mark",
                annual: "$1,999/year (save $989)",
                highlight: false,
                badge: "Enterprise",
                signup_bonus: true,
                features: [
                  "Everything in Protect",
                  "Unlimited Office Action responses",
                  "C&D letter drafting when conflicts arise",
                  "Dedicated attorney on file",
                  "Portfolio-wide coverage",
                  "Priority 24hr attorney response",
                ],
                cta: "Get Full Shield",
              },
            ].map(plan => (
              <div key={plan.name} style={{
                background: plan.highlight ? "#fffdf5" : "#fff",
                border: plan.highlight ? "2px solid #c9a84c" : "1px solid #e8e8e8",
                borderRadius: 20,
                padding: "32px 28px",
                display: "flex",
                flexDirection: "column",
                boxShadow: plan.highlight ? "0 4px 24px rgba(201,168,76,0.12)" : "0 2px 8px rgba(0,0,0,0.04)",
                position: "relative",
              }}>
                {plan.badge && (
                  <div style={{ position: "absolute", top: -12, left: 28, background: plan.highlight ? "#c9a84c" : "#111", color: "#fff", fontSize: 10, fontWeight: 800, padding: "4px 12px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase" }}>{plan.badge}</div>
                )}
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#888", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 40, fontWeight: 900, color: "#111" }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: "#888" }}>{plan.period}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{plan.annual}</div>
                </div>

                {plan.signup_bonus && (
                  <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 10, padding: "10px 14px", margin: "16px 0", fontSize: 12, color: "#276749", fontWeight: 600 }}>
                    🎁 Free $99 AI Analysis Report on signup
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, marginBottom: 24 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#444" }}>
                      <span style={{ color: "#c9a84c", fontWeight: 900, fontSize: 15, lineHeight: 1.4, flexShrink: 0 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>

                <button onClick={() => router.push("/file")} style={{
                  background: plan.highlight ? "#c9a84c" : "#111",
                  color: plan.highlight ? "#111" : "#fff",
                  border: "none", borderRadius: 10, padding: "14px 0",
                  fontWeight: 800, fontSize: 14, cursor: "pointer",
                  fontFamily: "Poppins, sans-serif", width: "100%",
                }}>{plan.cta} →</button>
              </div>
            ))}
          </div>
        </div>

        {/* Layer 2 — One-Time Services */}
        <div className="content-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 0" }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
              <div style={{ width: 4, height: 24, background: "#111", borderRadius: 2 }} />
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: 0 }}>One-Time Filing Services</h2>
              <div style={{ background: "#f4f4f4", border: "1px solid #e0e0e0", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700, color: "#777", letterSpacing: 1 }}>A LA CARTE</div>
            </div>
            <p style={{ fontSize: 14, color: "#777", margin: "0 0 0 18px" }}>Pay once per service. No subscription required.</p>
          </div>

          {/* Search & Analysis */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12, paddingLeft: 4 }}>Search & Analysis</div>
            <div className="services-grid" style={{ marginBottom: 16 }}>
              {[
                { name: "USPTO Trademark Search", desc: "Live search of 4M+ active and dead marks. Results in seconds.", our: "Free", uspto: null },
                { name: "AI Analysis Report", desc: "DuPont factor breakdown, risk score, class-by-class conflict analysis.", our: "$99", uspto: null },
                { name: "Attorney Legal Memo", desc: "Full written legal opinion from a U.S. Licensed Attorney.", our: "$149", uspto: null },
              ].map(s => (
                <div key={s.name} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 14, padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 4 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ fontWeight: 900, fontSize: 18, color: "#c9a84c" }}>{s.our}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filing Services */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12, paddingLeft: 4 }}>Filing Services</div>
            <div className="services-grid" style={{ marginBottom: 16 }}>
              {[
                { name: "DIY Guided Filing", desc: "Step-by-step AI-guided TEAS application with class identification.", our: "$69", uspto: "$350/class" },
                { name: "Attorney-Filed Application", desc: "U.S. Licensed Attorney prepares and files your TEAS Plus application.", our: "$399", uspto: "$350/class" },
                { name: "Statement of Use", desc: "File after your Intent-to-Use mark goes live in commerce.", our: "$249", uspto: "$150/class" },
                { name: "Trademark Revival", desc: "Petition to revive an abandoned application. Time-sensitive.", our: "$349", uspto: "$150" },
              ].map(s => (
                <div key={s.name} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 14, padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 4 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ fontWeight: 900, fontSize: 16, color: "#c9a84c" }}>{s.our}</div>
                    {s.uspto && <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>+ {s.uspto} USPTO</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ongoing Protection */}
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12, paddingLeft: 4 }}>Ongoing Protection</div>
            <div className="services-grid">
              {[
                { name: "Office Action Response", desc: "Attorney-drafted response to USPTO refusals and rejections.", our: "$499+", uspto: null },
                { name: "Renewal Filing (Sec. 8 & 9)", desc: "Required between years 5-6 and every 10 years to keep your mark alive.", our: "$199", uspto: "$325/class" },
                { name: "Section 15 Incontestability", desc: "File after 5 years of continuous use to strengthen your rights.", our: "$149", uspto: "$250/class" },
                { name: "Portfolio Audit", desc: "Full review of all your marks, classes, deadlines, and risk exposure.", our: "$299", uspto: null },
              ].map(s => (
                <div key={s.name} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 14, padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 4 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ fontWeight: 900, fontSize: 16, color: "#c9a84c" }}>{s.our}</div>
                    {s.uspto && <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>+ {s.uspto} USPTO</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* USPTO fee note */}
        <div style={{ maxWidth: 1100, margin: "0 auto 64px", padding: "0 24px" }}>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 14, padding: "20px 28px", fontSize: 13, color: "#888", lineHeight: 1.7 }}>
            <strong style={{ color: "#555" }}>About USPTO fees:</strong> Government fees are paid directly to the U.S. Patent and Trademark Office and are separate from our service fee. The base TEAS application fee is $350/class (as of January 18, 2025). These fees are non-refundable regardless of outcome.
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: "#111", padding: "72px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, color: "#fff", marginBottom: 12, letterSpacing: -1 }}>
            Ready to protect your brand?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 32, fontSize: 15 }}>Start with a free search or get protected today.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/")} style={{ background: "#c9a84c", color: "#111", border: "none", borderRadius: 12, padding: "15px 36px", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              Start Protecting My Brand →
            </button>
            <button onClick={() => router.push("/faq")} style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "15px 36px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              Read the FAQ
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="footer" style={{ background: "#fff", borderTop: "1px solid #e0e0e0", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#111", flexShrink: 0 }}>MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span></div>
          <div className="footer-right" style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <span onClick={() => router.push("/faq")} style={{ fontSize: 13, color: "#aaa", cursor: "pointer", fontWeight: 500 }}>FAQ</span>
            <span style={{ fontSize: 12, color: "#bbb" }}>© 2026 MarkItNow.ai · Search and AI reports are informational only and do not constitute legal advice · Attorney filing services provided by licensed partner law firms</span>
          </div>
        </div>
      </div>
      <ChatWidget />
    </>
  );
}
