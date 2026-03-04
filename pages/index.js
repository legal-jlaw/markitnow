import ChatWidget from "../components/ChatWidget";
import Nav from "../components/Nav";
import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function Home() {
  const router = useRouter();
  const [mark, setMark] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!mark.trim()) return;
    setLoading(true);
    router.push(`/search?mark=${encodeURIComponent(mark.trim())}`);
  }

  return (
    <>
      <Head>
        <title>MarkItNow.ai — Brand Protection Plans & Trademark Filing</title>
        <meta name="description" content="How protected is your brand? Search 4M+ USPTO marks free, file with a licensed attorney, or get ongoing brand protection starting at $49/month." />
        <meta name="keywords" content="brand protection, trademark monitoring, trademark registration, USPTO trademark search, trademark attorney, trademark filing, brand monitoring service" />
        <meta property="og:title" content="MarkItNow.ai — How Protected Is Your Brand?" />
        <meta property="og:description" content="Search free. File with an attorney. Protect your brand ongoing. Two paths, one platform." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MarkItNow.ai" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="MarkItNow.ai — Brand Protection Plans & Trademark Filing" />
        <meta name="twitter:description" content="How protected is your brand? Two paths: file it or protect it." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; }
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 1100px; margin: 0 auto; padding: 0 24px; }
        .path-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 20px; padding: 40px; box-shadow: 0 2px 16px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
        .path-card.gold { border: 2px solid #c9a84c; background: #fffdf5; }
        .divider { display: flex; align-items: center; justify-content: center; }
        .divider-line { width: 1px; height: 100%; background: #e8e8e8; }
        .social-proof { display: flex; align-items: center; gap: 8px; }
        .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .services-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr; }
          .testimonials-grid { grid-template-columns: 1fr; }
          .services-grid { grid-template-columns: repeat(2, 1fr); }
          .divider { display: none; }
        }
        @media (max-width: 600px) {
          .services-grid { grid-template-columns: 1fr; }
          .path-card { padding: 28px 20px; }
          .hero-section { padding: 40px 16px 0 !important; }
          .footer { flex-direction: column !important; gap: 12px !important; padding: 24px 16px !important; text-align: center !important; }
          .footer-right { flex-direction: column !important; gap: 8px !important; align-items: center !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "Poppins, sans-serif" }}>
        <Nav />

        {/* Hero headline */}
        <div className="hero-section" style={{ textAlign: "center", padding: "72px 24px 48px", maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 20, padding: "6px 16px", fontSize: 11, fontWeight: 700, color: "#b8860b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 28 }}>
            4M+ USPTO Marks Monitored
          </div>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 62px)", fontWeight: 900, color: "#111", lineHeight: 1.05, marginBottom: 20, letterSpacing: -2 }}>
            How protected<br />is your brand?
          </h1>
          <p style={{ fontSize: 17, color: "#666", lineHeight: 1.7, margin: 0 }}>
            Most businesses file a trademark and think they're done.<br />
            They're not. Your brand needs ongoing protection.
          </p>
        </div>

        {/* Two paths */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
          <div className="hero-grid">

            {/* Path 1 — Protect It */}
            <div className="path-card gold">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ background: "#c9a84c", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase" }}>Most Popular</div>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: "#111", margin: "0 0 8px", letterSpacing: -0.5 }}>Protect It</h2>
              <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, margin: "0 0 28px" }}>
                Ongoing brand protection. We monitor the USPTO 24/7, track your deadlines, and alert you the moment a conflict arises.
              </p>

              <div style={{ background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 14, padding: "20px 24px", marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#b8860b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Monitor Plan</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 38, fontWeight: 900, color: "#111" }}>$49</span>
                  <span style={{ fontSize: 14, color: "#888" }}>/month per mark</span>
                </div>
                <div style={{ fontSize: 13, color: "#b8860b", fontWeight: 600 }}>Includes free $99 AI Analysis Report on signup</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32, flex: 1 }}>
                {[
                  "24/7 USPTO conflict monitoring",
                  "Renewal & deadline alerts",
                  "Instant notification on similar filings",
                  "$99 AI Analysis Report — free on signup",
                  "Monthly brand health summary",
                  "Cancel anytime",
                ].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#444" }}>
                    <span style={{ color: "#c9a84c", fontWeight: 900, fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>

              <button onClick={() => router.push("/pricing")} style={{ background: "#c9a84c", color: "#111", border: "none", borderRadius: 12, padding: "16px 0", fontWeight: 900, fontSize: 16, cursor: "pointer", fontFamily: "Poppins, sans-serif", width: "100%" }}>
                Start Protecting My Brand →
              </button>
              <div style={{ textAlign: "center", fontSize: 12, color: "#aaa", marginTop: 10 }}>No long-term contract. Cancel anytime.</div>
            </div>

            {/* Path 2 — File It */}
            <div className="path-card">
              <h2 style={{ fontSize: 26, fontWeight: 900, color: "#111", margin: "0 0 8px", letterSpacing: -0.5 }}>File It</h2>
              <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, margin: "0 0 28px" }}>
                Search the USPTO database free, get an AI conflict analysis, or have a U.S. Licensed Attorney file your application.
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, background: "#f4f4f4", border: "1px solid #e0e0e0", borderRadius: 12, padding: 6, marginBottom: 24 }}>
                <input
                  value={mark}
                  onChange={e => setMark(e.target.value)}
                  placeholder="Search your trademark..."
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 14, padding: "10px 12px", fontFamily: "Poppins, sans-serif", color: "#111", background: "transparent", minWidth: 0 }}
                />
                <button type="submit" disabled={loading} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Poppins, sans-serif", whiteSpace: "nowrap" }}>
                  {loading ? "..." : "Search Free"}
                </button>
              </form>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32, flex: 1 }}>
                {[
                  { label: "Free USPTO Search", desc: "Live database of 4M+ marks. Instant results.", price: "Free", action: () => router.push("/") },
                  { label: "AI Analysis Report", desc: "DuPont factor breakdown, risk score, class conflicts.", price: "$99", action: () => router.push("/file") },
                  { label: "Attorney Memo", desc: "Full legal opinion from a licensed attorney.", price: "$149", action: () => router.push("/file") },
                  { label: "Attorney Filing", desc: "We file your TEAS application start to finish.", price: "$399", action: () => router.push("/file") },
                ].map(s => (
                  <div key={s.label} onClick={s.action} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#c9a84c"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#f0f0f0"}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{s.label}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{s.desc}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#c9a84c", flexShrink: 0, marginLeft: 12 }}>{s.price}</div>
                  </div>
                ))}
              </div>

              <button onClick={() => router.push("/pricing")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 12, padding: "16px 0", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif", width: "100%" }}>
                View All Services & Pricing →
              </button>
              <div style={{ textAlign: "center", fontSize: 12, color: "#aaa", marginTop: 10 }}>No account required to search.</div>
            </div>

          </div>
        </div>

        {/* Why protection matters */}
        <div style={{ background: "#111", padding: "72px 24px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 900, color: "#fff", marginBottom: 16, letterSpacing: -1 }}>
              Filing is the beginning, not the end
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", maxWidth: 600, margin: "0 auto 56px", lineHeight: 1.8 }}>
              Every year, thousands of registered trademarks get challenged, copied, or cancelled — because their owners stopped paying attention.
            </p>
            <div className="services-grid">
              {[
                { stat: "70%", label: "of applications get an Office Action", sub: "Most filers don't know how to respond" },
                { stat: "30 days", label: "to oppose after publication", sub: "Competitors watch the Official Gazette" },
                { stat: "Year 5-6", label: "Section 8 filing required", sub: "Miss it and your registration is cancelled" },
                { stat: "$0", label: "refund if your application fails", sub: "USPTO keeps the fee regardless" },
              ].map(s => (
                <div key={s.stat} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "#c9a84c", marginBottom: 8 }}>{s.stat}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 6, lineHeight: 1.4 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 900, color: "#111", margin: "0 0 10px", letterSpacing: -0.5 }}>Founders, artists & brands trust MarkItNow</h2>
            <p style={{ fontSize: 14, color: "#999", margin: 0 }}>Real people protecting real brands.</p>
          </div>
          <div className="testimonials-grid">
            {[
              { quote: "Our lead investor flagged trademark risk in due diligence. MarkItNow had a full conflict analysis in my inbox within minutes. We closed the round with our IP locked down.", name: "Marcus T.", title: "Co-Founder, Series A SaaS", seed: "marcus", gender: "male" },
              { quote: "I've been building my artist name for three years. Didn't realize someone had a similar mark until MarkItNow flagged it. Saved me from a serious rebrand.", name: "DJ Korvell", title: "Electronic Music Producer", seed: "korvell", gender: "male" },
              { quote: "We run three festivals a year. MarkItNow monitors all our marks and files our renewals automatically. One less thing to think about.", name: "Devon Clarke", title: "Festival Director, City of Gods", seed: "devon", gender: "male" },
            ].map(t => (
              <div key={t.name} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#c9a84c", fontSize: 13 }}>★</span>)}
                </div>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8, margin: "0 0 20px", fontStyle: "italic" }}>"{t.quote}"</p>
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

        {/* Bottom CTA */}
        <div style={{ background: "#fff", borderTop: "1px solid #e8e8e8", padding: "72px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 900, color: "#111", marginBottom: 12, letterSpacing: -1 }}>
            Your brand is unprotected right now.
          </h2>
          <p style={{ fontSize: 16, color: "#888", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>Start with a free search or get protected today.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/pricing")} style={{ background: "#c9a84c", color: "#111", border: "none", borderRadius: 12, padding: "16px 36px", fontWeight: 900, fontSize: 16, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              Start Protecting My Brand →
            </button>
            <button onClick={() => router.push("/search")} style={{ background: "#f4f4f4", color: "#111", border: "1px solid #e0e0e0", borderRadius: 12, padding: "16px 36px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              Search Free First
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
