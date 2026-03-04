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
      </Head>

      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0a0f1e 0%, #0f1e3c 50%, #0a0f1e 100%)" }}>
        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontFamily: "Poppins, sans-serif", fontWeight: 900, fontSize: 24, color: "#c9a84c", letterSpacing: -0.5 }}>
            MarkItNow<span style={{ color: "#7eb5e8" }}>.ai</span>
          </div>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {["How It Works", "Pricing", "For Attorneys"].map(item => (
              <span key={item} style={{ color: "#7eb5e8", fontSize: 14, fontWeight: 500, cursor: "pointer", opacity: 0.8 }}>{item}</span>
            ))}
            <button onClick={() => router.push("/file")} style={{ background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 800, fontSize: 14 }}>
              File Now
            </button>
          </div>
        </nav>

        {/* Hero */}
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "100px 24px 80px", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#c9a84c", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 32 }}>
            Search 4M+ USPTO Marks Instantly
          </div>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: "clamp(40px, 7vw, 72px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, marginBottom: 24, letterSpacing: -2 }}>
            Trademark Search.<br />
            <span style={{ color: "#c9a84c" }}>Actually Free.</span>
          </h1>
          <p style={{ fontSize: 20, color: "rgba(255,255,255,0.65)", marginBottom: 48, lineHeight: 1.6, maxWidth: 560, margin: "0 auto 48px" }}>
            Search the live USPTO database free. Get a full AI analysis report for $99. File with a U.S.-licensed attorney for $399.
            <br /><span style={{ color: "#7eb5e8", fontWeight: 600 }}>Trademarkia charges $499 for the same thing.</span>
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, maxWidth: 600, margin: "0 auto" }}>
            <input
              value={mark}
              onChange={e => setMark(e.target.value)}
              placeholder="Enter your brand name..."
              style={{ flex: 1, padding: "18px 24px", borderRadius: 12, border: "2px solid rgba(201,168,76,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 18, fontFamily: "inherit", outline: "none" }}
              autoFocus
            />
            <button type="submit" disabled={loading || !mark.trim()} style={{ padding: "18px 32px", background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 12, fontWeight: 900, fontSize: 16, whiteSpace: "nowrap", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Searching..." : "Search Free →"}
            </button>
          </form>
          <p style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>No account required · Results in seconds · Live USPTO database</p>
        </div>

        {/* Stats bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "24px 40px", display: "flex", justifyContent: "center", gap: 64 }}>
          {[["4M+", "USPTO Marks"], ["$99", "AI Report"], ["$399", "Attorney Filed"], ["$100", "Less Than Trademarkia"]].map(([num, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 28, fontWeight: 900, color: "#c9a84c" }}>{num}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500, letterSpacing: 0.5 }}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Pricing section */}
        <div id="pricing" style={{ maxWidth: 1000, margin: "80px auto", padding: "0 24px" }}>
          <h2 style={{ fontFamily: "Poppins, sans-serif", fontSize: 36, fontWeight: 900, color: "#fff", textAlign: "center", marginBottom: 16 }}>
            Beat The Big Players.
          </h2>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.55)", fontSize: 16, marginBottom: 48 }}>
            Trademarkia charges $499–$699 for attorney-filed registration. We charge $399.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            {[
              { title: "Free Search", price: "$0", badge: null, items: ["4M+ USPTO marks", "Instant conflict check", "Status & class info", "Live database results"], cta: "Search Now", featured: false, onClick: () => document.querySelector("input")?.focus() },
              { title: "AI Report", price: "$99", badge: null, items: ["Everything in Free", "Full AI risk analysis", "DuPont 13-factor memo", "Attorney-grade writeup", "PDF export"], cta: "Get Report — $99", featured: false, onClick: () => {} },
              { title: "Attorney Filed", price: "$399", badge: "MOST POPULAR — SAVE $100 vs. TRADEMARKIA", items: ["Everything in $99", "U.S.-licensed attorney files", "Reviews goods & services", "Selects TEAS path", "Office action monitoring"], cta: "File With Attorney — $399", featured: true, onClick: () => router.push("/file") },
            ].map(tier => (
              <div key={tier.title} style={{
                background: tier.featured ? "#1a1508" : "rgba(255,255,255,0.04)",
                border: tier.featured ? "2px solid #c9a84c" : "1px solid rgba(255,255,255,0.1)",
                borderTop: tier.featured ? "4px solid #c9a84c" : undefined,
                borderRadius: 16, padding: 28, display: "flex", flexDirection: "column"
              }}>
                {tier.badge && <div style={{ background: "#c9a84c", color: "#0a0a0a", fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 6, marginBottom: 16, textAlign: "center", letterSpacing: 0.5 }}>{tier.badge}</div>}
                <div style={{ color: tier.featured ? "#c9a84c" : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{tier.title}</div>
                <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 42, fontWeight: 900, color: tier.featured ? "#c9a84c" : "#fff", marginBottom: 24 }}>{tier.price}</div>
                <div style={{ flex: 1, marginBottom: 24 }}>
                  {tier.items.map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10, fontSize: 14, color: tier.featured ? "#d4c090" : "rgba(255,255,255,0.7)" }}>
                      <span style={{ color: "#7eb5e8", fontWeight: 700, marginTop: 1 }}>✓</span>
                      {item}
                    </div>
                  ))}
                </div>
                <button onClick={tier.onClick} style={{ width: "100%", padding: "14px", background: tier.featured ? "#c9a84c" : "rgba(255,255,255,0.08)", color: tier.featured ? "#0a0a0a" : "#fff", border: tier.featured ? "none" : "1px solid rgba(255,255,255,0.2)", borderRadius: 10, fontWeight: 800, fontSize: 15 }}>
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800, color: "#c9a84c" }}>MarkItNow.ai</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>© 2026 MarkItNow.ai · USPTO fees paid directly to USPTO · Not a substitute for legal advice</div>
        </div>
      </div>
    </>
  );
}
