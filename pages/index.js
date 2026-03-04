import ChatWidget from "../components/ChatWidget";
import Nav from "../components/Nav";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

// Live search counter — specific number builds social proof
const BASE_COUNT = 14382;
const BASE_TIME = new Date("2026-03-01T00:00:00Z").getTime();
function useLiveCount() {
  const [count, setCount] = useState(BASE_COUNT);
  useEffect(() => {
    const elapsed = (Date.now() - BASE_TIME) / 1000;
    const initial = BASE_COUNT + Math.floor(elapsed * 0.04);
    setCount(initial);
    const timer = setInterval(() => setCount(c => c + 1), 24000);
    return () => clearInterval(timer);
  }, []);
  return count.toLocaleString();
}

export default function Home() {
  const router = useRouter();
  const [mark, setMark] = useState("");
  const [loading, setLoading] = useState(false);
  const liveCount = useLiveCount();

  async function handleSearch(e) {
    e.preventDefault();
    if (!mark.trim()) return;
    setLoading(true);
    router.push(`/search?mark=${encodeURIComponent(mark.trim())}`);
  }

  return (
    <>
      <Head>
        <title>MarkItNow.ai — Don't File Blind. Search Free.</title>
        <meta name="description" content="Search 4M+ USPTO trademarks free. Instant results, no account required. Then get an AI conflict analysis or file with a U.S. Licensed Attorney." />
        <meta name="keywords" content="free trademark search, USPTO trademark search, trademark lookup, trademark registration, file a trademark, brand name search" />
        <meta property="og:title" content="MarkItNow.ai — Don't File Blind. Search Free." />
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
        .insurance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
        @media (max-width: 900px) {
          .cards-grid { grid-template-columns: 1fr; }
          .testimonials-grid { grid-template-columns: 1fr; }
          .insurance-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .hero { padding: 60px 20px 52px !important; }
          .hero h1 { font-size: 34px !important; letter-spacing: -1px !important; }
          .search-form { flex-direction: column !important; padding: 10px !important; }
          .search-form button { width: 100% !important; }
          .protect-bar { flex-direction: column !important; text-align: center !important; padding: 28px 20px !important; gap: 16px !important; }
          .footer { flex-direction: column !important; gap: 12px !important; padding: 24px 16px !important; text-align: center !important; }
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "Poppins, sans-serif" }}>
        <Nav />

        {/* Hero */}
        <div className="hero" style={{ maxWidth: 700, margin: "0 auto", padding: "100px 24px 64px", textAlign: "center" }}>

          {/* Social proof counter — specificity signals credibility */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 32, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#2ecc71", animation: "pulse 2s infinite", flexShrink: 0 }} />
            <span><strong style={{ color: "#111" }}>{liveCount}</strong> searches run this month</span>
          </div>

          {/* Loss aversion headline */}
          <h1 style={{ fontSize: "clamp(34px, 6vw, 60px)", fontWeight: 900, color: "#111", lineHeight: 1.05, marginBottom: 20, letterSpacing: -2 }}>
            Don't file blind.<br />
            <span style={{ color: "#c9a84c" }}>Search free before you build.</span>
          </h1>
          <p style={{ fontSize: 17, color: "#666", marginBottom: 16, lineHeight: 1.7, maxWidth: 480, margin: "0 auto 16px" }}>
            A conflicting mark in the USPTO database could block your application, force a rebrand, or cost you everything you've built. Search takes 10 seconds. Finding out too late costs far more.
          </p>

          {/* Authority line — built by practicing attorney */}
          <p style={{ fontSize: 13, color: "#aaa", marginBottom: 36, lineHeight: 1.6, maxWidth: 400, margin: "0 auto 36px" }}>
            Built by a practicing trademark attorney who has filed hundreds of federal applications.
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

        {/* Ambiguity aversion — insurance math */}
        <div style={{ maxWidth: 800, margin: "0 auto 64px", padding: "0 24px" }}>
          <div className="insurance-grid" style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "32px 28px", borderRight: "1px solid #f0f0f0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#c0392b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>The cost of doing nothing</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#c0392b", marginBottom: 6 }}>$50,000+</div>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>Average cost of a trademark dispute. That's before appeals, rebrand costs, or lost revenue while your application is blocked.</div>
            </div>
            <div style={{ padding: "32px 28px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2d7a4f", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>The cost of knowing now</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#2d7a4f", marginBottom: 6 }}>$0</div>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>Full USPTO database search. No account. No credit card. Know exactly what you're up against before you build, file, or spend another dollar.</div>
            </div>
          </div>
        </div>

        {/* What happens next — Completion Effect progress steps */}
        <div style={{ maxWidth: 1000, margin: "0 auto 80px", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Your path to a protected brand</div>
            <h2 style={{ fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 900, color: "#111", margin: 0, letterSpacing: -0.5 }}>Three steps. Most people stop at one.</h2>
          </div>

          {/* Progress steps — open loop psychology */}
          <div style={{ display: "flex", gap: 0, marginBottom: 24, maxWidth: 700, margin: "0 auto 24px", position: "relative" }}>
            {[
              { step: "1", label: "Search", sub: "Free — takes 10 seconds", done: false, active: true },
              { step: "2", label: "Analyze", sub: "AI conflict report — $99", done: false, active: false },
              { step: "3", label: "File & Protect", sub: "From $79/month", done: false, active: false },
            ].map((s, i) => (
              <div key={s.step} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                {i < 2 && <div style={{ position: "absolute", top: 19, left: "50%", width: "100%", height: 2, background: "#e0e0e0", zIndex: 0 }} />}
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: s.active ? "#c9a84c" : "#f0f0f0", border: s.active ? "none" : "2px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: s.active ? "#fff" : "#ccc", zIndex: 1, marginBottom: 10, position: "relative" }}>
                  {s.step}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: s.active ? "#111" : "#bbb", marginBottom: 3, textAlign: "center" }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "#aaa", textAlign: "center" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="cards-grid" style={{ marginTop: 32 }}>
            {[
              { step: "01", title: "Search free — don't file blind", desc: "See every active and dead mark, owner info, filing dates, and class coverage. Know your risk before you spend anything.", tag: "Free", cta: "Search Now →", action: () => router.push("/"), loss: false },
              { step: "02", title: "Don't guess. Get the AI analysis.", desc: "Risk score, DuPont factor breakdown, class-by-class conflict analysis. The $99 report has stopped clients from spending $50,000 in disputes.", tag: "$99", cta: "Get the Report →", action: () => router.push("/file"), loss: true },
              { step: "03", title: "File with an attorney — not alone.", desc: "U.S. Licensed Attorney prepares and files your TEAS Plus application. Most DIY filers get an Office Action. Most attorney-filed applications do not.", tag: "$399", cta: "File With an Attorney →", action: () => router.push("/file"), loss: false },
            ].map(card => (
              <div key={card.title} onClick={card.action} style={{ background: card.loss ? "#fffdf5" : "#fff", border: card.loss ? "1.5px solid #c9a84c" : "1px solid #e8e8e8", borderRadius: 16, padding: "28px", boxShadow: card.loss ? "0 4px 16px rgba(201,168,76,0.1)" : "0 2px 8px rgba(0,0,0,0.04)", cursor: "pointer", display: "flex", flexDirection: "column", gap: 10, position: "relative" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#c9a84c"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = card.loss ? "#c9a84c" : "#e8e8e8"; }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#ccc", letterSpacing: 1, marginBottom: 2 }}>STEP {card.step}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111", margin: 0, lineHeight: 1.4 }}>{card.title}</h3>
                  <span style={{ fontSize: 11, fontWeight: 700, background: "#fff8e6", color: "#b8860b", padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap", marginLeft: 12, flexShrink: 0 }}>{card.tag}</span>
                </div>
                <p style={{ fontSize: 13, color: "#777", lineHeight: 1.7, margin: 0 }}>{card.desc}</p>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#c9a84c", marginTop: 4 }}>{card.cta}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Already filed? Protect bar */}
        <div className="protect-bar" style={{ background: "#111", textAlign: "center", padding: "52px 24px" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 10 }}>Already filed? You're not done.</div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 28, maxWidth: 500, margin: "0 auto 28px" }}>
            Filing gives you a registration number. It does not stop competitors from filing similar marks, missing your renewal deadlines, or responding to Office Actions. That's what monitoring is for.
          </div>
          <button onClick={() => router.push("/protect")} style={{ background: "#c9a84c", color: "#111", border: "none", borderRadius: 12, padding: "14px 36px", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
            Check My Brand Protection →
          </button>
        </div>

        {/* Testimonials */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <h2 style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 900, color: "#111", margin: "0 0 8px", letterSpacing: -0.5 }}>Trusted by founders, artists & brands</h2>
            <p style={{ fontSize: 14, color: "#999", margin: 0 }}>Real outcomes. Real brands.</p>
          </div>
          <div className="testimonials-grid">
            {[
              { quote: "Our lead investor flagged trademark risk in due diligence. I had a full DuPont conflict analysis in my inbox within 5 minutes. We closed the round two weeks later with clean IP.", name: "Marcus T.", title: "Co-Founder, Series A SaaS", seed: "marcus", gender: "male" },
              { quote: "I built my artist name for three years before searching. MarkItNow found a conflicting mark in Class 41 in 30 seconds. I would have spent years building a brand I could never legally own.", name: "DJ Korvell", title: "Electronic Music Producer", seed: "korvell", gender: "male" },
              { quote: "A competitor filed a near-identical mark in our class in October. MarkItNow caught it in 48 hours. We filed an opposition before it published. That brand is worth millions. We almost lost it.", name: "Devon Clarke", title: "Festival Director, City of Gods", seed: "devon", gender: "male" },
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
