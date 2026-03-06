import Nav from "../components/Nav";
import ChatWidget from "../components/ChatWidget";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

const FAQS = [
  {
    category: "Trademark Basics",
    questions: [
      { q: "What is a trademark and why do I need one?", a: "A trademark is a word, name, logo, slogan, or symbol that identifies the source of your goods or services and distinguishes your brand from competitors. Federal trademark registration with the USPTO gives you nationwide exclusive rights, the legal presumption of ownership, the ability to use the ® symbol, and the right to sue for infringement in federal court. Without a registered trademark, your brand name, logo, or slogan is vulnerable to copying, imitation, and legal challenges from competitors." },
      { q: "What is the difference between a trademark, copyright, and patent?", a: "A trademark protects brand identifiers like names, logos, and slogans used in commerce. A copyright protects original creative works like music, art, writing, and software automatically upon creation. A patent protects inventions and functional innovations. Many businesses need all three for example, a music festival might trademark its name and logo, copyright its original artwork and music, and patent any proprietary technology it develops." },
      { q: "What is the difference between ™ and ®?", a: "The ™ symbol can be used on any mark you claim rights in, even before filing a USPTO trademark application. The ® symbol (registered trademark) can only be used after the USPTO officially registers your mark. Using ® without a federal registration is a federal offense that can result in your trademark application being refused. Once registered, always use ® it puts competitors on notice and strengthens your legal position." },
      { q: "Can I trademark a name, logo, slogan, or color?", a: "Yes trademarks can protect words, names, logos, slogans, sounds, colors, product shapes, and even scents if they function as brand identifiers. The most common trademark applications cover brand names (word marks), logos and design marks, and taglines. Color trademarks are rare but possible Tiffany blue and UPS brown are famous examples. The key requirement is that the mark must be distinctive and used in commerce to identify your goods or services." },
      { q: "What makes a strong trademark?", a: "Trademark strength falls on a spectrum from strongest to weakest: Fanciful marks (invented words like KODAK or XEROX) are the strongest. Arbitrary marks (real words applied to unrelated goods, like APPLE for computers) are very strong. Suggestive marks (hinting at qualities without describing them, like NETFLIX) are strong. Descriptive marks (directly describing the product) are weak and often refused. Generic terms can never be trademarked. The stronger your mark, the broader the protection you receive." },
    ],
  },
  {
    category: "Trademark Search",
    questions: [
      { q: "How do I search for existing trademarks before filing?", a: "You should search the USPTO's TESS database (Trademark Electronic Search System), which contains all active and many inactive federal trademark registrations. A thorough trademark clearance search includes: (1) identical mark searches, (2) phonetic equivalents and alternative spellings, (3) foreign language equivalents, (4) design mark searches if you have a logo, and (5) common law searches beyond the USPTO database including Google, social media, and domain registrations. MarkItNow runs multiple parallel searches against the live USPTO database for free." },
      { q: "What is a likelihood of confusion analysis?", a: "Likelihood of confusion is the primary legal standard for trademark refusal and infringement. The USPTO examiner applies the DuPont factors a 13-factor test that weighs the similarity of the marks in appearance, sound, and meaning; the relatedness of the goods and services; the channels of trade; the sophistication of buyers; and other factors. Two marks don't need to be identical to create a likelihood of confusion phonetic similarity, similar trade dress, or overlapping goods and services can all trigger a refusal. Our AI Analysis Report applies all 13 DuPont factors to your mark for $99." },
      { q: "What are the 13 DuPont factors for trademark analysis?", a: "The DuPont factors are: (1) similarity of the marks in appearance, sound, and meaning; (2) similarity of the goods/services; (3) similarity of the trade channels; (4) buyer sophistication; (5) fame of the prior mark; (6) number of similar marks in use; (7) actual confusion evidence; (8) length of time without confusion; (9) variety of goods covered; (10) market interface between applicants; (11) applicant's right to exclude; (12) potential for confusion; and (13) any other relevant factors. Our AI Analysis Report evaluates all 13 factors and provides a risk score for your specific mark." },
      { q: "What happens if someone has a similar trademark already registered?", a: "If a confusingly similar mark is already registered for related goods or services, your application may be refused by the USPTO examining attorney. You have options: (1) respond to the office action arguing there is no likelihood of confusion, (2) amend your goods and services description to avoid overlap, (3) seek consent from the existing registrant, (4) consider rebranding to a mark with a clearer path to registration, or (5) file an opposition or cancellation if the existing registration is vulnerable. Our attorneys can advise on the best strategy." },
    ],
  },
  {
    category: "Filing a Trademark Application",
    questions: [
      { q: "How do I file a trademark application with the USPTO?", a: "Trademark applications are filed through the USPTO's TEAS (Trademark Electronic Application System) at teas.uspto.gov. You'll need: your mark (word or design), the owner's legal name and address, the goods and services you want to cover, the Nice classification class(es), a filing basis (use in commerce or intent to use), and payment of the USPTO filing fee ($350 per class). MarkItNow offers three paths: free DIY guidance, AI-assisted DIY filing ($69), or full attorney-filed application ($399 + USPTO fees)." },
      { q: "What is TEAS Plus vs TEAS Standard?", a: "TEAS Plus and TEAS Standard are both USPTO online filing options at $350 per class (as of January 18, 2025). The key difference is that TEAS Plus requires you to use pre-approved identification language from the USPTO ID Manual for your goods and services description. Using custom or free-form identification language triggers a $200/class surcharge. Our AI automatically drafts USPTO ID Manual-compliant descriptions to avoid this surcharge." },
      { q: "What is a Nice classification and how many classes do I need?", a: "The Nice Classification is the international system dividing goods and services into 45 classes. Each USPTO trademark application requires you to identify which classes cover your business. Class 25 covers clothing, Class 35 covers business services and retail, Class 41 covers entertainment and education, Class 43 covers restaurants and food services, and so on. You pay $350 per class to the USPTO. Most small businesses need 1 to 3 classes. Our AI automatically identifies the right classes for your business based on your description." },
      { q: "What is Section 1(a) vs Section 1(b) trademark filing?", a: "Section 1(a) Use in Commerce means you are already using the mark in interstate commerce on the goods or services listed in your application. You must submit a specimen showing current use. Section 1(b) Intent to Use means you have a bona fide intention to use the mark but haven't started yet. No specimen is required at filing, but you must file a Statement of Use ($150 USPTO fee + $249 our fee) after you begin commercial use, within 6 months of your Notice of Allowance (extendable up to 3 years)." },
      { q: "What is a specimen and what qualifies?", a: "A specimen is evidence showing your trademark being used in commerce to identify your goods or services. For goods, acceptable specimens include product labels, tags, product packaging, and website screenshots showing the mark with an active purchase option. For services, acceptable specimens include website screenshots, advertisements, brochures, and menus. Screenshots must show the mark and the services offered a standalone logo without context is not acceptable. The specimen must be in use as of the filing date for Section 1(a) applications." },
      { q: "Is there a hidden $200 fee I should know about before filing?", a: "Yes, and most filers never see it coming. Since January 2025, the USPTO charges an extra $200 per class any time an applicant describes their goods or services using free-form text instead of selecting from the USPTO's pre-approved ID Manual. That means a two-class application filed the wrong way costs $400 more than it should. A three-class application costs $600 more. Many DIY filers and even some filing services trigger this fee without realizing it. At MarkItNow, every attorney-filed application uses pre-approved ID Manual language, so you never pay this surcharge. It is one of the reasons our Attorney-Filed Application is priced at $399, less than what most filing services charge before the hidden fees hit." },
      { q: "How long does it take to register a trademark?", a: "The USPTO trademark registration timeline typically runs 13 to 18 months for a straightforward application: 1 to 3 days for filing receipt and serial number; 3 to 4 months for examiner assignment and review; 4 to 6 months for initial approval or Office Action; approximately 12 months for publication in the Official Gazette; 30-day opposition period; and approximately 13 to 18 months total for certificate of registration. Complex applications with Office Actions or oppositions can take significantly longer." },
    ],
  },
  {
    category: "USPTO Office Actions",
    questions: [
      { q: "What is a USPTO Office Action?", a: "A USPTO Office Action is an official letter from a trademark examining attorney raising legal objections to your trademark application. Office Actions are extremely common the USPTO issues them in roughly 70% of applications. They must be responded to within 3 months of the issue date (extendable to 6 months for a fee). Failure to respond results in abandonment of your application. Common Office Action grounds include likelihood of confusion with existing marks, mere descriptiveness, failure to function as a trademark, and specimen issues." },
      { q: "What are the most common reasons for trademark refusal?", a: "The most common USPTO trademark refusals are: (1) Likelihood of confusion with an existing registered mark under Section 2(d); (2) Mere descriptiveness the mark directly describes the goods or services under Section 2(e)(1); (3) Primarily merely a surname under Section 2(e)(4); (4) Deceptive or deceptively misdescriptive marks; (5) Geographically descriptive marks; (6) Specimen issues the submitted specimen doesn't show proper use; and (7) Identification of goods/services issues descriptions that are too vague or broad. Our AI Analysis Report flags these risks before you file." },
      { q: "How do I respond to a trademark Office Action?", a: "Responding to a USPTO Office Action requires a written legal argument submitted through TEAS within the response deadline. Your response must address every ground of refusal raised by the examiner. Depending on the refusal, you may argue that there is no likelihood of confusion, submit evidence of acquired distinctiveness, amend your goods and services description, submit a new specimen, or disclaim a descriptive term. Office Action responses require legal knowledge and strategic judgment our partner attorneys handle responses starting at $499." },
      { q: "Can an abandoned trademark application be revived?", a: "Yes, an abandoned trademark application can sometimes be revived. If your application was abandoned due to a failure to respond to an Office Action, you can file a Petition to Revive on grounds of unintentional abandonment within 2 months of the abandonment notice (or sometimes up to 6 months). The petition must include a declaration of unintentional delay and payment of the USPTO petition fee. Revival is time-sensitive contact us immediately if your application has been abandoned. Our revival service starts at $349." },
    ],
  },
  {
    category: "Trademark Maintenance & Renewal",
    questions: [
      { q: "How do I maintain my trademark registration after it is granted?", a: "Federal trademark registrations require periodic maintenance filings or they will be cancelled. Between years 5 and 6 after registration: file a Section 8 Declaration of Continued Use (showing the mark is still in use) and optionally a Section 15 Declaration of Incontestability. Between years 9 and 10, and every 10 years after: file a Section 9 Renewal Application. Missing these deadlines permanently cancels your registration with no way to reinstate it. Our Portfolio Monitor ($49/year per mark) tracks all deadlines automatically." },
      { q: "What is a Section 8 Declaration and Section 15 Declaration?", a: "A Section 8 Declaration is a sworn statement filed between years 5 to 6 of registration confirming the mark is still in active commercial use. Failure to file cancels the registration. A Section 15 Declaration of Incontestability, filed concurrently with Section 8, makes your trademark registration immune to most legal challenges after 5 years of continuous use. Combined, they significantly strengthen your trademark rights. The USPTO fee for Section 8 is $225/class and Section 15 is $250/class. Our fee for both is $199." },
      { q: "What is trademark incontestability and why does it matter?", a: "After 5 years of continuous use following registration and filing a Section 15 Declaration, your trademark becomes incontestable. This means third parties can no longer challenge your mark on grounds of descriptiveness or lack of distinctiveness two of the most common bases for trademark challenges. Incontestability is a powerful legal shield that strengthens your ability to enforce your trademark rights against infringers and defend against cancellation proceedings at the TTAB." },
      { q: "What happens if someone opposes my trademark during publication?", a: "After USPTO approval, your trademark publishes in the Official Gazette for 30 days. During this window, any party who believes they would be damaged by your registration can file a Notice of Opposition with the Trademark Trial and Appeal Board (TTAB). An opposition proceeding resembles a mini lawsuit both sides can conduct discovery and submit evidence. Opposition proceedings can take 1 to 3 years to resolve. If you receive a notice of opposition, consult a trademark attorney immediately." },
    ],
  },
  {
    category: "Costs & Pricing",
    questions: [
      { q: "How much does it cost to trademark a name or logo?", a: "The total cost to trademark a name or logo includes our service fee plus USPTO government fees. Attorney-filed application: $399 (our fee) + $350/class (USPTO) = $749+ per class. DIY guided filing: $69 (our fee) + $350/class (USPTO) = $419+ per class. For a smooth single-class registration with no issues, budget $750 to $1,100 total including potential Statement of Use fees. Multi-class applications multiply the USPTO fee by the number of classes. We always show you the exact total before you pay." },
      { q: "What are USPTO trademark filing fees in 2025?", a: "As of January 18, 2025, USPTO trademark filing fees are: TEAS application (Sections 1 & 44): $350/class. Custom identification surcharge: $200/class extra. Statement of Use / Amendment to Allege Use: $150/class. Extension of time to file Statement of Use: $125/class per extension. Section 8 Declaration: $225/class. Section 15 Declaration: $250/class. Section 9 Renewal: $325/class. Petition to Revive: $150. These are government fees paid directly to the USPTO, separate from any attorney or service fees." },
      { q: "Is it cheaper to file a trademark myself or use an attorney?", a: "Filing yourself costs $350/class in USPTO fees with no service fee but mistakes are costly. A rejected application still costs the full filing fee with no refund. Common DIY mistakes include poor identification of goods and services (triggering a $200/class surcharge), wrong filing basis, inadequate specimens, and missed deadlines that result in abandonment. Our attorney filing at $399 + USPTO fees provides professional review, strategic class identification, USPTO-compliant descriptions, and ongoing monitoring significantly reducing the risk of refusal or abandonment." },
    ],
  },
];

