import Head from "next/head";
import { useRouter } from "next/router";

const STEPS = [
  {
    num: "01",
    title: "Search for Free",
    desc: "Enter your brand name and search the live USPTO database of 4M+ marks instantly. See active conflicts, dead marks, class breakdowns, and owner info — no account required.",
    tag: "Free",
    icon: "🔍",
    detail: ["Live USPTO TESS database", "Active & dead marks", "Owner info & filing dates", "Results in seconds"],
  },
  {
    num: "02",
    title: "Get an AI Analysis Report",
    desc: "Our AI analyzes your search results and produces a full conflict analysis with a risk score, DuPont factor breakdown, and class-by-class recommendations.",
    tag: "$99",
    icon: "🤖",
    detail: ["Likelihood of confusion analysis", "Risk score (0–100)", "All 13 DuPont factors", "Filing strategy recommendations"],
  },
  {
    num: "03",
    title: "Choose Your Path",
    desc: "Based on your results, decide how to proceed. File yourself with our DIY guide, or have a U.S. Licensed Attorney handle everything for you.",
    tag: "$69 or $399",
    icon: "⚖️",
    detail: ["DIY guided filing ($69 + USPTO fees)", "Attorney filing ($399 + USPTO fees)", "Attorney memo for investors ($149)", "No pressure — move at your pace"],
  },
  {
    num: "04",
    title: "USPTO Reviews Your Application",
    desc: "After filing, the USPTO assigns an examining attorney who reviews your application. This typically takes 3–4 months. You may receive an Office Action (objection) requiring a response.",
    tag: "3–4 months",
    icon: "📋",
    detail: ["Filing receipt issued immediately", "Serial number assigned", "Examining attorney review", "Office Action response if needed"],
  },
  {
    num: "05",
    title: "Publication & Registration",
    desc: "If approved, your mark publishes in the Official Gazette for 30 days. If no opposition is filed, your trademark registers and you receive your certificate.",
    tag: "~13–18 months total",
    icon: "🏆",
    detail: ["30-day publication period", "Certificate of registration", "® symbol rights", "10-year renewable term"],
  },
];


export default function HowItWorks() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>How It Works — MarkItNow.ai</title>
        <meta name="description" content="Learn how trademark registration works, from free search to USPTO registration. Step-by-step guide by MarkItNow.ai." />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "Poppins, sans-serif" }}>

        {/* Nav */}
        <nav style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", height: 64 }}>
          <div onClick={() => router.push("/")} style={{ fontWeight: 900, fontSize: 22, color: "#111", letterSpacing: -0.5, cursor: "pointer" }}>
            MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span>
          </div>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {["How It Works", "Pricing", "FAQ"].map(item => (
              <span key={item} onClick={() => { if (item === "Pricing") router.push("/pricing"); else if (item === "For Attorneys") router.push("/for-attorneys"); }} style={{ color: item === "How It Works" ? "#c9a84c" : "#555", fontSize: 14, fontWeight: item === "How It Works" ? 700 : 500, cursor: "pointer" }}>{item}</span>
            ))}
            <button onClick={() => router.push("/file")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>File Now</button>
          </div>
        </nav>

        {/* Hero */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "64px 24px", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#b8860b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>
            The Process
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "#111", lineHeight: 1.1, marginBottom: 16, letterSpacing: -1.5 }}>
            How trademark registration works
          </h1>
          <p style={{ fontSize: 17, color: "#777", maxWidth: 520, margin: "0 auto" }}>
            From free search to federal registration — here's exactly what happens and what it costs at every step.
          </p>
        </div>

        {/* Timeline */}
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "64px 24px" }}>
          {STEPS.map((step, i) => (
            <div key={step.num} style={{ display: "flex", gap: 32, marginBottom: 48, position: "relative" }}>
              {/* Line */}
              {i < STEPS.length - 1 && (
                <div style={{ position: "absolute", left: 28, top: 64, bottom: -24, width: 2, background: "#e8e8e8" }} />
              )}
              {/* Number */}
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: i === 0 ? "#c9a84c" : "#111", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
                {step.num}
              </div>
              {/* Content */}
              <div style={{ flex: 1, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{step.icon}</span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>{step.title}</h3>
                  </div>
                  <span style={{ background: "#fff8e6", border: "1px solid #f0d080", color: "#b8860b", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, whiteSpace: "nowrap", marginLeft: 12 }}>{step.tag}</span>
                </div>
                <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, marginBottom: 16 }}>{step.desc}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {step.detail.map(d => (
                    <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#555" }}>
                      <span style={{ color: "#c9a84c", fontWeight: 800, fontSize: 14 }}>✓</span> {d}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cost Summary */}
        <div style={{ maxWidth: 860, margin: "0 auto 64px", padding: "0 24px" }}>
          <div style={{ background: "#111", borderRadius: 20, padding: "40px 48px" }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: -0.5 }}>Total cost breakdown</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 28 }}>Our fees + USPTO government fees — always shown separately</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              {[
                { label: "Search", our: "Free", uspto: "—" },
                { label: "AI Report", our: "$99", uspto: "—" },
                { label: "DIY Filing", our: "$69", uspto: "$350/class" },
                { label: "Attorney Filing", our: "$399", uspto: "$350/class" },
                { label: "Statement of Use", our: "$249", uspto: "$150/class" },
                { label: "Renewal", our: "$199", uspto: "$325/class" },
              ].map(item => (
                <div key={item.label} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#c9a84c", marginBottom: 4 }}>{item.our}</div>
                  {item.uspto !== "—" && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>+ {item.uspto} USPTO</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Link */}
        <div style={{ maxWidth: 860, margin: "0 auto 80px", padding: "0 24px" }}>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: "32px 36px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>Have more questions?</h3>
              <p style={{ fontSize: 14, color: "#777", margin: 0 }}>Browse our full FAQ — costs, timelines, Office Actions, renewals, and more.</p>
            </div>
            <button onClick={() => router.push("/faq")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif", whiteSpace: "nowrap", marginLeft: 24 }}>
              View FAQ →
            </button>
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: "#fff", borderTop: "1px solid #e0e0e0", padding: "64px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#111", marginBottom: 12, letterSpacing: -0.5 }}>Ready to protect your brand?</h2>
          <p style={{ color: "#999", marginBottom: 28, fontSize: 15 }}>Start with a free search. No account required.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/")} style={{ background: "#c9a84c", color: "#fff", border: "none", borderRadius: 10, padding: "14px 32px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              Search Free →
            </button>
            <button onClick={() => router.push("/pricing")} style={{ background: "#fff", color: "#111", border: "1px solid #e0e0e0", borderRadius: 10, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              View Pricing
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#fff", borderTop: "1px solid #e0e0e0", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#111" }}>MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span></div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}><span onClick={() => router.push("/faq")} style={{ fontSize: 13, color: "#aaa", cursor: "pointer", fontWeight: 500 }}>FAQ</span><span style={{ fontSize: 12, color: "#bbb" }}>© 2026 MarkItNow.ai · Search and AI reports are informational only and do not constitute legal advice · Attorney filing services provided by licensed partner law firms</span></div>
        </div>
      </div>
    </>
  );
}
