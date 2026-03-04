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
        <title>MarkItNow.ai — Free Trademark Search</title>
        <meta name="description" content="Search 4M+ USPTO trademarks free. Instant results, no account required. Then get an AI conflict analysis or file with a U.S. Licensed Attorney." />
        <meta name="keywords" content="free trademark search, USPTO trademark search, trademark lookup, trademark registration, file a trademark, brand name search" />
        <meta property="og:title" content="MarkItNow.ai — Free Trademark Search" />
        <meta property="og:description" content="Search 4M+ USPTO trademarks free. Instant results, no account required." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MarkItNow.ai" />
        <meta name="twitter:card" content="summary" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; }
        .cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 900px) {
          .cards-grid { grid-template-columns: 1fr; }
          .testimonials-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .hero { padding: 60px 20px 52px !important; }
          .hero h1 { font-size: 36px !important; letter-spacing: -1px !important; }
          .search-form { flex-direction: column !important; padding: 10px !important; }
          .search-form button { width: 100% !important; }
          .protect-bar { flex-direction: column !important; text-align: center !important; padding: 28px 20px !important; gap: 16px !important; }
          .footer { flex-direction: column !important; gap: 12px !important; padding: 24px 16px !important; text-align: center !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "Poppins, sans-serif" }}>
        <Nav />

        {/* Hero */}
        <div className="hero" style={{ maxWidth: 700, margin: "0 auto", padding: "100px 24px 80px", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 20, padding: "6px 16px", fontSize: 11, fontWeight: 700, color: "#b8860b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 32 }}>
            4M+ USPTO Marks — Search Free
          </div>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 62px)", fontWeight: 900, color: "#111", lineHeight: 1.05, marginBottom: 20, letterSpacing: -2 }}>
            Trademark Search.<br />
            <span style={{ color: "#c9a84c" }}>Actually Free.</span>
          </h1>
          <p style={{ fontSize: 17, color: "#666", marginBottom: 44, lineHeight: 1.7, maxWidth: 480, margin: "0 auto 44px" }}>
            Search the live USPTO database instantly. No account. No credit card. Results in seconds.
          </p>
          <form onSubmit={handleSearch} className="search-form" style={{ display: "flex", gap: 10, maxWidth: 560, margin: "0 auto", background: "#fff", border: "1px solid #e0e0e0", borderRadius: 14, padding: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
            <input
              value={mark}
              onChange={e => setMark(e.target.value)}
              placeholder="Enter your brand name..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: 16, padding: "10px 16px", fontFamily: "Poppins, sans-serif", color: "#111", background: "transparent", minWidth: 0 }}
            />
            <button type="submit" disabled={loading} style={{ background: "#c9a84c", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif", whiteSpace: "nowrap" }}>
              {loading ? "Searching..." : "Search Free →"}
            </button>
          </form>
          <div style={{ marginTop: 14, fontSize: 13, color: "#bbb" }}>No account required. Results in seconds.</div>
        </div>

        {/* What happens after you search */}
        <div style={{ maxWidth: 1000, margin: "0 auto 80px", padding: "0 24px" }}>
          <div className="cards-grid">
            {[
              { icon: "🔍", title: "Free Search", desc: "See every active and dead mark, owner info, filing dates, and class coverage instantly.", tag: "Free", action: null },
              { icon: "🤖", title: "AI Analysis Report", desc: "Risk score, DuPont factor breakdown, and class-by-class conflict analysis. PDF delivered instantly.", tag: "$99", action: () => router.push("/file") },
              { icon: "⚖️", title: "Attorney Filing", desc: "U.S. Licensed Attorney prepares and files your TEAS Plus application from start to finish.", tag: "$399 + USPTO fees", action: () => router.push("/file") },
            ].map(card => (
              <div key={card.title} onClick={card.action} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: "28px 28px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", cursor: card.action ? "pointer" : "default" }}
                onMouseEnter={e => { if (card.action) e.currentTarget.style.borderColor = "#c9a84c"; }}
                onMouseLeave={e => { if (card.action) e.currentTarget.style.borderColor = "#e8e8e8"; }}>
                <div style={{ fontSize: 26, marginBottom: 14 }}>{card.icon}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: 0 }}>{card.title}</h3>
                  <span style={{ fontSize: 11, fontWeight: 700, background: "#fff8e6", color: "#b8860b", padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap", marginLeft: 8 }}>{card.tag}</span>
                </div>
                <p style={{ fontSize: 13, color: "#777", lineHeight: 1.7, margin: 0 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Already filed? Protect bar */}
        <div className="protect-bar" style={{ background: "#111", textAlign: "center", padding: "52px 24px" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 10 }}>Already filed your trademark?</div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 28, maxWidth: 460, margin: "0 auto 28px" }}>Filing is the beginning, not the end. Monitor your mark 24/7 and never miss a deadline.</div>
          <button onClick={() => router.push("/protect")} style={{ background: "#c9a84c", color: "#111", border: "none", borderRadius: 12, padding: "14px 36px", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
            Protect My Brand →
          </button>
        </div>

        {/* Testimonials */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <h2 style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 900, color: "#111", margin: "0 0 8px", letterSpacing: -0.5 }}>Trusted by founders, artists & brands</h2>
            <p style={{ fontSize: 14, color: "#999", margin: 0 }}>Real people protecting real brands.</p>
          </div>
          <div className="testimonials-grid">
            {[
              { quote: "Our lead investor flagged trademark risk in due diligence. MarkItNow had a full conflict analysis in my inbox within minutes. We closed the round with our IP locked down.", name: "Marcus T.", title: "Co-Founder, Series A SaaS", seed: "marcus", gender: "male" },
              { quote: "I've been building my artist name for three years. Didn't realize someone had a similar mark until MarkItNow flagged it. Saved me from a serious rebrand.", name: "DJ Korvell", title: "Electronic Music Producer", seed: "korvell", gender: "male" },
              { quote: "We run three festivals a year. MarkItNow monitors all our marks and files our renewals automatically. One less thing to think about.", name: "Devon Clarke", title: "Festival Director, City of Gods", seed: "devon", gender: "male" },
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
          <div style={{ fontSize: 12, color: "#bbb" }}>© 2026 MarkItNow.ai · Not legal advice · Legal services by licensed partner law firms</div>
        </div>
      </div>
      <ChatWidget />
    </>
  );
}