export default function FAQ() {
  const router = useRouter();
  const [openItem, setOpenItem] = useState(null);

  const allQuestions = FAQS.flatMap(c => c.questions);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allQuestions.map(({ q, a }) => ({
      "@type": "Question",
      "name": q,
      "acceptedAnswer": { "@type": "Answer", "text": a }
    }))
  };

  return (
    <>
      <Head>
        <title>Trademark FAQ How to Register, File & Protect Your Brand | MarkItNow.ai</title>
        <meta name="description" content="Answers to the most common trademark questions USPTO filing fees, likelihood of confusion, Office Actions, Nice classes, TEAS Plus, renewals, and more." />
        <meta name="keywords" content="trademark registration, USPTO filing, trademark search, likelihood of confusion, DuPont factors, TEAS Plus, trademark Office Action, trademark renewal, how to trademark a name, trademark cost 2025" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </Head>


      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .page-hero { padding: 48px 20px !important; }
          .page-hero h1 { font-size: 32px !important; letter-spacing: -1px !important; }
          .page-hero p { font-size: 15px !important; }
          .content-wrap { padding: 32px 16px !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .three-col { grid-template-columns: 1fr !important; }
          .footer { flex-direction: column !important; gap: 12px !important; padding: 24px 20px !important; text-align: center !important; }
          .footer-right { flex-direction: column !important; gap: 8px !important; align-items: center !important; }
          .cta-buttons { flex-direction: column !important; align-items: stretch !important; }
          .cta-buttons button { width: 100% !important; }
          .faq-card { padding: 14px 16px !important; }
          .pricing-card { padding: 24px 20px !important; }
          .step-card { padding: 20px 16px !important; }
          table { font-size: 12px !important; }
          table td, table th { padding: 10px 12px !important; }
          .stats-bar { flex-direction: column !important; gap: 24px !important; padding: 32px 20px !important; }
          .hiw-faq-card { flex-direction: column !important; gap: 16px !important; padding: 24px 20px !important; }
          .hiw-faq-card button { width: 100% !important; margin-left: 0 !important; }
        }
      `}</style>
      <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "Poppins, sans-serif" }}>
        <Nav />

        {/* Hero */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "64px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "#111", lineHeight: 1.1, marginBottom: 16, letterSpacing: -1.5 }}>
            Trademark FAQ
          </h1>
          <p style={{ fontSize: 17, color: "#777", maxWidth: 560, margin: "0 auto" }}>
            Everything you need to know about trademark registration, USPTO filing fees, Office Actions, likelihood of confusion, and protecting your brand.
          </p>
        </div>

        {/* FAQ Categories */}
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "56px 24px 80px" }}>
          {FAQS.map(category => (
            <div key={category.category} style={{ marginBottom: 52 }}>
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
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: 0, paddingRight: 16, lineHeight: 1.5 }}>{q}</h3>
                        <span style={{ color: "#c9a84c", fontSize: 20, fontWeight: 300, flexShrink: 0 }}>{isOpen ? "−" : "+"}</span>
                      </div>
                      {isOpen && <p style={{ fontSize: 13, color: "#666", lineHeight: 1.9, margin: "14px 0 0" }}>{a}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background: "#111", padding: "64px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 12, letterSpacing: -0.5 }}>Ready to protect your trademark?</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 28, fontSize: 15 }}>Search the USPTO database free. No account required.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/")} style={{ background: "#c9a84c", color: "#111", border: "none", borderRadius: 10, padding: "14px 32px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              Search Free →
            </button>
            <button onClick={() => router.push("/pricing")} style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
              View Pricing
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#fff", borderTop: "1px solid #e0e0e0", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#111" }}>MarkItNow<span style={{ color: "#c9a84c" }}>.ai</span></div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <span onClick={() => router.push("/how-it-works")} style={{ fontSize: 13, color: "#aaa", cursor: "pointer", fontWeight: 500 }}>How It Works</span>
            <span style={{ fontSize: 12, color: "#bbb" }}>© 2026 MarkItNow.ai · Search and AI reports are informational only and do not constitute legal advice · Attorney filing services provided by licensed partner law firms</span>
          </div>
        </div>
      </div>
      <ChatWidget />
    </>
  );
}