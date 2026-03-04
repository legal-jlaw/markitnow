import ChatWidget from "../components/ChatWidget";
import Nav from "../components/Nav";
import { useRouter } from "next/router";
import Head from "next/head";

export default function Pricing() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Pricing — Brand Protection Plans & Filing Services | MarkItNow.ai</title>
        <meta name="description" content="Transparent trademark pricing. Brand Protection Plans from $79/month. One-time filing services from free to $399. USPTO fees always shown separately." />
        <meta name="keywords" content="trademark filing cost, brand protection plan, trademark monitoring price, USPTO filing fee 2025, trademark attorney fee" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; }
        .services-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (max-width: 900px) { .services-grid { grid-template-columns: 1fr; } }
        @media (max-width: 600px) {
          .page-hero { padding: 48px 20px 40px !important; }
          .content-wrap { padding: 0 16px !important; }
          .footer { flex-direction: column !important; gap: 10px !important; padding: 24px 16px !important; text-align: center !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "Poppins, sans-serif" }}>
        <Nav />

        {/* Hero */}
        <div className="page-hero" style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "64px 24px 48px", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, color: "#111", marginBottom: 12, letterSpacing: -1.5 }}>
            Simple, transparent pricing
          </h1>
          <p style={{ fontSize: 16, color: "#777", maxWidth: 480, margin: "0 auto 12px", lineHeight: 1.7 }}>
            One-time filing services. Ongoing protection plans. USPTO fees always shown separately.
          </p>
          <p style={{ fontSize: 13, color: "#bbb", maxWidth: 400, margin: "0 auto 28px" }}>Built by a practicing U.S. trademark attorney. Every price reflects what real protection actually costs.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#c9a84c", flexShrink: 0 }} />
              <span style={{ color: "#b8860b", fontWeight: 600 }}>Our fee</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#ccc", flexShrink: 0 }} />
              <span style={{ color: "#888", fontWeight: 600 }}>USPTO government fee (paid directly to USPTO)</span>
            </div>
          </div>
        </div>

        {/* One-Time Services */}
        <div className="content-wrap" style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 0" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 4, height: 24, background: "#555", borderRadius: 2, flexShrink: 0 }} />
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#111", margin: 0 }}>One-Time Services</h2>
              <div style={{ background: "#f4f4f4", border: "1px solid #e0e0e0", borderRadius: 20, padding: "3px 12px", fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap" }}>A LA CARTE</div>
            </div>
            <p style={{ fontSize: 13, color: "#999", margin: "0 0 0 16px" }}>Pay once. No subscription required.</p>
          </div>

          {[
            {
              category: "Search & Analysis",
              items: [
                { name: "USPTO Trademark Search", desc: "Live search of 4M+ active and dead marks.", our: "Free", uspto: null, path: "/" },
                { name: "AI Analysis Report", desc: "DuPont breakdown, risk score, class-by-class conflicts. PDF delivered instantly.", our: "$99", uspto: null, path: "/file" },
                { name: "Attorney Legal Memo", desc: "Full written legal opinion from a U.S. Licensed Attorney.", our: "$149", uspto: null, path: "/file" },
              ],
            },
            {
              category: "Filing Services",
              items: [
                { name: "DIY Guided Filing", desc: "Step-by-step AI-guided TEAS application.", our: "$69", uspto: "$350/class", path: "/diy" },
                { name: "Attorney-Filed Application", desc: "U.S. Licensed Attorney prepares and files your TEAS Plus application.", our: "$399", uspto: "$350/class", path: "/file" },
                { name: "Statement of Use", desc: "File after your Intent-to-Use mark goes live in commerce.", our: "$249", uspto: "$150/class", path: "/file" },
                { name: "Trademark Revival", desc: "Petition to revive an abandoned application.", our: "$349", uspto: "$150", path: "/file" },
              ],
            },
            {
              category: "Maintenance & Protection",
              items: [
                { name: "Emergency Trademark Audit", desc: "Same-day full conflict analysis, registrability opinion, and risk assessment. Attorney-reviewed. Delivered within 24 hours.", our: "$999", uspto: null, path: "/file", badge: "SAME DAY" },
                { name: "Office Action Response", desc: "Attorney-drafted response to USPTO refusals.", our: "$499+", uspto: null, path: "/file" },
                { name: "Renewal Filing (Sec. 8 & 9)", desc: "Required between years 5-6 and every 10 years.", our: "$199", uspto: "$325/class", path: "/file" },
                { name: "Section 15 Incontestability", desc: "Strengthen your rights after 5 years of continuous use.", our: "$149", uspto: "$250/class", path: "/file" },
                { name: "Portfolio Audit", desc: "Full review of all marks, classes, deadlines, and risk.", our: "$299", uspto: null, path: "/file" },
                { name: "Emergency Trademark Audit", desc: "Same-day attorney review. Full conflict analysis, risk assessment, and action plan. For time-sensitive situations.", our: "$999", uspto: null, path: "/file" },
              ],
            },
          ].map(group => (
            <div key={group.category} style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#bbb", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14, paddingLeft: 2 }}>{group.category}</div>
              <div className="services-grid">
                {group.items.map(s => (
                  <div key={s.name} onClick={() => router.push(s.path)}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#c9a84c"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#e8e8e8"}
                    style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, cursor: "pointer" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{s.name}</div>
                      {s.badge && <div style={{ background: "#111", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 4, letterSpacing: 1, textTransform: "uppercase", flexShrink: 0 }}>{s.badge}</div>}
                    </div>
                      <div style={{ fontSize: 12, color: "#999", lineHeight: 1.5 }}>{s.desc}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: 17, color: "#c9a84c" }}>{s.our}</div>
                      {s.uspto && <div style={{ fontSize: 11, color: "#ccc", marginTop: 2 }}>+ {s.uspto} USPTO</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* USPTO note */}
        <div style={{ maxWidth: 1100, margin: "8px auto 0", padding: "0 24px" }}>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "16px 22px", fontSize: 12, color: "#aaa", lineHeight: 1.7 }}>
            <strong style={{ color: "#888" }}>USPTO fees</strong> are paid directly to the U.S. Patent and Trademark Office, separate from our service fee. The TEAS application fee is $350/class (effective January 18, 2025). USPTO fees are non-refundable regardless of outcome.
          </div>
        </div>

        {/* Protection Plans Callout */}
        <div style={{ maxWidth: 1100, margin: "24px auto 0", padding: "0 24px" }}>
          <div style={{ background: "#111", borderRadius: 16, padding: "32px 36px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#c9a84c", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Brand Protection Plans — from $79/month</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: -0.5 }}>Looking for ongoing protection?</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 480 }}>24/7 AI monitoring, renewal alerts, attorney reviews, and more. All plans include a free $99 AI Analysis Report on signup.</div>
            </div>
            <button onClick={() => router.push("/protect")} style={{ background: "#c9a84c", color: "#111", border: "none", borderRadius: 12, padding: "14px 32px", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}>
              See Protection Plans →
            </button>
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "64px 24px 80px" }}>
          <p style={{ fontSize: 14, color: "#aaa", marginBottom: 20 }}>Don't file blind. It's free to check.</p>
          <button onClick={() => router.push("/")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 12, padding: "14px 36px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
            Search Free Before You Spend a Dollar →
          </button>
        </div>

        {/* Footer */}
        <div className="footer" style={{ background: "#fff", borderTop: "1px solid #e0e0e0", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#111" }}>MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span></div>
          <div style={{ fontSize: 12, color: "#bbb" }}>© 2026 MarkItNow.ai · Not legal advice · Legal services by licensed partner law firms</div>
        </div>
      </div>
      <ChatWidget />
    </>
  );
}
