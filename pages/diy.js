import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

const STEPS = [
  { id: 1, title: "Your Trademark", subtitle: "Tell us about your brand" },
  { id: 2, title: "Trademark Class", subtitle: "Find the right Nice class" },
  { id: 3, title: "Goods & Services", subtitle: "Describe what you offer" },
  { id: 4, title: "Filing Basis", subtitle: "Use vs. Intent-to-Use" },
  { id: 5, title: "Specimen", subtitle: "Proof of use in commerce" },
  { id: 6, title: "File on USPTO.gov", subtitle: "Step-by-step instructions" },
];

const NICE_CLASSES = [
  { num: 9, label: "Software, Apps, Electronics" },
  { num: 25, label: "Clothing, Footwear, Headwear" },
  { num: 35, label: "Business Services, Retail" },
  { num: 41, label: "Entertainment, Education, Events" },
  { num: 43, label: "Restaurants, Food & Drink Services" },
  { num: 3, label: "Cosmetics, Cleaning Products" },
  { num: 5, label: "Pharmaceuticals, Health Products" },
  { num: 16, label: "Paper Goods, Printed Materials" },
  { num: 18, label: "Leather Goods, Bags" },
  { num: 28, label: "Games, Toys, Sporting Goods" },
  { num: 32, label: "Beers, Non-Alcoholic Beverages" },
  { num: 33, label: "Alcoholic Beverages" },
  { num: 38, label: "Telecommunications, Streaming" },
  { num: 42, label: "Technology, SaaS, IT Services" },
  { num: 44, label: "Medical, Beauty, Agriculture Services" },
];

