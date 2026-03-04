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
            {["How It Works", "Pricing", "For Attorneys"].map(item => (
              <span key={item} onClick={() => item === "Pricing" ? router.push("/pricing") : null} style={{ color: "#555", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>{item}</span>
            ))}
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
            Search the live USPTO database free. Get a full AI analysis report for $99. File with a U.S.-licensed attorney for $399.
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
            { icon: "⚖️", title: "Attorney Filing", desc: "Licensed DC attorney files your TEAS application. $100 less than Trademarkia.", tag: "$399 + USPTO fees" },
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

        {/* Compare bar */}
        <div style={{ background: "#111", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Trademarkia charges $499 for attorney filing.</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>We charge <span style={{ color: "#c9a84c" }}>$399</span>. Same service. Licensed attorney. Lower price.</p>
            <button onClick={() => router.push("/pricing")} style={{ marginTop: 24, background: "#c9a84c", color: "#111", border: "none", borderRadius: 10, padding: "14px 32px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              See All Pricing →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#fff", borderTop: "1px solid #e0e0e0", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#111" }}>MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span></div>
          <div style={{ fontSize: 13, color: "#aaa" }}>© 2026 Aggressive Counsel PLLC. Not legal advice until retained.</div>
        </div>
      </div>
    </>
  );
}
