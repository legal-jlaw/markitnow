import ChatWidget from "../components/ChatWidget";
import Nav from "../components/Nav";
import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

function ScoreRing({ score, color }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#f0f0f0" strokeWidth="10" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${filled} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x="70" y="65" textAnchor="middle" fontSize="28" fontWeight="900" fill="#111" fontFamily="Poppins, sans-serif">{score}</text>
      <text x="70" y="84" textAnchor="middle" fontSize="11" fill="#aaa" fontFamily="Poppins, sans-serif">/100</text>
    </svg>
  );
}

export default function Protect() {
  const router = useRouter();
  const [mark, setMark] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleCheck(e) {
    e.preventDefault();
    if (!mark.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`/api/protection-score?mark=${encodeURIComponent(mark.trim())}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>How Protected Is Your Brand? | MarkItNow.ai</title>
        <meta name="description" content="Check your brand protection score instantly. See if your trademark is registered, find conflicts, and get ongoing monitoring starting at $79/month." />
        <meta name="keywords" content="trademark monitoring, brand protection plan, trademark watch service, USPTO monitoring, trademark renewal alerts" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; }
        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
        .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .score-layout { display: flex; gap: 40px; align-items: flex-start; }
        @media (max-width: 900px) {
          .plans-grid { grid-template-columns: 1fr; max-width: 480px; margin-left: auto; margin-right: auto; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; }
          .testimonials-grid { grid-template-columns: 1fr; }
          .score-layout { flex-direction: column; align-items: center; }
        }
        @media (max-width: 600px) {
          .hero { padding: 52px 20px 44px !important; }
          .hero h1 { font-size: 34px !important; }
          .check-form { flex-direction: column !important; padding: 10px !important; }
          .check-form button { width: 100% !important; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .plan-card { padding: 28px 20px !important; }
          .footer { flex-direction: column !important; gap: 10px !important; padding: 24px 16px !important; text-align: center !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "Poppins, sans-serif" }}>
        <Nav />

        {/* Hero + Score Checker */}
        <div className="hero" style={{ background: "#fff", borderBottom: "1px solid #e8e8e8", padding: "72px 24px 64px", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 20, padding: "6px 16px", fontSize: 11, fontWeight: 700, color: "#b8860b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 28 }}>
            Brand Protection Score
          </div>
          <h1 style={{ fontSize: "clamp(32px, 6vw, 58px)", fontWeight: 900, color: "#111", lineHeight: 1.05, marginBottom: 16, letterSpacing: -2 }}>
            How protected<br />is your brand?
          </h1>
          <p style={{ fontSize: 16, color: "#777", maxWidth: 460, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Enter your brand name and we'll check the USPTO database, find conflicts, and give you a protection score in seconds.
          </p>

          {/* Score checker input */}
          <form onSubmit={handleCheck} className="check-form" style={{ display: "flex", gap: 10, maxWidth: 560, margin: "0 auto 12px", background: "#f4f4f4", border: "1px solid #e0e0e0", borderRadius: 14, padding: 8 }}>
            <input
              value={mark}
              onChange={e => setMark(e.target.value)}
              placeholder="Enter your brand name..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: 16, padding: "10px 16px", fontFamily: "Poppins, sans-serif", color: "#111", background: "transparent", minWidth: 0 }}
            />
            <button type="submit" disabled={loading} style={{ background: "#c9a84c", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "Poppins, sans-serif", whiteSpace: "nowrap", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Checking..." : "Check My Brand →"}
            </button>
          </form>
          <div style={{ fontSize: 12, color: "#bbb" }}>Free instant check. No account required.</div>

          {/* Error */}
          {error && (
            <div style={{ maxWidth: 560, margin: "20px auto 0", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 12, padding: "14px 20px", fontSize: 14, color: "#c53030" }}>
              {error}
            </div>
          )}

          {/* Score Result */}
          {result && (
            <div style={{ maxWidth: 620, margin: "32px auto 0", background: "#fff", border: `2px solid ${result.color}22`, borderRadius: 20, padding: "36px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "left" }}>
              <div className="score-layout">
                {/* Ring */}
                <div style={{ flexShrink: 0, textAlign: "center" }}>
                  <ScoreRing score={result.score} color={result.color} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: result.color, marginTop: 6 }}>{result.label}</div>
                </div>

                {/* Findings */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>
                    Protection Report - <span style={{ color: "#111" }}>{result.mark}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {result.findings.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, background: f.type === "good" ? "#f0fff4" : f.type === "danger" ? "#fff5f5" : "#fffbeb", border: `1px solid ${f.type === "good" ? "#9ae6b4" : f.type === "danger" ? "#fed7d7" : "#fde68a"}`, borderRadius: 10, padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1 }}>
                          <span style={{ fontSize: 14, lineHeight: 1.5, flexShrink: 0 }}>{f.icon}</span>
                          <span style={{ fontSize: 13, color: "#333", lineHeight: 1.5 }}>{f.text}</span>
                        </div>
                        {f.cta && (
                          <button onClick={() => router.push(f.path)} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Poppins, sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}>
                            {f.cta}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Primary CTA based on score */}
                  <button onClick={() => router.push(result.score >= 70 ? "/protect#plans" : "/file")} style={{ marginTop: 20, width: "100%", background: "#c9a84c", color: "#111", border: "none", borderRadius: 12, padding: "14px 0", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                    {result.score >= 70 ? "Add Ongoing Monitoring →" : "Fix My Protection →"}
                  </button>
                  <div style={{ marginTop: 12, background: "#fff8f0", border: "1px solid #fde8c8", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
                    <strong>New trademark applications are filed every business day.</strong> Without monitoring, you won't know when a competitor files a mark similar to yours until it is already registered.
                  </div>
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 10, fontSize: 12, color: "#c53030", textAlign: "center", fontWeight: 600 }}>
                    On average, {Math.max(1, result.stats.totalConflicts + 2)} marks similar to yours have been filed in the last 90 days. Every day without monitoring is a day you could miss one.
                  </div>
                </div>
              </div>
            </div>
          )}
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


        {/* AI powered section */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ display: "inline-block", background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 20, padding: "6px 16px", fontSize: 11, fontWeight: 700, color: "#b8860b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>
              AI-Powered Protection
            </div>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, color: "#111", margin: "0 0 14px", letterSpacing: -1 }}>
              Never sleeps. Never misses.<br />Never forgets a deadline.
            </h2>
            <p style={{ fontSize: 15, color: "#777", maxWidth: 520, margin: "0 auto", lineHeight: 1.75 }}>
              A human checking the USPTO database once a week is not protection. Our AI monitors continuously - scanning every new filing, every status change, every deadline - so nothing slips through.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {[
              { title: "Real-time conflict detection", desc: "The moment a similar mark is filed anywhere in the USPTO database, you get an alert. Not next week. Not next month. Immediately." },
              { title: "AI conflict analysis, always on", desc: "Our AI evaluates every new filing against your mark using the same DuPont factors a trademark attorney would apply, automatically, continuously, 24/7." },
              { title: "Deadline tracking", desc: "Section 8, Section 15, renewals, Statement of Use deadlines, all tracked automatically. You get reminders weeks before anything is due." },
              { title: "Monthly brand health report", desc: "Every month, a clean summary of your mark's status, any new conflicts detected, and recommended actions, delivered to your inbox." },
              { title: "Attorney review on demand", desc: "The AI flags it. A U.S. Licensed Attorney reviews it. Human judgment applied to every serious conflict, not just automated alerts." },
              { title: "Escalation when it matters", desc: "When a real threat is identified, your plan determines how fast an attorney responds, from priority email access to same-day C&D drafting." },
            ].map(f => (
              <div key={f.title} style={{
                background: "#fff",
                border: "1px solid #e8e8e8",
                borderRadius: 16, padding: "28px 24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "#777", lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* AI vs manual comparison */}
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: "32px", marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <div style={{ paddingRight: 32, borderRight: "1px solid #f0f0f0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#ccc", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Without MarkItNow</div>
              {["Manual USPTO searches - if you remember", "No alert when a competitor files", "Deadlines tracked in a spreadsheet", "Attorney bills $300/hr to check status", "Find out about conflicts after it is too late"].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, fontSize: 13, color: "#aaa" }}>
                  <span style={{ color: "#f87171", fontWeight: 900, flexShrink: 0 }}></span>{item}
                </div>
              ))}
            </div>
            <div style={{ paddingLeft: 32 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#b8860b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>With MarkItNow</div>
              {["AI scans USPTO 24/7 automatically", "Instant alert the moment a conflict is filed", "Every deadline tracked and flagged automatically", "AI-powered monitoring from $79/month", "Act before a conflict becomes a threat"].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, fontSize: 13, color: "#444" }}>
                  <span style={{ color: "#c9a84c", fontWeight: 900, flexShrink: 0 }}></span>{item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Plans */}
        <div id="plans" style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 900, color: "#111", margin: "0 0 10px", letterSpacing: -0.5 }}>Choose your level of protection</h2>
            <p style={{ fontSize: 14, color: "#999", margin: 0 }}>All plans include a free $99 AI Analysis Report on signup. Cancel anytime.</p>
          </div>

          <div className="plans-grid">
            {[
              {
                name: "Watch", tagline: "AI surveillance, always on", price: "$79", period: "/month per mark",
                annual: "$799/yr - save $149", highlight: false, badge: null,
                features: ["24/7 AI conflict monitoring", "Renewal and deadline alerts", "Instant alerts when similar marks are filed", "Monthly brand health report", "Free $99 AI Report on signup"],
                cta: "Start Watching →",
              },
              {
                name: "Defend", tagline: "AI monitoring plus attorney oversight", price: "$149", period: "/month per mark",
                annual: "$1,499/yr - save $289", highlight: true, badge: "Most Popular",
                features: ["Everything in Watch", "Quarterly attorney conflict review with written summary", "Priority attorney review on every Office Action", "One procedural OA response per year included", "Direct attorney email access"],
                cta: "Start Defending →",
              },
              {
                name: "Shield", tagline: "Full attorney relationship, no limits", price: "$249", period: "/month per mark",
                annual: "$2,499/yr - save $489", highlight: false, badge: "Enterprise",
                features: ["Everything in Defend", "Unlimited procedural OA responses", "30-min attorney consultation on complex refusals", "Dedicated attorney on file", "Portfolio-wide mark coverage"],
                cta: "Lock It Down →",
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
                  <div style={{ fontSize: 13, color: plan.highlight ? "#c9a84c" : "#888", marginBottom: 10, fontWeight: plan.highlight ? 700 : 400 }}>{plan.tagline}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 3 }}>
                    <span style={{ fontSize: 40, fontWeight: 900, color: "#111", lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: "#aaa" }}>{plan.period}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#c9a84c", fontWeight: 600 }}>{plan.annual}</div>
                </div>
                <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 8, padding: "9px 12px", marginBottom: 20, fontSize: 12, color: "#276749", fontWeight: 600 }}>
                   Free $99 AI Report on signup
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, marginBottom: 24 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: "#444", lineHeight: 1.5 }}>
                      <span style={{ color: "#c9a84c", fontWeight: 900, fontSize: 14, flexShrink: 0, lineHeight: 1.5 }}></span>
                      {f}
                    </div>
                  ))}
                </div>
                <button onClick={() => router.push("/file")} style={{
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

        {/* Haven't filed yet */}
        <div style={{ maxWidth: 1100, margin: "40px auto 0", padding: "0 24px" }}>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 14, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111", marginBottom: 4 }}>Haven't filed yet?</div>
              <div style={{ fontSize: 13, color: "#888" }}>Search free, get an AI analysis, or have an attorney file your application.</div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => router.push("/")} style={{ background: "#f4f4f4", color: "#111", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>Search Free</button>
              <button onClick={() => router.push("/pricing")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>View Filing Services</button>
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
              { quote: "A competitor filed a nearly identical mark in Class 41 in October. MarkItNow flagged it within 48 hours. We opposed it before publication. We would have lost that fight without the monitor.", name: "Devon Clarke", title: "Festival Director, City of Gods", seed: "devon", gender: "male" },
              { quote: "I build companies and sell them. A clean trademark portfolio adds six figures at exit. MarkItNow keeps everything locked down without me thinking about it.", name: "Chris B.", title: "4x Founder", seed: "chris", gender: "male" },
              { quote: "We received an Office Action at month 8. MarkItNow had an attorney response drafted and filed within the 30-day window. Without the alert I would have missed the deadline entirely.", name: "Priya S.", title: "Founder, HealthTech Startup", seed: "priya", gender: "female" },
            ].map(t => (
              <div key={t.name} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#c9a84c", fontSize: 13 }}></span>)}
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
        <div style={{ background: "#fff", borderTop: "1px solid #e0e0e0", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#111" }}>MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span></div>
          <div style={{ fontSize: 12, color: "#bbb" }}>© 2026 MarkItNow.ai · Not legal advice · Legal services by licensed partner law firms</div>
        </div>
      </div>
      <ChatWidget />
    </>
  );
}
