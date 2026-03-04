import ChatWidget from "../components/ChatWidget";
import { useState, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

const STEPS = ["mark", "owner", "goods", "basis", "review"];
const STEP_LABELS = {
  mark: "The Mark", owner: "Owner Info", goods: "Goods & Services",
  basis: "Filing Basis", review: "AI Analysis & Filing Packet",
};

const initialForm = {
  markText: "", markType: "standard", markDescription: "",
  ownerName: "", ownerEntity: "LLC", ownerState: "", ownerCountry: "United States",
  ownerAddress: "", ownerCity: "", ownerStateAddr: "", ownerZip: "",
  gsDescription: "", basis: "1b", firstUseDate: "", firstUseCommerceDate: "",
  specimenDescription: "",
};

const inputStyle = {
  width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0",
  borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: "Poppins, sans-serif",
  color: "#111", background: "#fff", outline: "none",
};

const textareaStyle = {
  ...inputStyle, minHeight: 100, resize: "vertical", lineHeight: 1.6,
};

const selectStyle = {
  ...inputStyle, cursor: "pointer",
};

function Field({ label, sublabel, required, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#333", marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#e53e3e" }}>*</span>}
        {sublabel && <span style={{ fontWeight: 400, color: "#999", fontSize: 11, marginLeft: 6 }}>{sublabel}</span>}
      </label>
      {children}
    </div>
  );
}

function StepIndicator({ current }) {
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 32 }}>
      {STEPS.map((s, i) => {
        const idx = STEPS.indexOf(current);
        const done = i < idx;
        const active = s === current;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: done ? "#111" : active ? "#c9a84c" : "#e8e8e8",
              color: done || active ? "#fff" : "#aaa",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800,
            }}>
              {done ? "✓" : i + 1}
            </div>
            <div style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? "#111" : "#aaa", marginLeft: 6, whiteSpace: "nowrap" }}>
              {STEP_LABELS[s].split(" & ")[0]}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: done ? "#111" : "#e0e0e0", margin: "0 8px" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function FilePage() {
  const router = useRouter();
  const { mark: initialMark } = router.query;
  const [step, setStep] = useState("mark");
  const [form, setForm] = useState({ ...initialForm, markText: initialMark || "" });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const analysisRef = useRef(null);
  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  async function runAnalysis() {
    setLoading(true); setError(null); setAnalysis(null);
    try {
      const res = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `You are a USPTO trademark attorney. Analyze this trademark application and respond ONLY with valid JSON (no markdown, no backticks):
{
  "niceClasses": [{ "class": 41, "className": "Entertainment and Education", "idLanguage": "Entertainment services, namely...", "fee": 350, "rationale": "Why this class applies" }],
  "totalFees": 700,
  "riskFlags": [{ "level": "HIGH", "category": "Descriptiveness", "issue": "Brief description", "recommendation": "Action to take" }],
  "disclaimers": ["Terms requiring disclaimer"],
  "specimenGuidance": "What specimen evidence is needed",
  "strengthAssessment": { "score": 75, "category": "Suggestive", "explanation": "Why this mark receives this rating" },
  "teasPlusEligible": true,
  "teasPlusNote": "Why eligible or not",
  "identificationSuggestion": "A single refined USPTO-acceptable identification string",
  "prosecutionTips": ["Practical tips"],
  "overallRecommendation": "One paragraph summary"
}

MARK: "${form.markText}" (${form.markType})
OWNER: ${form.ownerName} (${form.ownerEntity}, ${form.ownerState || form.ownerCountry})
GOODS/SERVICES: ${form.gsDescription}
BASIS: ${form.basis === "1a" ? "Section 1(a) Use in Commerce" : form.basis === "1b" ? "Section 1(b) Intent to Use" : "Section 44(d) Foreign Priority"}`
        }),
      });
      const data = await res.json();
      setAnalysis(JSON.parse((data.result || "").replace(/```json|```/g, "").trim()));
      setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) { setError("Analysis failed: " + e.message); }
    setLoading(false);
  }

  function downloadSummary() {
    if (!analysis) return;
    const lines = [
      `TRADEMARK FILING PACKET | MarkItNow.ai`,
      `Mark: ${form.markText} | Owner: ${form.ownerName} (${form.ownerEntity})`,
      `Basis: ${form.basis}`, "",
      "NICE CLASSES:",
    ];
    analysis.niceClasses?.forEach(nc => lines.push(`  Class ${nc.class}: ${nc.idLanguage} ($${nc.fee})`));
    lines.push("", `TOTAL USPTO FEES: $${analysis.totalFees}`, "", "IDENTIFICATION:", analysis.identificationSuggestion, "");
    lines.push("RISK FLAGS:");
    analysis.riskFlags?.forEach(r => lines.push(`  [${r.level}] ${r.category}: ${r.issue}\n  → ${r.recommendation}`));
    lines.push("", "SPECIMEN GUIDANCE:", analysis.specimenGuidance, "", "RECOMMENDATION:", analysis.overallRecommendation, "", "-".repeat(60), "MarkItNow.ai — Search and AI reports are informational only and do not constitute legal advice. Attorney filing services provided by licensed partner law firms.");
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `trademark-${form.markText.replace(/\s+/g, "-").toUpperCase()}.txt`;
    a.click();
  }

  function canProceed() {
    if (step === "mark") return form.markText.trim().length > 0;
    if (step === "owner") return form.ownerName.trim().length > 0;
    if (step === "goods") return form.gsDescription.trim().length > 20;
    return true;
  }

  function nextStep() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) {
      const next = STEPS[idx + 1];
      setStep(next);
      if (next === "review") runAnalysis();
    }
  }

  const riskColor = { HIGH: "#e53e3e", MEDIUM: "#dd6b20", LOW: "#38a169" };
  const riskBg = { HIGH: "#fff5f5", MEDIUM: "#fffaf0", LOW: "#f0fff4" };

  return (
    <>
      <Head>
        <title>File a Trademark — MarkItNow.ai</title>
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
              <span key={item} onClick={() => item === "Pricing" ? router.push("/pricing") : item === "How It Works" ? router.push("/how-it-works") : item === "FAQ" ? router.push("/faq") : null} style={{ color: "#555", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>{item}</span>
            ))}
            <button onClick={() => router.push("/file")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>File Now</button>
          </div>
        </nav>

        {/* Page header */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 4px", letterSpacing: -0.5 }}>USPTO Filing Intake</h1>
            <p style={{ fontSize: 13, color: "#999", margin: 0 }}>U.S. Licensed Attorney reviewed · $399 flat fee + USPTO fees</p>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[["$399", "Our fee"], ["$350/class", "USPTO fee"], ["~13mo", "Avg. timeline"]].map(([val, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#c9a84c" }}>{val}</div>
                <div style={{ fontSize: 11, color: "#aaa", fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
          <StepIndicator current={step} />

          <div style={{ background: "#fff", borderRadius: 16, padding: 36, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #e8e8e8" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: "#111" }}>{STEP_LABELS[step]}</h2>
            <p style={{ margin: "0 0 28px", color: "#999", fontSize: 13, lineHeight: 1.6 }}>
              {step === "mark" && "Enter the mark you want to register with the USPTO."}
              {step === "owner" && "Who owns this trademark? This becomes the applicant of record."}
              {step === "goods" && "Describe your goods or services in plain English. AI translates to USPTO-acceptable language."}
              {step === "basis" && "What is your legal basis for filing with the USPTO?"}
              {step === "review" && "AI analysis — Nice classes, risk flags, and filing strategy."}
            </p>

            {/* STEP: MARK */}
            {step === "mark" && (
              <>
                <Field label="Mark Text" required>
                  <input value={form.markText} onChange={set("markText")} placeholder="e.g. CITY OF GODS" style={inputStyle} />
                </Field>
                <Field label="Mark Type" required>
                  <select value={form.markType} onChange={set("markType")} style={selectStyle}>
                    <option value="standard">Standard Character Mark (words only)</option>
                    <option value="design">Special Form / Design Mark (logo with words)</option>
                    <option value="design-only">Design Only (no words)</option>
                  </select>
                </Field>
                {form.markType !== "standard" && (
                  <Field label="Mark Description" required>
                    <textarea value={form.markDescription} onChange={set("markDescription")} placeholder="Describe the design elements (colors, shapes, stylization)..." style={textareaStyle} />
                  </Field>
                )}
                <div style={{ background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 10, padding: 14, fontSize: 12, color: "#b8860b", lineHeight: 1.6 }}>
                  <strong>Standard Character marks</strong> are the most common and provide the broadest protection — covering any stylization of the words.
                </div>
              </>
            )}

            {/* STEP: OWNER */}
            {step === "owner" && (
              <>
                <Field label="Owner / Applicant Name" sublabel="Legal name of individual or entity" required>
                  <input value={form.ownerName} onChange={set("ownerName")} placeholder="e.g. Method Zero LLC" style={inputStyle} />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label="Entity Type" required>
                    <select value={form.ownerEntity} onChange={set("ownerEntity")} style={selectStyle}>
                      {["LLC", "Corporation", "Partnership", "Sole Proprietorship", "Individual", "Joint Venture"].map(e => <option key={e}>{e}</option>)}
                    </select>
                  </Field>
                  <Field label="State of Incorporation" sublabel="if U.S. entity">
                    <input value={form.ownerState} onChange={set("ownerState")} placeholder="e.g. New York" style={inputStyle} />
                  </Field>
                </div>
                <Field label="Street Address" required>
                  <input value={form.ownerAddress} onChange={set("ownerAddress")} placeholder="123 Main Street" style={inputStyle} />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                  <Field label="City" required><input value={form.ownerCity} onChange={set("ownerCity")} placeholder="New York" style={inputStyle} /></Field>
                  <Field label="State" required><input value={form.ownerStateAddr} onChange={set("ownerStateAddr")} placeholder="NY" style={inputStyle} /></Field>
                  <Field label="ZIP" required><input value={form.ownerZip} onChange={set("ownerZip")} placeholder="10001" style={inputStyle} /></Field>
                </div>
              </>
            )}

            {/* STEP: GOODS */}
            {step === "goods" && (
              <>
                <Field label="Goods & Services Description" sublabel="plain English — AI handles USPTO language" required>
                  <textarea value={form.gsDescription} onChange={set("gsDescription")} style={{ ...textareaStyle, minHeight: 120 }} placeholder="e.g. Music festival and events featuring emerging artists; merchandise including t-shirts and hats; online streaming of live performances..." />
                </Field>
                <div style={{ background: "#f9f9f9", border: "1px solid #e8e8e8", borderRadius: 10, padding: 14, fontSize: 12, color: "#777", lineHeight: 1.7 }}>
                  <strong style={{ color: "#111" }}>Tip:</strong> No need to use formal language. The AI identifies the right Nice classes and drafts compliant identification language automatically. Describe everything you do or plan to do with this brand.
                </div>
              </>
            )}

            {/* STEP: BASIS */}
            {step === "basis" && (
              <>
                <Field label="Filing Basis" required>
                  <select value={form.basis} onChange={set("basis")} style={selectStyle}>
                    <option value="1b">Section 1(b) — Intent to Use (not yet in commerce)</option>
                    <option value="1a">Section 1(a) — Use in Commerce (already in use)</option>
                    <option value="44d">Section 44(d) — Foreign Priority</option>
                  </select>
                </Field>
                {form.basis === "1a" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <Field label="First Use Anywhere" required><input type="date" value={form.firstUseDate} onChange={set("firstUseDate")} style={inputStyle} /></Field>
                      <Field label="First Use in Commerce" required><input type="date" value={form.firstUseCommerceDate} onChange={set("firstUseCommerceDate")} style={inputStyle} /></Field>
                    </div>
                    <Field label="Specimen Description">
                      <textarea value={form.specimenDescription} onChange={set("specimenDescription")} placeholder="e.g. Website screenshot showing the mark used in connection with event ticketing..." style={textareaStyle} />
                    </Field>
                  </>
                )}
                {form.basis === "1b" && (
                  <div style={{ background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 10, padding: 14, fontSize: 12, color: "#b8860b", lineHeight: 1.7 }}>
                    <strong>Intent to Use:</strong> Statement of Use must be filed within 6 months of Notice of Allowance. Extensions available up to 3 years total under 15 U.S.C. § 1051(d). USPTO fee: $100/class per extension.
                  </div>
                )}
                {form.basis === "44d" && (
                  <div style={{ background: "#fff8e6", border: "1px solid #f0d080", borderRadius: 10, padding: 14, fontSize: 12, color: "#b8860b", lineHeight: 1.7 }}>
                    <strong>Foreign Priority:</strong> Must have a pending foreign application filed within 6 months. Priority date is established by the foreign filing date under 15 U.S.C. § 1126(d).
                  </div>
                )}
              </>
            )}

            {/* STEP: REVIEW */}
            {step === "review" && (
              <div ref={analysisRef}>
                {loading && (
                  <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <div style={{ fontSize: 40, marginBottom: 14 }}>⚖️</div>
                    <div style={{ color: "#c9a84c", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Analyzing Application...</div>
                    <div style={{ color: "#aaa", fontSize: 13 }}>Identifying Nice classes · Assessing mark strength · Drafting identification</div>
                    <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 6 }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#c9a84c", animation: `pulse 1.2s ${i*0.2}s infinite ease-in-out` }} />)}
                    </div>
                    <style>{`@keyframes pulse{0%,80%,100%{transform:scale(0);opacity:.4}40%{transform:scale(1);opacity:1}}`}</style>
                  </div>
                )}
                {error && (
                  <div style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 10, padding: 14, color: "#e53e3e", fontSize: 13 }}>
                    {error} <button onClick={runAnalysis} style={{ marginLeft: 10, background: "#e53e3e", color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>Retry</button>
                  </div>
                )}
                {analysis && (
                  <div>
                    {/* Mark strength */}
                    <div style={{ background: "#f9f9f9", border: "1px solid #e8e8e8", borderRadius: 12, padding: 20, marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>Mark Strength</div>
                        <div style={{ fontWeight: 900, fontSize: 24, color: "#c9a84c" }}>{analysis.strengthAssessment?.score}/100</div>
                      </div>
                      <div style={{ fontWeight: 700, color: "#c9a84c", marginBottom: 6, fontSize: 14 }}>{analysis.strengthAssessment?.category}</div>
                      <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6, marginBottom: 12 }}>{analysis.strengthAssessment?.explanation}</div>
                      <div style={{ height: 6, background: "#e8e8e8", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${analysis.strengthAssessment?.score}%`, background: "#c9a84c", borderRadius: 3, transition: "width 0.8s ease" }} />
                      </div>
                    </div>

                    {/* Nice classes */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "#111", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                        Nice Classes
                        <span style={{ background: "#111", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 10 }}>{analysis.niceClasses?.length}</span>
                      </div>
                      {analysis.niceClasses?.map((nc, i) => (
                        <div key={i} style={{ border: "1px solid #e8e8e8", borderRadius: 10, padding: 14, marginBottom: 10, background: "#fff" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <div style={{ fontWeight: 700, color: "#111", fontSize: 13 }}>Class {nc.class}: {nc.className}</div>
                            <span style={{ background: "#fff8e6", color: "#b8860b", fontWeight: 700, fontSize: 12, padding: "2px 10px", borderRadius: 6 }}>${nc.fee}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#555", fontStyle: "italic", lineHeight: 1.6, marginBottom: 4 }}>{nc.idLanguage}</div>
                          <div style={{ fontSize: 11, color: "#aaa" }}>Why: {nc.rationale}</div>
                        </div>
                      ))}
                      <div style={{ textAlign: "right", fontWeight: 800, color: "#111", fontSize: 14, padding: "8px 0" }}>
                        Total USPTO Fees: <span style={{ color: "#c9a84c" }}>${analysis.totalFees}</span>
                        <span style={{ fontWeight: 400, fontSize: 11, color: "#aaa", marginLeft: 4 }}>(paid directly to USPTO)</span>
                      </div>
                    </div>

                    {/* Identification */}
                    <div style={{ background: "#f9f9f9", border: "1px solid #e8e8e8", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                      <div style={{ fontWeight: 700, color: "#111", marginBottom: 8, fontSize: 13 }}>Suggested TEAS Identification</div>
                      <div style={{ fontSize: 13, color: "#555", lineHeight: 1.8, fontFamily: "Georgia, serif" }}>{analysis.identificationSuggestion}</div>
                    </div>

                    {/* Risk flags */}
                    {analysis.riskFlags?.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "#111", marginBottom: 10 }}>Risk Flags</div>
                        {analysis.riskFlags.map((r, i) => (
                          <div key={i} style={{ background: riskBg[r.level], borderLeft: `4px solid ${riskColor[r.level]}`, borderRadius: "0 10px 10px 0", padding: 14, marginBottom: 10 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                              <span style={{ background: riskColor[r.level], color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 4 }}>{r.level}</span>
                              <span style={{ fontWeight: 700, color: "#111", fontSize: 13 }}>{r.category}</span>
                            </div>
                            <div style={{ fontSize: 13, color: "#444", marginBottom: 4 }}>{r.issue}</div>
                            <div style={{ fontSize: 12, color: "#38a169", fontWeight: 600 }}>→ {r.recommendation}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendation */}
                    <div style={{ background: "#111", borderRadius: 12, padding: 20, marginBottom: 20 }}>
                      <div style={{ color: "#c9a84c", fontWeight: 700, fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Attorney Recommendation</div>
                      <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.8 }}>{analysis.overallRecommendation}</div>
                    </div>

                    {/* TEAS Plus */}
                    {analysis.teasPlusEligible !== undefined && (
                      <div style={{ background: analysis.teasPlusEligible ? "#f0fff4" : "#fffaf0", borderRadius: 10, padding: 14, marginBottom: 20, border: `1px solid ${analysis.teasPlusEligible ? "#c6f6d5" : "#fbd38d"}` }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: analysis.teasPlusEligible ? "#38a169" : "#dd6b20", marginBottom: 4 }}>
                          {analysis.teasPlusEligible ? "✓ TEAS Plus Eligible (saves $100/class)" : "TEAS Standard Required"}
                        </div>
                        <div style={{ fontSize: 12, color: "#777" }}>{analysis.teasPlusNote}</div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 12 }}>
                      <button onClick={downloadSummary} style={{ flex: 1, padding: "14px", background: "#f4f4f4", color: "#111", border: "1px solid #e0e0e0", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                        Download Filing Packet
                      </button>
                      <button onClick={() => router.push(`/search?mark=${encodeURIComponent(form.markText)}`)} style={{ flex: 1, padding: "14px", background: "#111", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                        View Full Search Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nav buttons */}
          {step !== "review" && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <button onClick={() => step === "mark" ? router.push("/") : setStep(STEPS[STEPS.indexOf(step) - 1])}
                style={{ padding: "11px 24px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", color: "#111", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                Back
              </button>
              <button onClick={nextStep} disabled={!canProceed()}
                style={{ padding: "11px 28px", borderRadius: 8, border: "none", background: canProceed() ? "#c9a84c" : "#e8e8e8", color: canProceed() ? "#fff" : "#aaa", fontWeight: 700, fontSize: 14, cursor: canProceed() ? "pointer" : "not-allowed", fontFamily: "Poppins, sans-serif" }}>
                {STEPS.indexOf(step) === STEPS.length - 2 ? "Run AI Analysis →" : "Continue →"}
              </button>
            </div>
          )}
          {step === "review" && !loading && (
            <div style={{ marginTop: 20 }}>
              <button onClick={() => { setStep("basis"); setAnalysis(null); }}
                style={{ padding: "11px 24px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", color: "#111", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                ← Edit Application
              </button>
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: 40, fontSize: 12, color: "#bbb", lineHeight: 1.7 }}>
            © 2026 MarkItNow.ai · Search and AI reports are informational only and do not constitute legal advice · Attorney filing services provided by licensed partner law firms
          </div>
        </div>
      </div>
      <ChatWidget />
    </>
  );
}