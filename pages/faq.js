import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

const FAQS = [
  {
    category: "The Basics",
    questions: [
      { q: "What is a trademark?", a: "A trademark is a word, name, symbol, logo, or combination that identifies the source of goods or services and distinguishes them from others. Registering a trademark with the USPTO gives you nationwide rights and the ability to use the ® symbol." },
      { q: "What is the difference between ™ and ®?", a: "™ can be used as soon as you claim rights in a mark, even before filing with the USPTO. ® can only be used after your mark is officially registered. Using ® before registration is a federal offense." },
      { q: "Do I need a trademark attorney?", a: "You are not required to use an attorney to file a trademark application, but mistakes are common and can result in refusal or abandonment. Our AI tools help whether you file yourself (DIY, $69) or have our partner attorneys handle everything ($399)." },
      { q: "How long does registration take?", a: "From filing to registration typically takes 13–18 months for a straightforward application. If you receive an Office Action requiring a response, it can take longer depending on the complexity." },
    ],
  },
  {
    category: "Filing",
    questions: [
      { q: "Do I need to be using the mark already to file?", a: "No. You can file under Section 1(b) Intent-to-Use if you have a bona fide intention to use the mark in commerce. You will need to file a Statement of Use once you begin using it ($249 our fee + $150 USPTO fee per class)." },
      { q: "What is a Nice class?", a: "The Nice Classification is an international system that groups goods and services into 45 classes. You must identify which classes cover your goods or services when filing. Each class is a separate filing with its own USPTO fee ($350/class)." },
      { q: "What is TEAS Plus?", a: "TEAS Plus is a USPTO filing option that requires you to use pre-approved identification language from the ID Manual. It used to be cheaper than TEAS Standard but both are now $350/class as of January 2025. Using approved ID language still avoids a $200/class surcharge for custom descriptions." },
      { q: "What happens after I file?", a: "You receive a filing receipt with a serial number immediately. A USPTO examining attorney is assigned within 3–4 months and reviews your application. They may approve it or issue an Office Action raising objections." },
    ],
  },
  {
    category: "Office Actions & Problems",
    questions: [
      { q: "What is an Office Action?", a: "An Office Action is an official letter from a USPTO examining attorney raising objections to your application. Common issues include likelihood of confusion with existing marks, descriptiveness, or specimen problems. You have 3 months to respond (extendable to 6 months for a fee)." },
      { q: "What if my application is refused?", a: "You can respond to the Office Action arguing against the refusal, amend your application, or appeal to the Trademark Trial and Appeal Board (TTAB). Our partner attorneys handle Office Action responses starting at $499." },
      { q: "My application was abandoned — can I revive it?", a: "Yes, if abandoned unintentionally you can file a Petition to Revive within 2 months of the abandonment notice (or up to 6 months in some cases). This is time-sensitive. Contact us immediately — revival filing starts at $349." },
    ],
  },
  {
    category: "After Registration",
    questions: [
      { q: "What maintenance filings are required?", a: "Between years 5–6: Section 8 Declaration of Continued Use + Section 15 Declaration of Incontestability. Between years 9–10: Section 9 Renewal. Missing these deadlines cancels your registration. Our Portfolio Monitor ($49/year per mark) tracks all deadlines automatically." },
      { q: "What does incontestable mean?", a: "After 5 years of continuous use and filing a Section 15 declaration, your mark becomes incontestable — meaning certain legal challenges to it are no longer available. This significantly strengthens your trademark rights." },
      { q: "Can someone oppose my trademark?", a: "Yes. After the USPTO approves your application, it publishes in the Official Gazette for 30 days. During that window, any third party who believes they would be harmed by your registration can file an opposition with the TTAB." },
    ],
  },
  {
    category: "Costs",
    questions: [
      { q: "What are USPTO filing fees?", a: "USPTO fees are government fees paid directly to the U.S. Patent and Trademark Office — separate from our service fee. The base application fee is $350/class (as of January 2025). Statement of Use is $150/class. Section 8 & 9 renewals are $325/class." },
      { q: "What is the total cost to register a trademark?", a: "For a single-class application with attorney filing: $399 (our fee) + $350 (USPTO fee) = $749 minimum. If you need a Statement of Use later, add $249 + $150/class. Total for a smooth single-class registration: approximately $900–$1,100." },
      { q: "Why is your attorney filing cheaper than competitors?", a: "We built our own AI-powered workflow that reduces the time attorneys spend on intake, class identification, and goods & services drafting. We pass those savings to clients. Same licensed attorney, lower overhead." },
    ],
  },
];

