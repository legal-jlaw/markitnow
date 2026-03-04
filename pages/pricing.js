import ChatWidget from "../components/ChatWidget";
import Nav from "../components/Nav";
import { useRouter } from "next/router";
import Head from "next/head";

export default function Pricing() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Pricing — Brand Protection Plans & Filing Services | MarkItNow.ai</title>
        <meta name="description" content="Transparent trademark pricing. Brand Protection Plans from $49/month. One-time filing services from free to $399. USPTO fees always shown separately." />
        <meta name="keywords" content="trademark filing cost, brand protection plan, trademark monitoring price, USPTO filing fee 2025, trademark attorney fee" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; }
        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .services-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (max-width: 900px) {
          .plans-grid { grid-template-columns: 1fr; max-width: 480px; margin-left: auto; margin-right: auto; }
          .services-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .page-hero { padding: 48px 20px 40px !important; }
          .content-wrap { padding: 0 16px !important; }
          .plan-card { padding: 28px 20px !important; }
          .footer { flex-direction: column !important; gap: 10px !important; padding: 24px 16px !important; text-align: center !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "Poppins, sans-serif" }}>
        <Nav />

        {/* Hero */}
        <div className="page-hero" style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "64px 24px 48px", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, color: "#111", marginBottom: 12, letterSpacing: -1.5 }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: 16, color: "#777", maxWidth: 460, margin: "0 auto 28px", lineHeight: 1.7 }}>
            Two ways to protect your brand. Plans for ongoing protection. One-time services for when you need them.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#c9a84c", flexShrink: 0 }} />
              <span style={{ color: "#b8860b", fontWeight: 600 }}>Our fee</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#ccc", flexShrink: 0 }} />
              <span style={{ color: "#888", fontWeight: 600 }}>USPTO government fee (paid directly to USPTO)</span>
            </div>
          </div>
        </div>

        {/* Section 1 — Protection Plans */}
        <div className="content-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 0" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 24, background: "#c9a84c", borderRadius: 2, flexShrink: 0 }} />
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#111", margin: 0 }}>Brand Protection Plans</h2>
              <div style={{ background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 20, padding: "3px 12px", fontSize: 10, fontWeight: 700, color: "#b8860b", letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap" }}>RECURRING</div>
            </div>
            <p style={{ fontSize: 13, color: "#999", margin: "0 0 0 16px" }}>Ongoing monitoring, alerts, and attorney access. All plans include a free $99 AI Analysis Report on signup.</p>
          </div>

          <div className="plans-grid">
            {[
              {
                name: "Monitor",
                tagline: "Stay aware",
                price: "$49",
                period: "/month",
                annual: "$399/yr — save $189",
                highlight: false,
                badge: null,
                features: [
                  "24/7 AI conflict monitoring",
                  "Renewal & deadline alerts",
                  "Instant alerts when similar marks are filed",
                  "Monthly brand health summary",
                ],
                cta: "Start Monitoring",
              },
              {
                name: "Protect",
                tagline: "Stay defended",
                price: "$99",
                period: "/month",
                annual: "$799/yr — save $389",
                highlight: true,
                badge: "Most Popular",
                features: [
                  "Everything in Monitor",
                  "Quarterly attorney review of AI-flagged conflicts",
                  "Written attorney assessment each quarter",
                  "1 Office Action response/year included",
                  "Priority attorney email access",
                ],
                cta: "Start Protecting",
              },
              {
                name: "Shield",
                tagline: "Stay untouchable",
                price: "$249",
                period: "/month",
                annual: "$1,999/yr — save $989",
                highlight: false,
                badge: "Enterprise",
                features: [
                  "Everything in Protect",
                  "Unlimited attorney reviews — no waiting",
                  "C&D letter drafting when conflicts arise",
                  "Dedicated attorney on file",
                  "Portfolio-wide mark coverage",
                ],
                cta: "Get Full Shield",
              },
            ].map(plan => (
              <div key={plan.name} className="plan-card" style={{
                background: plan.highlight ? "#fffdf5" : "#fff",
                border: plan.highlight ? "2px solid #c9a84c" : "1px solid #e8e8e8",
                borderRadius: 18, padding: "32px 28px",
                display: "flex", flexDirection: "column",
                boxShadow: plan.highlight ? "0 8px 32px rgba(201,168,76,0.12)" : "0 2px 8px rgba(0,0,0,0.04)",
                position: "relative",
              }}>
                {plan.badge && (
                  <div style={{ position: "absolute", top: -12, left: 24, background: plan.highlight ? "#c9a84c" : "#111", color: plan.highlight ? "#111" : "#fff", fontSize: 10, fontWeight: 800, padding: "4px 12px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase" }}>{plan.badge}</div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>{plan.name}</div>
                  <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>{plan.tagline}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 3 }}>
                    <span style={{ fontSize: 40, fontWeight: 900, color: "#111", lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: "#aaa" }}>{plan.period} per mark</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#c9a84c", fontWeight: 600 }}>{plan.annual}</div>
                </div>

                <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 8, padding: "9px 12px", marginBottom: 20, fontSize: 12, color: "#276749", fontWeight: 600 }}>
                  🎁 Free $99 AI Report on signup
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, marginBottom: 24 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: "#444", lineHeight: 1.5 }}>
                      <span style={{ color: "#c9a84c", fontWeight: 900, fontSize: 14, flexShrink: 0, lineHeight: 1.5 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>

                <button onClick={() => router.push("/protect")} style={{
                  background: plan.highlight ? "#c9a84c" : "#111",
                  color: plan.highlight ? "#111" : "#fff",
                  border: "none", borderRadius: 10, padding: "13px 0",
                  fontWeight: 800, fontSize: 14, cursor: "pointer",
                  fontFamily: "Poppins, sans-serif", width: "100%",
                }}>{plan.cta} →</button>
                <div style={{ textAlign: "center", fontSize: 11, color: "#ccc", marginTop: 8 }}>Cancel anytime</div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ maxWidth: 1100, margin: "56px auto 0", padding: "0 24px" }}>
          <div style={{ borderTop: "1px solid #e0e0e0" }} />
        </div>

        {/* Section 2 — One-Time Services */}
        <div className="content-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 0" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 24, background: "#555", borderRadius: 2, flexShrink: 0 }} />
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#111", margin: 0 }}>One-Time Services</h2>
              <div style={{ background: "#f4f4f4", border: "1px solid #e0e0e0", borderRadius: 20, padding: "3px 12px", fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap" }}>A LA CARTE</div>
            </div>
            <p style={{ fontSize: 13, color: "#999", margin: "0 0 0 16px" }}>Pay once. No subscription required.</p>
          </div>

          {[
            {
              category: "Search & Analysis",
              items: [
                { name: "USPTO Trademark Search", desc: "Live search of 4M+ active and dead marks.", our: "Free", uspto: null, path: "/" },
                { name: "AI Analysis Report", desc: "DuPont breakdown, risk score, class-by-class conflicts. PDF delivered instantly.", our: "$99", uspto: null, path: "/file" },
                { name: "Attorney Legal Memo", desc: "Full written legal opinion from a U.S. Licensed Attorney.", our: "$149", uspto: null, path: "/file" },
              ],
            },
            {
              category: "Filing Services",
              items: [
                { name: "DIY Guided Filing", desc: "Step-by-step AI-guided TEAS application.", our: "$69", uspto: "$350/class", path: "/diy" },
                { name: "Attorney-Filed Application", desc: "U.S. Licensed Attorney prepares and files your TEAS Plus application.", our: "$399", uspto: "$350/class", path: "/file" },
                { name: "Statement of Use", desc: "File after your Intent-to-Use mark goes live in commerce.", our: "$249", uspto: "$150/class", path: "/file" },
                { name: "Trademark Revival", desc: "Petition to revive an abandoned application.", our: "$349", uspto: "$150", path: "/file" },
              ],
            },
            {
              category: "Maintenance & Protection",
              items: [
                { name: "Office Action Response", desc: "Attorney-drafted response to USPTO refusals.", our: "$499+", uspto: null, path: "/file" },
                { name: "Renewal Filing (Sec. 8 & 9)", desc: "Required between years 5-6 and every 10 years.", our: "$199", uspto: "$325/class", path: "/file" },
                { name: "Section 15 Incontestability", desc: "Strengthen your rights after 5 years of continuous use.", our: "$149", uspto: "$250/class", path: "/file" },
                { name: "Portfolio Audit", desc: "Full review of all marks, classes, deadlines, and risk.", our: "$299", uspto: null, path: "/file" },
              ],
            },
          ].map(group => (
            <div key={group.category} style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#bbb", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14, paddingLeft: 2 }}>{group.category}</div>
              <div className="services-grid">
                {group.items.map(s => (
                  <div key={s.name} onClick={() => router.push(s.path)} onMouseEnter={e => e.currentTarget.style.borderColor = "#c9a84c"} onMouseLeave={e => e.currentTarget.style.borderColor = "#e8e8e8"} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, cursor: "pointer" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 3 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "#999", lineHeight: 1.5 }}>{s.desc}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: 17, color: "#c9a84c" }}>{s.our}</div>
                      {s.uspto && <div style={{ fontSize: 11, color: "#ccc", marginTop: 2 }}>+ {s.uspto} USPTO</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* USPTO note */}
        <div style={{ maxWidth: 1100, margin: "8px auto 0", padding: "0 24px" }}>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "16px 22px", fontSize: 12, color: "#aaa", lineHeight: 1.7 }}>
            <strong style={{ color: "#888" }}>USPTO fees</strong> are paid directly to the U.S. Patent and Trademark Office, separate from our service fee. The TEAS application fee is $350/class (effective January 18, 2025). USPTO fees are non-refundable regardless of outcome.
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "64px 24px 80px" }}>
          <p style={{ fontSize: 14, color: "#aaa", marginBottom: 20 }}>Not sure where to start?</p>
          <button onClick={() => router.push("/")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 12, padding: "14px 36px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
            Start with a Free Search →
          </button>
        </div>

        {/* Footer */}
        <div style={{ background: "#fff", borderTop: "1px solid #e0e0e0", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#111" }}>MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span></div>
          <div style={{ fontSize: 12, color: "#bbb" }}>© 2026 MarkItNow.ai · Not legal advice · Legal services by licensed partner law firms</div>
        </div>
      </div>
      <ChatWidget />
    </>
  );
}
