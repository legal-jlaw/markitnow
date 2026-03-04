import ChatWidget from "../components/ChatWidget";
import Nav from "../components/Nav";
import { useRouter } from "next/router";
import Head from "next/head";

export default function Protect() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Brand Protection Plans — Monitor, Protect & Shield | MarkItNow.ai</title>
        <meta name="description" content="How protected is your brand? Ongoing trademark monitoring, deadline alerts, and attorney access starting at $49/month. Free AI Analysis Report on signup." />
        <meta name="keywords" content="trademark monitoring, brand protection plan, trademark watch service, USPTO monitoring, trademark renewal alerts, trademark deadline tracking" />
        <meta property="og:title" content="Brand Protection Plans | MarkItNow.ai" />
        <meta property="og:description" content="24/7 USPTO monitoring, renewal alerts, and attorney access. Starting at $49/month. Free AI Report on signup." />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; }
        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
        .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 900px) {
          .plans-grid { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; }
          .testimonials-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .hero { padding: 52px 20px 44px !important; }
          .hero h1 { font-size: 34px !important; letter-spacing: -1px !important; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .footer { flex-direction: column !important; gap: 12px !important; padding: 24px 16px !important; text-align: center !important; }
          .plan-card { padding: 28px 20px !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "Poppins, sans-serif" }}>
        <Nav />

        {/* Hero */}
        <div className="hero" style={{ background: "#fff", borderBottom: "1px solid #e8e8e8", textAlign: "center", padding: "80px 24px 64px" }}>
          <div style={{ display: "inline-block", background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 20, padding: "6px 16px", fontSize: 11, fontWeight: 700, color: "#b8860b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 28 }}>
            Ongoing Brand Protection
          </div>
          <h1 style={{ fontSize: "clamp(34px, 6vw, 60px)", fontWeight: 900, color: "#111", lineHeight: 1.05, marginBottom: 18, letterSpacing: -2 }}>
            How protected<br />is your brand?
          </h1>
          <p style={{ fontSize: 17, color: "#666", maxWidth: 520, margin: "0 auto 16px", lineHeight: 1.75 }}>
            Most businesses file a trademark and think they're done. They're not. Conflicts arise, deadlines pass, competitors copy. Your brand needs someone watching.
          </p>
          <p style={{ fontSize: 14, color: "#c9a84c", fontWeight: 700, margin: 0 }}>We watch it 24/7, so you don't have to.</p>
        </div>

        {/* Why protection matters */}
        <div style={{ background: "#111", padding: "64px 24px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 900, color: "#fff", margin: "0 0 10px", letterSpacing: -0.5 }}>Filing is the beginning, not the end</h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0 }}>Every year, thousands of registered trademarks get challenged, copied, or cancelled.</p>
            </div>
            <div className="stats-grid">
              {[
                { stat: "70%", label: "of applications get an Office Action", sub: "Most filers don't know how to respond" },
                { stat: "30 days", label: "to oppose after publication", sub: "Competitors watch the Official Gazette" },
                { stat: "Year 5-6", label: "Section 8 filing required", sub: "Miss it and your mark is cancelled" },
                { stat: "$0", label: "refund if your application fails", sub: "USPTO keeps the fee regardless" },
              ].map(s => (
                <div key={s.stat} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 900, color: "#c9a84c", marginBottom: 8 }}>{s.stat}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 6, lineHeight: 1.4 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Plans */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 900, color: "#111", margin: "0 0 10px", letterSpacing: -0.5 }}>Choose your level of protection</h2>
            <p style={{ fontSize: 14, color: "#999", margin: 0 }}>All plans include a free $99 AI Analysis Report on signup. Cancel anytime.</p>
          </div>

          <div className="plans-grid">
            {[
              {
                name: "Monitor",
                tagline: "Stay aware",
                price: "$49",
                period: "/month per mark",
                annual: "$399/yr — save $189",
                highlight: false,
                badge: null,
                features: [
                  "24/7 USPTO conflict monitoring",
                  "Renewal & deadline alerts",
                  "Instant alerts on similar filings",
                  "Monthly brand health summary",
                  "Free $99 AI Report on signup",
                ],
                cta: "Start Monitoring",
                ctaStyle: { background: "#111", color: "#fff" },
              },
              {
                name: "Protect",
                tagline: "Stay defended",
                price: "$99",
                period: "/month per mark",
                annual: "$799/yr — save $389",
                highlight: true,
                badge: "Most Popular",
                features: [
                  "Everything in Monitor",
                  "Quarterly AI conflict scans",
                  "1 Office Action response/year included",
                  "Priority attorney email access",
                  "Competitor filing alerts",
                  "Free $99 AI Report on signup",
                ],
                cta: "Start Protecting",
                ctaStyle: { background: "#c9a84c", color: "#111" },
              },
              {
                name: "Shield",
                tagline: "Stay untouchable",
                price: "$249",
                period: "/month per mark",
                annual: "$1,999/yr — save $989",
                highlight: false,
                badge: "Enterprise",
                features: [
                  "Everything in Protect",
                  "Unlimited Office Action responses",
                  "C&D letter drafting on conflicts",
                  "Dedicated attorney on file",
                  "Portfolio-wide coverage",
                  "24hr priority attorney response",
                ],
                cta: "Get Full Shield",
                ctaStyle: { background: "#111", color: "#fff" },
              },
            ].map(plan => (
              <div key={plan.name} className="plan-card" style={{
                background: plan.highlight ? "#fffdf5" : "#fff",
                border: plan.highlight ? "2px solid #c9a84c" : "1px solid #e8e8e8",
                borderRadius: 20, padding: "36px 30px",
                display: "flex", flexDirection: "column",
                boxShadow: plan.highlight ? "0 8px 32px rgba(201,168,76,0.13)" : "0 2px 8px rgba(0,0,0,0.04)",
                position: "relative",
              }}>
                {plan.badge && (
                  <div style={{ position: "absolute", top: -13, left: 28, background: plan.highlight ? "#c9a84c" : "#111", color: plan.highlight ? "#111" : "#fff", fontSize: 10, fontWeight: 800, padding: "4px 14px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase" }}>{plan.badge}</div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#888", marginBottom: 12 }}>{plan.tagline}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 44, fontWeight: 900, color: "#111", lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: "#aaa" }}>{plan.period}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#c9a84c", fontWeight: 600 }}>{plan.annual}</div>
                </div>

                <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 10, padding: "10px 14px", marginBottom: 24, fontSize: 12, color: "#276749", fontWeight: 600 }}>
                  🎁 Free $99 AI Analysis Report on signup
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 11, flex: 1, marginBottom: 28 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#444", lineHeight: 1.5 }}>
                      <span style={{ color: "#c9a84c", fontWeight: 900, fontSize: 15, flexShrink: 0, lineHeight: 1.4 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>

                <button onClick={() => router.push("/file")} style={{ ...plan.ctaStyle, border: "none", borderRadius: 12, padding: "15px 0", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif", width: "100%" }}>
                  {plan.cta} →
                </button>
                <div style={{ textAlign: "center", fontSize: 11, color: "#bbb", marginTop: 10 }}>No long-term contract. Cancel anytime.</div>
              </div>
            ))}
          </div>
        </div>

        {/* Already need to file? */}
        <div style={{ maxWidth: 1100, margin: "48px auto 0", padding: "0 24px" }}>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: "28px 36px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#111", marginBottom: 4 }}>Haven't filed yet?</div>
              <div style={{ fontSize: 13, color: "#888" }}>Search free, get an AI analysis, or have an attorney file your application.</div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => router.push("/")} style={{ background: "#f4f4f4", color: "#111", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>Search Free</button>
              <button onClick={() => router.push("/pricing")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>View Filing Services</button>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px 80px" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 900, color: "#111", margin: "0 0 8px", letterSpacing: -0.5 }}>Brands that stopped worrying</h2>
            <p style={{ fontSize: 14, color: "#999", margin: 0 }}>Real people, real protection.</p>
          </div>
          <div className="testimonials-grid">
            {[
              { quote: "We run three festivals a year. MarkItNow monitors all our marks and files our renewals automatically. One less thing to think about.", name: "Devon Clarke", title: "Festival Director, City of Gods", seed: "devon", gender: "male" },
              { quote: "I build companies and sell them. A registered trademark adds real value at exit. MarkItNow is the fastest way I've found to keep everything locked down.", name: "Chris B.", title: "4x Founder", seed: "chris", gender: "male" },
              { quote: "Got an alert that a competitor filed a similar mark in our class. We were able to oppose it before it published. Never would have caught it without the monitor.", name: "Priya S.", title: "Founder, HealthTech Startup", seed: "priya", gender: "female" },
            ].map(t => (
              <div key={t.name} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#c9a84c", fontSize: 13 }}>★</span>)}
                </div>
                <p style={{ fontSize: 13, color: "#555", lineHeight: 1.8, margin: "0 0 18px", fontStyle: "italic" }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src={`https://randomuser.me/api/portraits/${t.gender === "female" ? "women" : "men"}/${Math.abs(t.seed.charCodeAt(0) + t.seed.charCodeAt(1)) % 70 + 1}.jpg`} alt={t.name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid #f0d080" }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#111" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="footer" style={{ background: "#fff", borderTop: "1px solid #e0e0e0", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#111", flexShrink: 0 }}>MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span></div>
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <span onClick={() => router.push("/")} style={{ fontSize: 13, color: "#aaa", cursor: "pointer", fontWeight: 500 }}>Search Free</span>
            <span onClick={() => router.push("/pricing")} style={{ fontSize: 13, color: "#aaa", cursor: "pointer", fontWeight: 500 }}>Pricing</span>
            <span onClick={() => router.push("/faq")} style={{ fontSize: 13, color: "#aaa", cursor: "pointer", fontWeight: 500 }}>FAQ</span>
            <span style={{ fontSize: 12, color: "#ddd" }}>|</span>
            <span style={{ fontSize: 12, color: "#bbb" }}>© 2026 MarkItNow.ai · Not legal advice · Attorney services by licensed partner law firms</span>
          </div>
        </div>
      </div>
      <ChatWidget />
    </>
  );
}