export default function FAQ() {
  const router = useRouter();
  const [openItem, setOpenItem] = useState(null);

  return (
    <>
      <Head>
        <title>FAQ — MarkItNow.ai</title>
        <meta name="description" content="Frequently asked questions about trademark registration, USPTO filing fees, Office Actions, and renewals." />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "Poppins, sans-serif" }}>

        {/* Nav */}
        <nav style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", height: 64 }}>
          <div onClick={() => router.push("/")} style={{ fontWeight: 900, fontSize: 22, color: "#111", letterSpacing: -0.5, cursor: "pointer" }}>
            MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span>
          </div>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {["How It Works", "Pricing"].map(item => (
              <span key={item} onClick={() => item === "Pricing" ? router.push("/pricing") : router.push("/how-it-works")} style={{ color: "#555", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>{item}</span>
            ))}
            <button onClick={() => router.push("/file")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>File Now</button>
          </div>
        </nav>

        {/* Hero */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "64px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "#111", lineHeight: 1.1, marginBottom: 16, letterSpacing: -1.5 }}>
            Frequently asked questions
          </h1>
          <p style={{ fontSize: 17, color: "#777", maxWidth: 480, margin: "0 auto" }}>
            Everything you need to know about trademark registration, USPTO fees, and the filing process.
          </p>
        </div>

        {/* FAQ Categories */}
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px" }}>
          {FAQS.map(category => (
            <div key={category.category} style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 4, height: 22, background: "#c9a84c", borderRadius: 2 }} />
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: 0 }}>{category.category}</h2>
                <div style={{ flex: 1, height: 1, background: "#e8e8e8" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {category.questions.map(({ q, a }, i) => {
                  const key = `${category.category}-${i}`;
                  const isOpen = openItem === key;
                  return (
                    <div key={q} onClick={() => setOpenItem(isOpen ? null : key)}
                      style={{ background: "#fff", border: `1px solid ${isOpen ? "#c9a84c" : "#e8e8e8"}`, borderRadius: 12, padding: "18px 22px", cursor: "pointer", transition: "border-color 0.15s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: 0 }}>{q}</h3>
                        <span style={{ color: "#c9a84c", fontSize: 20, fontWeight: 300, flexShrink: 0, marginLeft: 16 }}>{isOpen ? "−" : "+"}</span>
                      </div>
                      {isOpen && <p style={{ fontSize: 13, color: "#666", lineHeight: 1.8, margin: "14px 0 0" }}>{a}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background: "#111", padding: "64px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 12, letterSpacing: -0.5 }}>Still have questions?</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 28, fontSize: 15 }}>Start with a free search or reach out directly.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/")} style={{ background: "#c9a84c", color: "#111", border: "none", borderRadius: 10, padding: "14px 32px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              Search Free →
            </button>
            <button onClick={() => window.location.href = "mailto:legal@jarralslaw.com"} style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              Email Us
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#fff", borderTop: "1px solid #e0e0e0", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#111" }}>MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span></div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}><span onClick={() => router.push("/faq")} style={{ fontSize: 13, color: "#aaa", cursor: "pointer", fontWeight: 500 }}>FAQ</span><span style={{ fontSize: 12, color: "#bbb" }}>© 2026 MarkItNow.ai · Search and AI reports are informational only and do not constitute legal advice · Attorney filing services provided by licensed partner law firms</div>
        </div>
      </div>
    </>
  );
}
