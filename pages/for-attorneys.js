import Head from "next/head";
import { useRouter } from "next/router";

const BENEFITS = [
  { icon: "⚡", title: "Instant AI Analysis", desc: "Our AI runs conflict analysis, identifies Nice classes, and drafts goods & services descriptions — cutting your research time dramatically." },
  { icon: "📊", title: "DuPont Factor Reports", desc: "Get a full 13-factor DuPont analysis with risk scoring instantly. Use it as a starting point or deliver it directly to clients." },
  { icon: "🏷️", title: "Flat-Fee Transparency", desc: "Clients see exactly what they're paying — our fee plus USPTO fees. No surprises. No billing disputes." },
  { icon: "🔄", title: "White-Label Option", desc: "License MarkItNow under your firm's branding. Offer AI-powered trademark search and reporting to your clients through your own platform." },
  { icon: "📅", title: "Portfolio Monitoring", desc: "Automated deadline tracking for renewals, SOUs, and maintenance filings. Never miss a Section 8 or Section 9 deadline again." },
  { icon: "🤝", title: "Referral Network", desc: "Join our network of partner law firms. Receive referrals for office action responses, renewals, and complex prosecution matters." },
];

const PLANS = [
  {
    name: "Referral Partner",
    price: "Free",
    desc: "Refer clients to MarkItNow and earn referral fees on every completed filing.",
    features: ["Referral fee on attorney filings", "Branded referral link", "Client progress visibility", "No monthly commitment"],
    cta: "Become a Partner",
    highlight: false,
  },
  {
    name: "White-Label",
    price: "$499/mo",
    desc: "License the full MarkItNow platform under your firm's branding.",
    features: ["Your logo & domain", "Full AI search & reports", "Attorney filing workflow", "Client dashboard", "Portfolio monitoring", "Priority support"],
    cta: "Schedule a Demo",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "Custom integration for high-volume trademark practices and IP boutiques.",
    features: ["API access", "Custom AI training", "Bulk filing workflows", "Dedicated account manager", "SLA guarantee", "Custom pricing"],
    cta: "Contact Us",
    highlight: false,
  },
];

export default function ForAttorneys() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>For Attorneys — MarkItNow.ai</title>
        <meta name="description" content="Partner with MarkItNow.ai. AI-powered trademark tools for law firms. White-label licensing, referral network, and portfolio monitoring." />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "Poppins, sans-serif" }}>

        {/* Nav */}
        <nav style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", height: 64 }}>
          <div onClick={() => router.push("/")} style={{ fontWeight: 900, fontSize: 22, color: "#111", letterSpacing: -0.5, cursor: "pointer" }}>
            MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span>
          </div>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {["How It Works", "Pricing", "For Attorneys"].map(item => (
              <span key={item} onClick={() => { if (item === "Pricing") router.push("/pricing"); else if (item === "How It Works") router.push("/how-it-works"); }} style={{ color: item === "For Attorneys" ? "#c9a84c" : "#555", fontSize: 14, fontWeight: item === "For Attorneys" ? 700 : 500, cursor: "pointer" }}>{item}</span>
            ))}
            <button onClick={() => router.push("/file")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>File Now</button>
          </div>
        </nav>

        {/* Hero */}
        <div style={{ background: "#111", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#c9a84c", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 }}>
            For Law Firms & Attorneys
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 16, letterSpacing: -1.5, maxWidth: 700, margin: "0 auto 16px" }}>
            AI-powered trademark tools for your practice
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", maxWidth: 520, margin: "0 auto 36px" }}>
            Partner with MarkItNow to offer clients instant trademark search, AI analysis, and automated deadline monitoring — under your brand or ours.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => window.location.href = "mailto:legal@jarralslaw.com?subject=Attorney Partnership Inquiry"} style={{ background: "#c9a84c", color: "#111", border: "none", borderRadius: 10, padding: "14px 32px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              Partner With Us →
            </button>
            <button onClick={() => window.location.href = "mailto:legal@jarralslaw.com?subject=Demo Request"} style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              Schedule a Demo
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "32px 48px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, textAlign: "center" }}>
            {[
              { val: "4M+", label: "USPTO marks searched" },
              { val: "$350", label: "USPTO fee per class" },
              { val: "13mo", label: "Avg. time to registration" },
              { val: "99%", label: "TEAS Plus eligibility rate" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#c9a84c", marginBottom: 4 }}>{s.val}</div>
                <div style={{ fontSize: 13, color: "#999" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: "#111", letterSpacing: -1, marginBottom: 12 }}>Built for trademark practitioners</h2>
            <p style={{ color: "#777", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>Everything you need to serve more clients, faster.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {BENEFITS.map(b => (
              <div key={b.title} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{b.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 8 }}>{b.title}</h3>
                <p style={{ fontSize: 14, color: "#777", lineHeight: 1.7, margin: 0 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div style={{ background: "#fff", borderTop: "1px solid #e0e0e0", borderBottom: "1px solid #e0e0e0", padding: "64px 24px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: "#111", letterSpacing: -1, marginBottom: 12 }}>Partnership options</h2>
              <p style={{ color: "#777", fontSize: 16 }}>Choose how you want to work with us.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              {PLANS.map(plan => (
                <div key={plan.name} style={{ background: plan.highlight ? "#111" : "#fff", border: `1px solid ${plan.highlight ? "#111" : "#e8e8e8"}`, borderRadius: 16, padding: 28, position: "relative" }}>
                  {plan.highlight && <div style={{ position: "absolute", top: -12, right: 20, background: "#c9a84c", color: "#111", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 0.5 }}>Most Popular</div>}
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: plan.highlight ? "#fff" : "#111", marginBottom: 4 }}>{plan.name}</h3>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#c9a84c", marginBottom: 8 }}>{plan.price}</div>
                  <p style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.5)" : "#777", lineHeight: 1.6, marginBottom: 20 }}>{plan.desc}</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.7)" : "#555", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#c9a84c", fontWeight: 800 }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => window.location.href = `mailto:legal@jarralslaw.com?subject=${plan.name} Inquiry`}
                    style={{ width: "100%", background: plan.highlight ? "#c9a84c" : "#f4f4f4", color: plan.highlight ? "#111" : "#111", border: plan.highlight ? "none" : "1px solid #e0e0e0", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                    {plan.cta} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#111", marginBottom: 12, letterSpacing: -0.5 }}>Let's talk</h2>
          <p style={{ color: "#777", fontSize: 15, marginBottom: 28, lineHeight: 1.7 }}>
            Whether you're a solo practitioner or a large IP firm, we can build a partnership that works for your practice. Email us and we'll respond within 24 hours.
          </p>
          <button onClick={() => window.location.href = "mailto:legal@jarralslaw.com?subject=Attorney Partnership Inquiry"} style={{ background: "#c9a84c", color: "#fff", border: "none", borderRadius: 10, padding: "14px 36px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
            legal@jarralslaw.com →
          </button>
        </div>

        {/* Footer */}
        <div style={{ background: "#fff", borderTop: "1px solid #e0e0e0", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#111" }}>MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span></div>
          <div style={{ fontSize: 12, color: "#bbb" }}>© 2026 MarkItNow.ai · Search and AI reports are informational only and do not constitute legal advice · Attorney filing services provided by licensed partner law firms</div>
        </div>
      </div>
    </>
  );
}