export default function DIY() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ mark: "", markType: "word", businessDescription: "", selectedClasses: [], goodsServices: "", basis: "", specimenType: "" });
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  function updateForm(key, val) { setForm(prev => ({ ...prev, [key]: val })); }
  function toggleClass(num) {
    setForm(prev => ({ ...prev, selectedClasses: prev.selectedClasses.includes(num) ? prev.selectedClasses.filter(c => c !== num) : [...prev.selectedClasses, num] }));
  }

  async function getAISuggestion(prompt, type) {
    setAiLoading(true);
    setAiSuggestion("");
    try {
      const response = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      setAiSuggestion(data.content?.[0]?.text || "");
    } catch (e) { setAiSuggestion("Unable to load suggestion. Please try again."); }
    setAiLoading(false);
  }

  function suggestClasses() {
    getAISuggestion(`I'm filing a trademark for "${form.mark}". My business: ${form.businessDescription}. 
    Which Nice trademark classes apply? List the class numbers and names, explain why each applies in 1 sentence. Be concise. Format as a simple list.`, "classes");
  }

  function suggestDescription() {
    const classes = form.selectedClasses.map(n => NICE_CLASSES.find(c => c.num === n)?.label).join(", ");
    getAISuggestion(`Write a USPTO-compliant goods and services description for trademark "${form.mark}". 
    Business: ${form.businessDescription}. Classes: ${classes}. 
    Use language from the USPTO ID Manual. Be specific. Keep under 200 words. Format as ready-to-paste text only, no explanation.`, "description");
  }

  const canNext = () => {
    if (step === 1) return form.mark.trim() && form.businessDescription.trim();
    if (step === 2) return form.selectedClasses.length > 0;
    if (step === 3) return form.goodsServices.trim();
    if (step === 4) return form.basis;
    if (step === 5) return form.basis === "itu" || form.specimenType;
    return true;
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <>
      <Head>
        <title>DIY Filing Guide — MarkItNow.ai</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: "100vh", background: "#f4f4f4", fontFamily: "Poppins, sans-serif" }}>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid #e0e0e0", background: "#fff" }}>
          <div onClick={() => router.push("/")} style={{ fontWeight: 900, fontSize: 24, color: "#111", letterSpacing: -0.5, cursor: "pointer" }}>
            MarkItNow<span style={{ color: "#555" }}>.ai</span>
          </div>
          <div style={{ fontSize: 13, color: "#999" }}>DIY Filing Guide · $69</div>
        </nav>

        <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px 80px" }}>

          {/* Progress */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              {STEPS.map(s => (
                <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: s.id < step ? "#7eb5e8" : s.id === step ? "#c9a84c" : "rgba(255,255,255,0.08)",
                    color: s.id <= step ? "#0a0a0a" : "rgba(255,255,255,0.3)",
                    fontSize: 13, fontWeight: 800, marginBottom: 6, transition: "all 0.3s",
                  }}>
                    {s.id < step ? "✓" : s.id}
                  </div>
                  <div style={{ fontSize: 10, color: s.id === step ? "#c9a84c" : "rgba(255,255,255,0.25)", fontWeight: 600, textAlign: "center", display: "block" }}>
                    {s.title}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 3, background: "#f4f4f4", borderRadius: 2, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #7eb5e8, #c9a84c)", borderRadius: 2, transition: "width 0.4s ease" }} />
            </div>
          </div>

          {/* Step Header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Step {step} of {STEPS.length}</div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: "#111", margin: "0 0 8px", letterSpacing: -1 }}>{STEPS[step - 1].title}</h1>
            <p style={{ fontSize: 16, color: "#888", margin: 0 }}>{STEPS[step - 1].subtitle}</p>
          </div>

          {/* STEP 1 — Your Trademark */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 10 }}>Your brand name or logo text</label>
                <input value={form.mark} onChange={e => updateForm("mark", e.target.value)} placeholder="e.g. PINEAPPLE SOL" style={{ width: "100%", background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, padding: "14px 18px", fontSize: 18, fontWeight: 800, color: "#111", fontFamily: "Poppins, sans-serif", boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 10 }}>What type of mark?</label>
                <div style={{ display: "flex", gap: 12 }}>
                  {[["word", "Word Mark", "Text only (most common)"], ["logo", "Logo / Design", "Image or stylized text"]].map(([val, label, sub]) => (
                    <div key={val} onClick={() => updateForm("markType", val)} style={{ flex: 1, padding: "16px 20px", borderRadius: 10, border: `1px solid ${form.markType === val ? "#c9a84c" : "rgba(255,255,255,0.1)"}`, background: form.markType === val ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.04)", cursor: "pointer" }}>
                      <div style={{ fontWeight: 800, color: form.markType === val ? "#c9a84c" : "#fff", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 12, color: "#999" }}>{sub}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 10 }}>Describe your business</label>
                <textarea value={form.businessDescription} onChange={e => updateForm("businessDescription", e.target.value)} placeholder="e.g. A breakfast and brunch restaurant serving Caribbean-inspired dishes in Washington DC" rows={4} style={{ width: "100%", background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, padding: "14px 18px", fontSize: 15, color: "#111", fontFamily: "Poppins, sans-serif", resize: "vertical", boxSizing: "border-box", outline: "none" }} />
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>The more detail you give, the better the AI guidance.</div>
              </div>
              <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#c9a84c", marginBottom: 6 }}>💡 Word marks are the strongest protection</div>
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>A word mark protects the text itself in any font or style. A logo mark only protects that specific design. Most attorneys recommend filing a word mark first.</div>
              </div>
            </div>
          )}

          {/* STEP 2 — Class Selection */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ fontSize: 14, color: "#888", marginBottom: 4 }}>Filing for</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#c9a84c" }}>{form.mark}</div>
                <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>{form.businessDescription}</div>
              </div>

              <button onClick={suggestClasses} disabled={aiLoading} style={{ background: "rgba(126,203,161,0.15)", border: "1px solid rgba(126,203,161,0.3)", borderRadius: 10, padding: "14px 20px", color: "#555", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                {aiLoading ? "⏳ AI is analyzing your business..." : "✨ Get AI Class Recommendations"}
              </button>

              {aiSuggestion && (
                <div style={{ background: "rgba(126,203,161,0.08)", border: "1px solid rgba(126,203,161,0.2)", borderRadius: 12, padding: "20px 24px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 12 }}>AI Recommendation</div>
                  <div style={{ fontSize: 14, color: "#555", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{aiSuggestion}</div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 14 }}>Select your class(es) — USPTO fee is $350 per class</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                  {NICE_CLASSES.map(cls => (
                    <div key={cls.num} onClick={() => toggleClass(cls.num)} style={{ padding: "12px 16px", borderRadius: 10, border: `1px solid ${form.selectedClasses.includes(cls.num) ? "#c9a84c" : "rgba(255,255,255,0.08)"}`, background: form.selectedClasses.includes(cls.num) ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.03)", cursor: "pointer", transition: "all 0.2s" }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: form.selectedClasses.includes(cls.num) ? "#c9a84c" : "rgba(255,255,255,0.4)", marginBottom: 3 }}>Class {cls.num}</div>
                      <div style={{ fontSize: 13, color: form.selectedClasses.includes(cls.num) ? "#fff" : "rgba(255,255,255,0.6)", fontWeight: 600 }}>{cls.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {form.selectedClasses.length > 0 && (
                <div style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 10, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 14, color: "#555" }}>{form.selectedClasses.length} class{form.selectedClasses.length > 1 ? "es" : ""} selected</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#c9a84c" }}>USPTO fee: ${form.selectedClasses.length * 350}</div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — Goods & Services */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, color: "#999", marginBottom: 4 }}>Selected classes</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#c9a84c" }}>
                  {form.selectedClasses.map(n => `Class ${n} — ${NICE_CLASSES.find(c => c.num === n)?.label}`).join(" · ")}
                </div>
              </div>

              <button onClick={suggestDescription} disabled={aiLoading} style={{ background: "rgba(126,203,161,0.15)", border: "1px solid rgba(126,203,161,0.3)", borderRadius: 10, padding: "14px 20px", color: "#555", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                {aiLoading ? "⏳ Writing your description..." : "✨ Generate USPTO-Compliant Description"}
              </button>

              {aiSuggestion && (
                <div style={{ background: "rgba(126,203,161,0.08)", border: "1px solid rgba(126,203,161,0.2)", borderRadius: 12, padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>AI Generated Description</div>
                    <button onClick={() => updateForm("goodsServices", aiSuggestion)} style={{ background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>Use This →</button>
                  </div>
                  <div style={{ fontSize: 14, color: "#555", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{aiSuggestion}</div>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 10 }}>Your goods & services description</label>
                <textarea value={form.goodsServices} onChange={e => updateForm("goodsServices", e.target.value)} placeholder="Paste or edit your description here..." rows={6} style={{ width: "100%", background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, padding: "14px 18px", fontSize: 14, color: "#111", fontFamily: "Poppins, sans-serif", resize: "vertical", boxSizing: "border-box", outline: "none", lineHeight: 1.7 }} />
              </div>

              <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#c9a84c", marginBottom: 6 }}>💡 Use ID Manual language when possible</div>
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>Using exact language from the USPTO ID Manual avoids a $200/class surcharge and speeds up examination. The AI description above is designed to match ID Manual language.</div>
              </div>
            </div>
          )}

          {/* STEP 4 — Filing Basis */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ fontSize: 15, color: "#666", lineHeight: 1.7 }}>
                Your filing basis tells the USPTO whether you're already using the mark in commerce or plan to use it in the future.
              </div>

              {[
                {
                  val: "use",
                  label: "Section 1(a) — Use in Commerce",
                  subtitle: "I'm already using this mark on products/services sold to customers",
                  detail: "You must have already used the mark in commerce between states or internationally. You'll need a specimen (proof of use) to file. This is the faster path to registration.",
                  good: "Best if your business is already operating",
                },
                {
                  val: "itu",
                  label: "Section 1(b) — Intent to Use",
                  subtitle: "I plan to use this mark but haven't started yet",
                  detail: "You can file before you launch. You'll get a priority date immediately but must file a Statement of Use ($150/class) once you start using the mark. You have up to 3 years to file the SOU.",
                  good: "Best if you're launching soon or want to lock in your date",
                },
              ].map(opt => (
                <div key={opt.val} onClick={() => updateForm("basis", opt.val)} style={{ padding: "24px", borderRadius: 14, border: `1px solid ${form.basis === opt.val ? "#c9a84c" : "rgba(255,255,255,0.1)"}`, background: form.basis === opt.val ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.04)", cursor: "pointer", transition: "all 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${form.basis === opt.val ? "#c9a84c" : "rgba(255,255,255,0.2)"}`, background: form.basis === opt.val ? "#c9a84c" : "transparent", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {form.basis === opt.val && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0a0a0a" }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: form.basis === opt.val ? "#c9a84c" : "#fff", marginBottom: 4 }}>{opt.label}</div>
                      <div style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>{opt.subtitle}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 10 }}>{opt.detail}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>✓ {opt.good}</div>
                    </div>
                  </div>
                </div>
              ))}

              {form.basis === "itu" && (
                <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "16px 20px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#c9a84c", marginBottom: 6 }}>📋 ITU reminder</div>
                  <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>You'll skip the specimen step for now. After USPTO approves your application, you'll file a Statement of Use ($249 our fee + $150 USPTO fee) to complete registration. We can help you with that when the time comes.</div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5 — Specimen */}
          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {form.basis === "itu" ? (
                <div style={{ background: "rgba(126,203,161,0.08)", border: "1px solid rgba(126,203,161,0.2)", borderRadius: 14, padding: "32px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#555", marginBottom: 12 }}>No specimen needed yet</div>
                  <div style={{ fontSize: 15, color: "#777", lineHeight: 1.7 }}>Since you're filing Intent-to-Use, you don't need a specimen now. You'll submit one later when you file your Statement of Use after you launch your business.</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 15, color: "#666", lineHeight: 1.7 }}>
                    A specimen is proof that you're using the trademark in commerce. The USPTO requires one for use-based applications. Choose the type that matches your business:
                  </div>

                  {[
                    { val: "website", label: "Website Screenshot", detail: "A screenshot of your website showing the mark used with your goods/services. The mark must appear near a way to purchase or order. Most common specimen type.", ok: "Products, services, apps, restaurants" },
                    { val: "label", label: "Product Label / Tag", detail: "A photo of the actual label, hang tag, or packaging showing the trademark. The mark must be on the goods themselves or their packaging.", ok: "Physical products, food, clothing, beverages" },
                    { val: "menu", label: "Menu or Signage", detail: "A photo of a physical menu, store sign, or banner displaying the mark in connection with services.", ok: "Restaurants, retail stores, service businesses" },
                    { val: "social", label: "Social Media / Digital Ad", detail: "A screenshot of a social media page or digital advertisement showing the mark used to sell goods/services. Must show the mark + offering together.", ok: "Online businesses, apps, digital services" },
                  ].map(opt => (
                    <div key={opt.val} onClick={() => updateForm("specimenType", opt.val)} style={{ padding: "20px 24px", borderRadius: 14, border: `1px solid ${form.specimenType === opt.val ? "#c9a84c" : "rgba(255,255,255,0.1)"}`, background: form.specimenType === opt.val ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.04)", cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: form.specimenType === opt.val ? "#c9a84c" : "#fff", marginBottom: 6 }}>{opt.label}</div>
                          <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 8 }}>{opt.detail}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>✓ Good for: {opt.ok}</div>
                        </div>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${form.specimenType === opt.val ? "#c9a84c" : "rgba(255,255,255,0.2)"}`, background: form.specimenType === opt.val ? "#c9a84c" : "transparent", flexShrink: 0, marginLeft: 16 }} />
                      </div>
                    </div>
                  ))}

                  {form.specimenType && (
                    <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "16px 20px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#c9a84c", marginBottom: 6 }}>📸 What to prepare</div>
                      <div style={{ fontSize: 13, color: "#888", lineHeight: 1.7 }}>
                        {form.specimenType === "website" && "Take a screenshot of your website showing your trademark name/logo near a 'buy now', 'order', or 'book' button. Save as JPG or PNG under 5MB."}
                        {form.specimenType === "label" && "Take a clear photo of the product label or packaging showing your trademark. The mark must be legible. Save as JPG or PNG under 5MB."}
                        {form.specimenType === "menu" && "Take a photo of your physical menu or signage clearly showing your trademark. Good lighting, mark must be readable. Save as JPG or PNG under 5MB."}
                        {form.specimenType === "social" && "Take a screenshot of your social media profile or ad showing the trademark used to promote your goods/services. Must show the mark + what you're offering. Save as JPG or PNG under 5MB."}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 6 — File on USPTO */}
          {step === 6 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Summary Card */}
              <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 14, padding: "24px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#c9a84c", marginBottom: 16 }}>Your Application Summary</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    ["Mark", form.mark],
                    ["Type", form.markType === "word" ? "Word Mark" : "Logo / Design Mark"],
                    ["Classes", form.selectedClasses.map(n => `Class ${n}`).join(", ")],
                    ["Basis", form.basis === "use" ? "Section 1(a) — Use in Commerce" : "Section 1(b) — Intent to Use"],
                    ["USPTO Fee", `$${form.selectedClasses.length * 350} (${form.selectedClasses.length} class${form.selectedClasses.length > 1 ? "es" : ""} × $350)`],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                      <span style={{ fontSize: 13, color: "#999", minWidth: 80 }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111", textAlign: "right" }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step by step instructions */}
              <div style={{ fontSize: 16, fontWeight: 800, color: "#111", marginTop: 8 }}>How to file on USPTO.gov</div>

              {[
                { num: 1, title: "Go to the TEAS filing system", body: "Visit teas.uspto.gov and click 'File a new application'. Create a USPTO.gov account if you don't have one (free)." },
                { num: 2, title: "Select 'TEAS — Base Application'", body: "This is the standard electronic filing option at $350/class. Do not select the paper option ($850/class)." },
                { num: 3, title: "Enter your mark", body: `Type your mark exactly as: "${form.mark}". ${form.markType === "logo" ? "For a logo mark, you'll upload your image file (JPG or PNG)." : "For a word mark, select 'Standard Characters' — this gives you the broadest protection."}` },
                { num: 4, title: `Select Class${form.selectedClasses.length > 1 ? "es" : ""} ${form.selectedClasses.join(", ")}`, body: "Use the dropdown to select your class(es). For each class, paste your goods/services description from Step 3 of this guide." },
                { num: 5, title: `Select Filing Basis`, body: form.basis === "use" ? "You'll be asked to provide your first use date and first use in commerce date. Enter the date you first used the mark to sell goods/services." : "Select Intent to Use. You won't need a specimen now. You'll file a Statement of Use later after you launch." },
                ...(form.basis === "use" ? [{ num: 6, title: "Upload your specimen", body: `Upload your ${form.specimenType === "website" ? "website screenshot" : form.specimenType === "label" ? "product label photo" : form.specimenType === "menu" ? "menu or signage photo" : "social media screenshot"} as a JPG or PNG under 5MB. Add a brief description of what the image shows.` }] : []),
                { num: form.basis === "use" ? 7 : 6, title: "Review and pay", body: `Review everything carefully. The USPTO fee is $${form.selectedClasses.length * 350} (${form.selectedClasses.length} class${form.selectedClasses.length > 1 ? "es" : ""} × $350). Pay by credit card. You'll get a confirmation email with your serial number immediately.` },
              ].map(item => (
                <div key={item.num} style={{ display: "flex", gap: 16, padding: "20px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#c9a84c", color: "#0a0a0a", fontWeight: 900, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.num}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 6 }}>{item.title}</div>
                    <div style={{ fontSize: 14, color: "#777", lineHeight: 1.7 }}>{item.body}</div>
                  </div>
                </div>
              ))}

              {/* What happens after */}
              <div style={{ background: "rgba(126,203,161,0.08)", border: "1px solid rgba(126,203,161,0.2)", borderRadius: 14, padding: "24px", marginTop: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#555", marginBottom: 16 }}>What happens after you file</div>
                {[
                  ["1–3 days", "You receive a filing receipt with your serial number. Your priority date is locked in."],
                  ["3–4 months", "USPTO assigns an examining attorney who reviews your application."],
                  ["4–6 months", "You either receive approval or an Office Action (objection). Most first-time applicants get at least one OA."],
                  ["~12 months", "If approved, your mark publishes for opposition for 30 days."],
                  ["~13–18 months", "If no opposition, your mark registers. You receive your certificate."],
                ].map(([time, desc]) => (
                  <div key={time} style={{ display: "flex", gap: 16, marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#555", minWidth: 90, paddingTop: 2 }}>{time}</div>
                    <div style={{ fontSize: 13, color: "#777", lineHeight: 1.6 }}>{desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#c9a84c", marginBottom: 8 }}>Got an Office Action?</div>
                <div style={{ fontSize: 13, color: "#777", lineHeight: 1.6, marginBottom: 14 }}>Don't panic — they're common. Our attorney can draft a response starting at $499. Contact us within 30 days of receiving your OA.</div>
                <button onClick={() => window.location.href = "mailto:legal@jarralslaw.com?subject=Office Action Response"} style={{ background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                  Get OA Help →
                </button>
              </div>

              <a href="https://teas.uspto.gov" target="_blank" rel="noopener noreferrer" style={{ display: "block", background: "#7eb5e8", color: "#0a0a0a", border: "none", borderRadius: 12, padding: "18px", fontWeight: 900, fontSize: 16, cursor: "pointer", fontFamily: "Poppins, sans-serif", textAlign: "center", textDecoration: "none", marginTop: 8 }}>
                File on USPTO.gov Now →
              </a>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button onClick={() => setStep(s => Math.max(1, s - 1))} style={{ background: "transparent", border: "1px solid #e0e0e0", borderRadius: 10, padding: "12px 24px", color: "#666", fontWeight: 700, fontSize: 14, cursor: step === 1 ? "not-allowed" : "pointer", opacity: step === 1 ? 0.3 : 1, fontFamily: "Poppins, sans-serif" }} disabled={step === 1}>
              ← Back
            </button>
            {step < STEPS.length ? (
              <button onClick={() => canNext() && setStep(s => s + 1)} style={{ background: canNext() ? "#c9a84c" : "rgba(255,255,255,0.08)", color: canNext() ? "#0a0a0a" : "rgba(255,255,255,0.3)", border: "none", borderRadius: 10, padding: "12px 32px", fontWeight: 900, fontSize: 14, cursor: canNext() ? "pointer" : "not-allowed", fontFamily: "Poppins, sans-serif", transition: "all 0.2s" }}>
                Continue →
              </button>
            ) : (
              <button onClick={() => router.push("/")} style={{ background: "#7eb5e8", color: "#0a0a0a", border: "none", borderRadius: 10, padding: "12px 32px", fontWeight: 900, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                Back to Home
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
