import ChatWidget from "../components/ChatWidget";
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
        <title>MarkItNow — Trademark Search & Filing</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "Poppins, sans-serif" }}>

        {/* Nav */}
        <nav style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", height: 64 }}>
          <div style={{ fontWeight: 900, fontSize: 22, color: "#111", letterSpacing: -0.5 }}>
            MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span>
          </div>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <span onClick={() => router.push("/how-it-works")} style={{ color: "#555", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>How It Works</span>
            <span onClick={() => router.push("/pricing")} style={{ color: "#555", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Pricing</span>
            <span onClick={() => router.push("/faq")} style={{ color: "#555", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>FAQ</span>
            <button onClick={() => router.push("/file")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              File Now
            </button>
          </div>
        </nav>

        {/* Hero */}
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "100px 24px 80px", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#b8860b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 32 }}>
            Search 4M+ USPTO Marks Instantly
          </div>
          <h1 style={{ fontSize: "clamp(38px, 6vw, 64px)", fontWeight: 900, color: "#111", lineHeight: 1.1, marginBottom: 20, letterSpacing: -2 }}>
            Trademark Search.<br />
            <span style={{ color: "#c9a84c" }}>Actually Free.</span>
          </h1>
          <p style={{ fontSize: 18, color: "#666", marginBottom: 48, lineHeight: 1.7, maxWidth: 520, margin: "0 auto 48px" }}>
            Search the live USPTO database free. Get a full AI analysis report for $99. File with a U.S. Licensed Attorney for $399.
          </p>

          <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, maxWidth: 580, margin: "0 auto", background: "#fff", border: "1px solid #e0e0e0", borderRadius: 12, padding: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <input
              value={mark}
              onChange={e => setMark(e.target.value)}
              placeholder="Search your trademark..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: 16, padding: "10px 16px", fontFamily: "Poppins, sans-serif", color: "#111", background: "transparent" }}
            />
            <button type="submit" disabled={loading} style={{ background: "#c9a84c", color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif", whiteSpace: "nowrap" }}>
              {loading ? "Searching..." : "Search Free →"}
            </button>
          </form>
          <div style={{ marginTop: 16, fontSize: 13, color: "#999" }}>No account required. Results in seconds.</div>
        </div>

        {/* Feature Cards */}
        <div style={{ maxWidth: 1100, margin: "0 auto 100px", padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {[
            { icon: "🔍", title: "Free USPTO Search", desc: "Live database of 4M+ marks. See active conflicts, dead marks, and owner info instantly.", tag: "Free" },
            { icon: "🤖", title: "AI Analysis Report", desc: "Risk score, DuPont factor breakdown, and class-by-class conflict analysis.", tag: "$99" },
            { icon: "⚖️", title: "Attorney Filing", desc: "U.S. Licensed Attorney files your TEAS application. Attorney-reviewed from start to finish.", tag: "$399 + USPTO fees" },
          ].map(card => (
            <div key={card.title} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: 32, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 28, marginBottom: 16 }}>{card.icon}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111", margin: 0 }}>{card.title}</h3>
                <span style={{ fontSize: 12, fontWeight: 700, background: "#fff8e6", color: "#b8860b", padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap", marginLeft: 8 }}>{card.tag}</span>
              </div>
              <p style={{ fontSize: 14, color: "#777", lineHeight: 1.7, margin: 0 }}>{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px 80px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 4, height: 22, background: "#c9a84c", borderRadius: 2 }} />
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#111", margin: 0, letterSpacing: -0.5 }}>Trusted by founders, artists & brands</h2>
              <div style={{ width: 4, height: 22, background: "#c9a84c", borderRadius: 2 }} />
            </div>
            <p style={{ fontSize: 15, color: "#777", margin: 0 }}>Real people protecting real brands.</p>
          </div>

          {/* Row 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
            {[
              { quote: "Our lead investor flagged trademark risk in due diligence. MarkItNow had a full conflict analysis in my inbox within minutes. We closed the round with our IP locked down.", name: "Marcus T.", title: "Co-Founder, Series A SaaS", seed: "marcus", gender: "male" },
              { quote: "I've been building my artist name for three years. Didn't realize someone had a similar mark until MarkItNow flagged it. Saved me from a serious rebrand down the road.", name: "DJ Korvell", title: "Electronic Music Producer", seed: "korvell", gender: "male" },
              { quote: "We run three festivals a year. MarkItNow monitors all our marks and files our renewals automatically. One less thing to think about.", name: "Devon Clarke", title: "Festival Director, City of Gods", seed: "devon", gender: "male" },
            ].map(t => (
              <div key={t.name} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <img src={`https://randomuser.me/api/portraits/${t.gender === "female" ? "women" : "men"}/${Math.abs(t.seed.charCodeAt(0) + t.seed.charCodeAt(1)) % 70 + 1}.jpg`} alt={t.name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid #f0d080" }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#111" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{t.title}</div>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8, margin: 0, fontStyle: "italic" }}>"{t.quote}"</p>
                <div style={{ display: "flex", gap: 2, marginTop: 16 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#c9a84c", fontSize: 14 }}>★</span>)}
                </div>
              </div>
            ))}
          </div>

          {/* Row 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {[
              { quote: "I thought trademarks were only for big companies. MarkItNow made it simple and affordable. My bakery brand is protected and I didn't need a law firm.", name: "Sandra M.", title: "Owner, Sweet Proof Bakery", seed: "sandra", gender: "female" },
              { quote: "I build companies and sell them. A registered trademark adds real value at exit. MarkItNow is the fastest and cheapest way I've found to get it done.", name: "Chris B.", title: "4x Founder", seed: "chris", gender: "male" },
              { quote: "We were about to pitch at Demo Day when our attorney said we needed a trademark opinion. MarkItNow gave us a DuPont analysis for $99 that satisfied our investors.", name: "Priya S.", title: "Founder, HealthTech Startup", seed: "priya", gender: "female" },
            ].map(t => (
              <div key={t.name} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <img src={`https://randomuser.me/api/portraits/${t.gender === "female" ? "women" : "men"}/${Math.abs(t.seed.charCodeAt(0) + t.seed.charCodeAt(1)) % 70 + 1}.jpg`} alt={t.name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid #f0d080" }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#111" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{t.title}</div>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8, margin: 0, fontStyle: "italic" }}>"{t.quote}"</p>
                <div style={{ display: "flex", gap: 2, marginTop: 16 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#c9a84c", fontSize: 14 }}>★</span>)}
                </div>
              </div>
            ))}
          </div>
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