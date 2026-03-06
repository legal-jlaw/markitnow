import { useState } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const G = {
  green: "#1a3c2e",
  greenLight: "#2d7a4f",
  greenMuted: "#6b8a78",
  greenBg: "#f4f7f5",
  greenBorder: "#d4e3d9",
  gold: "#c9a84c",
  goldBg: "#fdf8ec",
  goldBorder: "#e8d48b",
  red: "#c0392b",
  redBg: "#fdf2f1",
  orange: "#e67e22",
  orangeBg: "#fef9f0",
  white: "#ffffff",
  muted: "#8aa898",
};

// ─── PROMPTS ─────────────────────────────────────────────────────────────────

const CLIENT_SYSTEM = `You are a trademark expert writing for a non-lawyer business owner. Write in clear, friendly, non-lawyer language. No jargon. No Latin. Avoid overly technical terms. Use analogies. Always be honest about risks without being alarming. Your output is a client-facing trademark search summary.`;

const ATTORNEY_SYSTEM = `You are a senior USPTO trademark attorney writing an internal legal analysis memorandum. Cite specific statutes (Lanham Act sections), TMEP sections, and relevant TTAB/Federal Circuit cases by name. Be precise and direct. Identify DuPont factors where relevant. Flag prosecution risks with specificity. This memo is attorney work product.`;

function buildClientPrompt(mark, goods, classes) {
  return `A client wants to trademark: "${mark}"
Used for: ${goods}
Proposed Nice Classes: ${classes || "to be determined"}

Write a CLIENT-FACING trademark search report explaining:

1. WHY THIS MARK COULD WORK - plain reasons the mark is strong and likely registrable
2. WHY THIS MARK MIGHT NOT WORK - honest conflicts, risks, and legal obstacles
3. CONFLICT SNAPSHOT - list 3-5 realistic hypothetical similar marks that could be cited against it and why
4. WHAT HAPPENS NEXT - simple explanation of what the client should expect

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "executiveSummary": "2-3 sentence plain-English bottom line",
  "whyItCouldWork": [
    { "reason": "Short headline", "explanation": "1-2 sentence explanation in plain English", "legalHook": "E.g. 'Fanciful marks get the strongest protection'" }
  ],
  "whyItMightNotWork": [
    { "reason": "Short headline", "explanation": "1-2 sentence explanation in plain English", "legalHook": "E.g. 'Similar sounds can block registration'" }
  ],
  "conflictSnapshot": [
    { "markName": "HYPOTHETICAL MARK", "owner": "Fictional Company LLC", "class": 41, "risk": "LOW/MEDIUM/HIGH", "reason": "Why this type of mark would be a concern" }
  ],
  "overallRiskLevel": "LOW/MEDIUM/HIGH",
  "whatHappensNext": "Plain English 2-3 sentence explanation of the process",
  "clientConfidenceScore": 72
}`;
}

function buildAttorneyPrompt(mark, goods, classes, basis) {
  return `Trademark Search Memo Request

MARK: "${mark}"
GOODS/SERVICES: ${goods}
NICE CLASSES: ${classes || "TBD"}
FILING BASIS: ${basis || "1b"}

Prepare an internal legal memorandum analyzing registrability. Cite Lanham Act sections, TMEP provisions, and relevant case law throughout. Structure the memo as follows:

1. REGISTRABILITY ARGUMENTS - legal bases why the mark should be registrable
2. REGISTRABILITY OBSTACLES - legal bars and likely office actions
3. LIKELIHOOD OF CONFUSION ANALYSIS - apply the DuPont factors
4. PROSECUTION STRATEGY - specific recommendations
5. RISK MATRIX - legal assessment per obstacle

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "memoSummary": "One paragraph attorney summary with legal citations",
  "whyItCouldWork": [
    {
      "argument": "Legal argument headline",
      "analysis": "Detailed legal analysis",
      "citations": ["15 U.S.C. 1052(f)", "TMEP 1212", "Case Name, Citation"]
    }
  ],
  "whyItMightNotWork": [
    {
      "obstacle": "Legal obstacle headline",
      "analysis": "Detailed legal analysis of the obstacle",
      "citations": ["Specific statute, TMEP section, or case"]
    }
  ],
  "duPontAnalysis": {
    "overview": "Summary of DuPont factor analysis",
    "factors": [
      { "factor": "Similarity of the marks", "number": 1, "finding": "FAVORABLE/UNFAVORABLE/NEUTRAL", "analysis": "Brief legal analysis" },
      { "factor": "Similarity of goods/services", "number": 2, "finding": "FAVORABLE/UNFAVORABLE/NEUTRAL", "analysis": "Brief legal analysis" },
      { "factor": "Similarity of trade channels", "number": 3, "finding": "FAVORABLE/UNFAVORABLE/NEUTRAL", "analysis": "Brief legal analysis" },
      { "factor": "Conditions of purchase", "number": 4, "finding": "FAVORABLE/UNFAVORABLE/NEUTRAL", "analysis": "Brief legal analysis" },
      { "factor": "Fame of the prior mark", "number": 5, "finding": "FAVORABLE/UNFAVORABLE/NEUTRAL", "analysis": "Brief legal analysis" }
    ]
  },
  "prosecutionStrategy": [
    { "action": "Specific action", "rationale": "Why with legal basis", "citation": "Supporting law" }
  ],
  "riskMatrix": [
    { "risk": "Risk description", "likelihood": "LOW/MEDIUM/HIGH", "severity": "LOW/MEDIUM/HIGH", "mitigation": "Legal strategy" }
  ],
  "overallLegalAssessment": "LOW/MEDIUM/HIGH",
  "recommendProceed": true,
  "proceedRationale": "Attorney recommendation with legal basis"
}`;
}

// ─── SHARED UI COMPONENTS ────────────────────────────────────────────────────

function RiskBadge({ level }) {
  const colors = {
    HIGH: [G.red, G.redBg], MEDIUM: [G.orange, G.orangeBg], LOW: [G.greenLight, "#f0f7f2"],
    FAVORABLE: [G.greenLight, "#f0f7f2"], UNFAVORABLE: [G.red, G.redBg], NEUTRAL: ["#7f8c8d", "#f5f5f5"],
  };
  const [fg, bg] = colors[level] || ["#555", "#f5f5f5"];
  return (
    <span style={{ background: bg, color: fg, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4, letterSpacing: 0.5, border: `1px solid ${fg}22` }}>
      {level}
    </span>
  );
}

function CitationTag({ text }) {
  return (
    <span style={{
      display: "inline-block", background: "#1a3c2e0d", border: "1px solid #1a3c2e33",
      color: G.green, fontSize: 10, fontFamily: "monospace", padding: "2px 7px",
      borderRadius: 4, marginRight: 4, marginBottom: 4, lineHeight: 1.8,
    }}>
      {text}
    </span>
  );
}

function Spinner({ label }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{
        width: 36, height: 36, border: "3px solid #d4e3d9", borderTopColor: G.green,
        borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px",
      }} />
      <div style={{ color: G.greenMuted, fontSize: 13, fontWeight: 600 }}>{label || "Analyzing..."}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── LOCKED SECTION OVERLAY ──────────────────────────────────────────────────

function LockedSection({ title, sectionNumber, onUpgrade }) {
  return (
    <div style={{ position: "relative", marginBottom: 20 }}>
      {/* Blurred placeholder content */}
      <div style={{
        filter: "blur(6px)", pointerEvents: "none", userSelect: "none",
        opacity: 0.5, padding: "0 0 8px",
      }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: G.green, marginBottom: 12 }}>
          {sectionNumber}. {title}
        </div>
        <div style={{ background: G.greenBg, borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
          <div style={{ height: 12, background: "#c8d8ce", borderRadius: 4, width: "90%", marginBottom: 8 }} />
          <div style={{ height: 12, background: "#c8d8ce", borderRadius: 4, width: "75%", marginBottom: 8 }} />
          <div style={{ height: 12, background: "#c8d8ce", borderRadius: 4, width: "82%" }} />
        </div>
        <div style={{ background: G.greenBg, borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
          <div style={{ height: 12, background: "#c8d8ce", borderRadius: 4, width: "88%", marginBottom: 8 }} />
          <div style={{ height: 12, background: "#c8d8ce", borderRadius: 4, width: "65%" }} />
        </div>
        <div style={{ background: G.greenBg, borderRadius: 8, padding: "10px 14px" }}>
          <div style={{ height: 12, background: "#c8d8ce", borderRadius: 4, width: "70%", marginBottom: 8 }} />
          <div style={{ height: 12, background: "#c8d8ce", borderRadius: 4, width: "80%" }} />
        </div>
      </div>

      {/* Lock overlay */}
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(255,255,255,0.3)", borderRadius: 12, backdropFilter: "blur(1px)",
      }}>
        <div style={{
          background: G.white, border: `1.5px solid ${G.goldBorder}`, borderRadius: 12,
          padding: "16px 24px", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          maxWidth: 300,
        }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🔒</div>
          <div style={{ fontWeight: 800, fontSize: 13, color: G.green, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 11, color: G.greenMuted, marginBottom: 10, lineHeight: 1.5 }}>
            Unlock the full legal analysis with detailed citations, case law, and strategic recommendations.
          </div>
          <button onClick={onUpgrade} style={{
            background: G.gold, color: G.white, border: "none", borderRadius: 8,
            padding: "8px 20px", fontWeight: 800, fontSize: 12, cursor: "pointer",
            letterSpacing: 0.3,
          }}>
            Unlock AI Legal Memo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── UPSELL BANNER ───────────────────────────────────────────────────────────

function UpsellBanner({ onUpgrade, mark }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${G.green} 0%, #0d2a1e 100%)`,
      borderRadius: 14, padding: "28px 24px", marginTop: 28, marginBottom: 20,
      position: "relative", overflow: "hidden",
    }}>
      {/* Decorative element */}
      <div style={{
        position: "absolute", top: -30, right: -30, width: 120, height: 120,
        borderRadius: "50%", background: "rgba(201,168,76,0.1)",
      }} />
      <div style={{
        position: "absolute", bottom: -20, left: -20, width: 80, height: 80,
        borderRadius: "50%", background: "rgba(201,168,76,0.06)",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "inline-block", background: "rgba(201,168,76,0.2)", color: G.gold,
          fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
          letterSpacing: 1, marginBottom: 12, textTransform: "uppercase",
        }}>
          AI Legal Memo
        </div>

        <div style={{ color: G.white, fontWeight: 900, fontSize: 20, marginBottom: 8, lineHeight: 1.3 }}>
          Unlock the AI Legal Memo
        </div>

        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.6, marginBottom: 16, maxWidth: 480 }}>
          Get the comprehensive AI-generated analysis of registrability, conflict risks, and filing strategy for <strong style={{ color: G.gold }}>"{mark}"</strong>. Formatted as a legal memo with full citations.
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {[
            "All 13 DuPont Factors",
            "Case Law Citations",
            "Prosecution Strategy",
            "Risk Matrix + Mitigation",
            "PDF Export",
          ].map((item, i) => (
            <span key={i} style={{
              background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)",
              fontSize: 11, padding: "4px 10px", borderRadius: 6, fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              {item}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <button onClick={onUpgrade} style={{
            background: G.gold, color: G.green, border: "none", borderRadius: 10,
            padding: "13px 32px", fontWeight: 900, fontSize: 15, cursor: "pointer",
            letterSpacing: 0.3, boxShadow: "0 4px 16px rgba(201,168,76,0.3)",
          }}>
            Unlock AI Legal Memo - $149
          </button>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
            Compare to $500-$2,000+ at traditional firms
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN SEARCH REPORT COMPONENT ───────────────────────────────────────────

export default function SearchReport({ mark: propMark, goods: propGoods, classes, basis, onFileNow }) {
  const [view, setView] = useState("client");
  const [clientReport, setClientReport] = useState(null);
  const [attorneyReport, setAttorneyReport] = useState(null);
  const [loadingClient, setLoadingClient] = useState(false);
  const [loadingAttorney, setLoadingAttorney] = useState(false);
  const [errorClient, setErrorClient] = useState(null);
  const [errorAttorney, setErrorAttorney] = useState(null);
  const [memoUnlocked, setMemoUnlocked] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Demo mode fallback
  const [demoMark, setDemoMark] = useState("");
  const [demoGoods, setDemoGoods] = useState("");
  const mark = propMark || demoMark;
  const goods = propGoods || demoGoods;

  async function runReport(type) {
    const isClient = type === "client";
    if (isClient) { setLoadingClient(true); setErrorClient(null); }
    else { setLoadingAttorney(true); setErrorAttorney(null); }

    try {
      const prompt = isClient
        ? buildClientPrompt(mark, goods, classes)
        : buildAttorneyPrompt(mark, goods, classes, basis);

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: isClient ? CLIENT_SYSTEM : ATTORNEY_SYSTEM,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      if (isClient) setClientReport(parsed);
      else setAttorneyReport(parsed);
    } catch (err) {
      const msg = "Analysis failed. Please try again.";
      if (isClient) setErrorClient(msg);
      else setErrorAttorney(msg);
    } finally {
      if (isClient) setLoadingClient(false);
      else setLoadingAttorney(false);
    }
  }

  function handleUpgrade() {
    setShowUpgradeModal(true);
  }

  function confirmUpgrade() {
    // In production: this triggers Stripe checkout
    // For now: unlock the content
    setMemoUnlocked(true);
    setShowUpgradeModal(false);
  }

  // ── Demo input if no props ──
  if (!propMark) {
    return (
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 760, margin: "0 auto", padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontWeight: 900, fontSize: 28, color: G.green, marginBottom: 4 }}>
            MarkItNow<span style={{ color: G.gold }}>.ai</span>
          </div>
          <div style={{ color: G.greenMuted, fontSize: 13 }}>Trademark Search Report - Gated Memo Preview</div>
        </div>

        <div style={{ background: G.white, borderRadius: 14, padding: 28, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: `1px solid ${G.greenBorder}` }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 700, fontSize: 12, color: G.green, marginBottom: 6, display: "block" }}>Brand Name</label>
            <input value={demoMark} onChange={e => setDemoMark(e.target.value)} placeholder="e.g. SunVault Energy" style={{
              width: "100%", padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${G.greenBorder}`,
              fontSize: 15, fontWeight: 600, color: G.green, boxSizing: "border-box",
            }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 700, fontSize: 12, color: G.green, marginBottom: 6, display: "block" }}>Goods / Services</label>
            <input value={demoGoods} onChange={e => setDemoGoods(e.target.value)} placeholder="e.g. Solar panel installation and maintenance services" style={{
              width: "100%", padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${G.greenBorder}`,
              fontSize: 14, color: G.green, boxSizing: "border-box",
            }} />
          </div>
        </div>

        {demoMark && demoGoods && (
          <div style={{ marginTop: 24 }}>
            <ReportBody
              mark={demoMark} goods={demoGoods} classes={classes} basis={basis}
              view={view} setView={setView}
              clientReport={clientReport} attorneyReport={attorneyReport}
              loadingClient={loadingClient} loadingAttorney={loadingAttorney}
              errorClient={errorClient} errorAttorney={errorAttorney}
              memoUnlocked={memoUnlocked}
              runReport={runReport} handleUpgrade={handleUpgrade}
              onFileNow={onFileNow}
            />
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <UpgradeModal mark={mark} onConfirm={confirmUpgrade} onClose={() => setShowUpgradeModal(false)} />
        )}
      </div>
    );
  }

  return (
    <div>
      <ReportBody
        mark={mark} goods={goods} classes={classes} basis={basis}
        view={view} setView={setView}
        clientReport={clientReport} attorneyReport={attorneyReport}
        loadingClient={loadingClient} loadingAttorney={loadingAttorney}
        errorClient={errorClient} errorAttorney={errorAttorney}
        memoUnlocked={memoUnlocked}
        runReport={runReport} handleUpgrade={handleUpgrade}
        onFileNow={onFileNow}
      />
      {showUpgradeModal && (
        <UpgradeModal mark={mark} onConfirm={confirmUpgrade} onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}


// ─── UPGRADE MODAL ───────────────────────────────────────────────────────────

function UpgradeModal({ mark, onConfirm, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: G.white, borderRadius: 18, padding: "36px 32px", maxWidth: 440,
        width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>&#9878;</div>
          <div style={{ fontWeight: 900, fontSize: 22, color: G.green, marginBottom: 6 }}>
            AI Legal Memo
          </div>
          <div style={{ color: G.greenMuted, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
            Unlock the comprehensive AI-generated registrability analysis for <strong>"{mark}"</strong> including DuPont factor breakdown, prosecution strategy, and risk matrix. Formatted as a legal memo.
          </div>

          <div style={{
            background: G.greenBg, borderRadius: 12, padding: 16, marginBottom: 20, textAlign: "left",
          }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: G.green, marginBottom: 10 }}>What you get:</div>
            {[
              "Full 13-factor DuPont likelihood of confusion analysis",
              "Prosecution strategy with TMEP citations",
              "Risk matrix with severity scoring and mitigation",
              "Lanham Act and Federal Circuit case references",
              "PDF export ready for your attorney",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                <span style={{ color: G.greenLight, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>&#10003;</span>
                <span style={{ fontSize: 12, color: "#3d6b52", lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{
            display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginBottom: 6,
          }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: G.green }}>$149</span>
            <span style={{ fontSize: 13, color: G.greenMuted }}>one-time</span>
          </div>
          <div style={{ fontSize: 11, color: G.greenMuted, marginBottom: 20 }}>
            Traditional clearance opinions run $500-$2,000+
          </div>

          <button onClick={onConfirm} style={{
            width: "100%", padding: "14px 0", background: G.gold, color: G.green,
            border: "none", borderRadius: 10, fontWeight: 900, fontSize: 16,
            cursor: "pointer", boxShadow: "0 4px 16px rgba(201,168,76,0.3)",
            marginBottom: 10,
          }}>
            Unlock AI Legal Memo
          </button>
          <button onClick={onClose} style={{
            width: "100%", padding: "10px 0", background: "transparent", color: G.greenMuted,
            border: "none", fontSize: 13, cursor: "pointer",
          }}>
            Not right now
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── REPORT BODY ─────────────────────────────────────────────────────────────

function ReportBody({
  mark, goods, classes, basis, view, setView,
  clientReport, attorneyReport,
  loadingClient, loadingAttorney,
  errorClient, errorAttorney,
  memoUnlocked, runReport, handleUpgrade, onFileNow,
}) {
  return (
    <div>
      {/* Disclaimer */}
      <div style={{
        background: G.green, borderRadius: 12, padding: "16px 20px", marginBottom: 24, color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 1.6,
      }}>
        <div style={{ fontWeight: 800, color: G.gold, fontSize: 11, letterSpacing: 1, marginBottom: 6 }}>
          IMPORTANT DISCLAIMER
        </div>
        This is an AI-assisted preliminary analysis only. It does not search live USPTO TESS/TSDR databases, state trademark registries, or common law sources. A comprehensive clearance search by a licensed attorney is required before filing or using any mark in commerce.
        <div style={{ marginTop: 8, fontSize: 11, color: "#7ecba1", fontWeight: 600 }}>
          Under 15 U.S.C. 1051 et seq., registration does not guarantee freedom to use. Common law rights can precede registration.
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, background: G.greenBg, borderRadius: 12, padding: 4 }}>
        {[
          { key: "client", label: "AI Analysis Report", sub: "$99" },
          { key: "attorney", label: "AI Legal Memo", sub: memoUnlocked ? "Full Analysis" : "$149 to Unlock" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setView(tab.key)} style={{
            flex: 1, padding: "10px 16px", borderRadius: 9, border: "none", cursor: "pointer",
            background: view === tab.key ? G.green : "transparent",
            color: view === tab.key ? G.white : G.greenMuted, transition: "all 0.2s",
            textAlign: "center",
          }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              {tab.key === "attorney" && !memoUnlocked && <span style={{ marginRight: 4 }}>&#128274;</span>}
              {tab.label}
            </div>
            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>{tab.sub}</div>
          </button>
        ))}
      </div>

      {/* ── CLIENT VIEW ───────────────────────────────── */}
      {view === "client" && (
        <div>
          {!clientReport && !loadingClient && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>&#128269;</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: G.green, marginBottom: 8 }}>
                AI Analysis Report
              </div>
              <div style={{ color: G.greenMuted, fontSize: 14, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
                Generate a plain-English analysis of why <strong>"{mark}"</strong> could work as a trademark and where the risks are.
              </div>
              <button onClick={() => runReport("client")} style={{
                padding: "13px 32px", background: G.green, color: G.white, border: "none",
                borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: "pointer",
              }}>
                Generate AI Analysis Report
              </button>
            </div>
          )}

          {loadingClient && <Spinner label="Analyzing trademark strength..." />}

          {errorClient && (
            <div style={{ background: G.redBg, border: "1px solid #e8b4b0", borderRadius: 10, padding: 14, color: G.red, fontSize: 13 }}>
              {errorClient} <button onClick={() => runReport("client")} style={{ marginLeft: 10, background: G.red, color: G.white, border: "none", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>Retry</button>
            </div>
          )}

          {clientReport && (
            <div>
              {/* Executive Summary */}
              <div style={{ background: G.greenBg, border: `1.5px solid ${G.greenBorder}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: G.green, marginBottom: 6 }}>Bottom Line</div>
                    <div style={{ fontSize: 14, color: "#3d6b52", lineHeight: 1.7 }}>{clientReport.executiveSummary}</div>
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: clientReport.clientConfidenceScore >= 70 ? "#f0f7f2" : clientReport.clientConfidenceScore >= 40 ? G.orangeBg : G.redBg,
                      border: `2px solid ${clientReport.clientConfidenceScore >= 70 ? G.greenLight : clientReport.clientConfidenceScore >= 40 ? G.orange : G.red}`,
                      fontSize: 22, fontWeight: 900, color: clientReport.clientConfidenceScore >= 70 ? G.greenLight : clientReport.clientConfidenceScore >= 40 ? G.orange : G.red,
                    }}>
                      {clientReport.clientConfidenceScore}
                    </div>
                    <div style={{ fontSize: 10, color: G.greenMuted, marginTop: 4, fontWeight: 600 }}>Confidence</div>
                    <RiskBadge level={clientReport.overallRiskLevel} />
                  </div>
                </div>
              </div>

              {/* Why It Could Work */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: G.greenLight, marginBottom: 10 }}>
                  &#10003; Why This Mark Could Work
                </div>
                {clientReport.whyItCouldWork?.map((item, i) => (
                  <div key={i} style={{ background: "#f0f7f2", borderRadius: 10, padding: "12px 16px", marginBottom: 8, borderLeft: `3px solid ${G.greenLight}` }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: G.green, marginBottom: 4 }}>{item.reason}</div>
                    <div style={{ fontSize: 12, color: "#3d6b52", lineHeight: 1.6 }}>{item.explanation}</div>
                    {item.legalHook && (
                      <div style={{ fontSize: 11, color: G.greenMuted, marginTop: 4, fontStyle: "italic" }}>{item.legalHook}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Why It Might Not Work */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: G.orange, marginBottom: 10 }}>
                  &#9888; Why This Mark Might Not Work
                </div>
                {clientReport.whyItMightNotWork?.map((item, i) => (
                  <div key={i} style={{ background: G.orangeBg, borderRadius: 10, padding: "12px 16px", marginBottom: 8, borderLeft: `3px solid ${G.orange}` }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#8a5e00", marginBottom: 4 }}>{item.reason}</div>
                    <div style={{ fontSize: 12, color: "#6b4e00", lineHeight: 1.6 }}>{item.explanation}</div>
                    {item.legalHook && (
                      <div style={{ fontSize: 11, color: "#a07a20", marginTop: 4, fontStyle: "italic" }}>{item.legalHook}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Conflict Snapshot */}
              {clientReport.conflictSnapshot?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: G.green, marginBottom: 10 }}>
                    Potential Conflicts
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: G.greenBg }}>
                          {["Mark", "Owner", "Class", "Risk", "Reason"].map(h => (
                            <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700, color: G.green, borderBottom: `1.5px solid ${G.greenBorder}`, fontSize: 11 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {clientReport.conflictSnapshot.map((c, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${G.greenBorder}` }}>
                            <td style={{ padding: "8px 10px", fontWeight: 700, color: G.green }}>{c.markName}</td>
                            <td style={{ padding: "8px 10px", color: G.greenMuted }}>{c.owner}</td>
                            <td style={{ padding: "8px 10px", color: G.greenMuted }}>{c.class}</td>
                            <td style={{ padding: "8px 10px" }}><RiskBadge level={c.risk} /></td>
                            <td style={{ padding: "8px 10px", color: "#4a7060", lineHeight: 1.5 }}>{c.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* What Happens Next */}
              {clientReport.whatHappensNext && (
                <div style={{ background: G.greenBg, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: G.green, marginBottom: 6 }}>What Happens Next</div>
                  <div style={{ fontSize: 13, color: "#3d6b52", lineHeight: 1.7 }}>{clientReport.whatHappensNext}</div>
                </div>
              )}

              {/* Upsell Banner - appears after client report */}
              {!memoUnlocked && (
                <UpsellBanner onUpgrade={handleUpgrade} mark={mark} />
              )}

              {/* File Now CTA */}
              {onFileNow && (
                <div style={{
                  background: "#0d0d0d", borderRadius: 14, padding: "20px 24px", marginTop: 8,
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
                }}>
                  <div>
                    <div style={{ color: G.gold, fontWeight: 800, fontSize: 15 }}>Ready to file?</div>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>Start your USPTO application now</div>
                  </div>
                  <button onClick={() => onFileNow(mark, goods)} style={{
                    background: G.gold, color: "#0d0d0d", border: "none", borderRadius: 8,
                    padding: "10px 24px", fontWeight: 800, fontSize: 14, cursor: "pointer",
                  }}>
                    File It Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ATTORNEY MEMO VIEW ────────────────────────── */}
      {view === "attorney" && (
        <div>
          {!attorneyReport && !loadingAttorney && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>&#9878;</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: G.green, marginBottom: 8 }}>
                AI Legal Memo
              </div>
              <div style={{ color: G.greenMuted, fontSize: 14, marginBottom: 24, maxWidth: 440, margin: "0 auto 24px" }}>
                Generate a legal registrability analysis for <strong>"{mark}"</strong> with case citations and DuPont factor review.
              </div>
              <button onClick={() => runReport("attorney")} style={{
                padding: "13px 32px", background: G.green, color: G.white, border: "none",
                borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: "pointer",
              }}>
                Generate AI Legal Memo
              </button>
            </div>
          )}

          {loadingAttorney && <Spinner label="Drafting legal memorandum..." />}

          {errorAttorney && (
            <div style={{ background: G.redBg, border: "1px solid #e8b4b0", borderRadius: 10, padding: 14, color: G.red, fontSize: 13 }}>
              {errorAttorney} <button onClick={() => runReport("attorney")} style={{ marginLeft: 10, background: G.red, color: G.white, border: "none", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>Retry</button>
            </div>
          )}

          {attorneyReport && (
            <div>
              {/* ── ALWAYS VISIBLE: Memo Header with Summary + Risk Level ── */}
              <div style={{
                background: G.greenBg, border: `1.5px solid ${G.greenBorder}`, borderRadius: 12,
                padding: 20, marginBottom: 20, fontFamily: "Georgia, serif",
              }}>
                <div style={{
                  fontSize: 10, color: G.muted, fontFamily: "monospace", marginBottom: 6, letterSpacing: 1.5,
                }}>
                  INTERNAL MEMORANDUM -- ATTORNEY WORK PRODUCT -- PRIVILEGED AND CONFIDENTIAL
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: G.green, fontFamily: "system-ui", marginBottom: 2 }}>
                  Trademark Registrability Analysis
                </div>
                <div style={{ fontSize: 13, color: "#4a7060", fontFamily: "system-ui", marginBottom: 14 }}>
                  Re: "{mark}"
                </div>
                <div style={{
                  fontSize: 13, color: "#3d6b52", lineHeight: 1.8,
                  borderTop: `1px solid ${G.greenBorder}`, paddingTop: 14,
                }}>
                  {attorneyReport.memoSummary}
                </div>
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: G.green, fontFamily: "system-ui" }}>Overall Assessment:</span>
                  <RiskBadge level={attorneyReport.overallLegalAssessment} />
                  <span style={{
                    background: attorneyReport.recommendProceed ? "#f0f7f2" : G.redBg,
                    color: attorneyReport.recommendProceed ? "#1a5c35" : "#8a2020",
                    fontWeight: 800, fontSize: 12, padding: "4px 14px", borderRadius: 6,
                    border: `1px solid ${attorneyReport.recommendProceed ? "#b0d9bc" : "#e8b4b0"}`,
                    fontFamily: "system-ui",
                  }}>
                    {attorneyReport.recommendProceed ? "PROCEED WITH FILING" : "FURTHER REVIEW REQUIRED"}
                  </span>
                </div>
              </div>

              {/* ── GATED SECTIONS ── */}
              {memoUnlocked ? (
                <>
                  {/* I. Registrability Arguments - UNLOCKED */}
                  {attorneyReport.whyItCouldWork?.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: G.green, marginBottom: 12 }}>
                        I. Registrability Arguments
                      </div>
                      {attorneyReport.whyItCouldWork.map((item, i) => (
                        <div key={i} style={{ background: "#f0f7f2", borderRadius: 10, padding: "12px 16px", marginBottom: 8, borderLeft: `3px solid ${G.greenLight}` }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: G.green, marginBottom: 4 }}>{item.argument}</div>
                          <div style={{ fontSize: 12, color: "#3d6b52", lineHeight: 1.6, marginBottom: 6 }}>{item.analysis}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {item.citations?.map((c, j) => <CitationTag key={j} text={c} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* II. Registrability Obstacles - UNLOCKED */}
                  {attorneyReport.whyItMightNotWork?.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: G.green, marginBottom: 12 }}>
                        II. Registrability Obstacles
                      </div>
                      {attorneyReport.whyItMightNotWork.map((item, i) => (
                        <div key={i} style={{ background: G.redBg, borderRadius: 10, padding: "12px 16px", marginBottom: 8, borderLeft: `3px solid ${G.red}` }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#8a2020", marginBottom: 4 }}>{item.obstacle}</div>
                          <div style={{ fontSize: 12, color: "#6b3030", lineHeight: 1.6, marginBottom: 6 }}>{item.analysis}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {item.citations?.map((c, j) => <CitationTag key={j} text={c} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* III. DuPont Analysis - UNLOCKED */}
                  {attorneyReport.duPontAnalysis && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: G.green, marginBottom: 4 }}>
                        III. Likelihood of Confusion -- DuPont Factors
                      </div>
                      <div style={{ fontSize: 12, color: G.greenMuted, marginBottom: 12, fontStyle: "italic" }}>
                        In re E.I. DuPont de Nemours & Co., 177 U.S.P.Q. 563 (C.C.P.A. 1973)
                      </div>
                      <div style={{ background: G.greenBg, border: `1.5px solid ${G.greenBorder}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <div style={{ fontSize: 13, color: "#2e4a38", lineHeight: 1.7, fontFamily: "Georgia, serif" }}>
                          {attorneyReport.duPontAnalysis.overview}
                        </div>
                      </div>
                      {attorneyReport.duPontAnalysis.factors?.map((f, i) => (
                        <div key={i} style={{ display: "flex", gap: 12, marginBottom: 8, alignItems: "flex-start" }}>
                          <div style={{
                            flexShrink: 0, width: 24, height: 24, borderRadius: "50%",
                            background: G.green, color: "#7ecba1", fontSize: 10, fontWeight: 800,
                            display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2,
                          }}>{f.number}</div>
                          <div style={{ flex: 1, background: G.greenBg, borderRadius: 8, padding: "10px 14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <div style={{ fontWeight: 700, fontSize: 12, color: G.green }}>{f.factor}</div>
                              <RiskBadge level={f.finding} />
                            </div>
                            <div style={{ fontSize: 12, color: "#4a7060", lineHeight: 1.6 }}>{f.analysis}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* IV. Prosecution Strategy - UNLOCKED */}
                  {attorneyReport.prosecutionStrategy?.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: G.green, marginBottom: 12 }}>
                        IV. Prosecution Strategy
                      </div>
                      {attorneyReport.prosecutionStrategy.map((item, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                          <div style={{
                            flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                            background: G.greenBg, color: G.green, fontSize: 11, fontWeight: 800,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>{i + 1}</div>
                          <div style={{ flex: 1, background: G.greenBg, borderRadius: 8, padding: "10px 14px" }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: G.green, marginBottom: 2 }}>{item.action}</div>
                            <div style={{ fontSize: 12, color: "#4a7060", lineHeight: 1.6 }}>{item.rationale}</div>
                            {item.citation && <CitationTag text={item.citation} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* V. Risk Matrix - UNLOCKED */}
                  {attorneyReport.riskMatrix?.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: G.green, marginBottom: 12 }}>
                        V. Risk Matrix
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: G.greenBg }}>
                              {["Risk", "Likelihood", "Severity", "Mitigation"].map(h => (
                                <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontWeight: 700, color: G.green, borderBottom: `1.5px solid ${G.greenBorder}`, fontSize: 11 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {attorneyReport.riskMatrix.map((r, i) => (
                              <tr key={i} style={{ borderBottom: `1px solid ${G.greenBorder}` }}>
                                <td style={{ padding: "8px 10px", fontWeight: 600, color: G.green }}>{r.risk}</td>
                                <td style={{ padding: "8px 10px" }}><RiskBadge level={r.likelihood} /></td>
                                <td style={{ padding: "8px 10px" }}><RiskBadge level={r.severity} /></td>
                                <td style={{ padding: "8px 10px", color: "#4a7060", lineHeight: 1.5 }}>{r.mitigation}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Work Product Footer */}
                  <div style={{
                    borderTop: `1px solid ${G.greenBorder}`, paddingTop: 14, marginTop: 10,
                    fontSize: 10, color: G.muted, fontFamily: "monospace", lineHeight: 1.6,
                  }}>
                    This memorandum constitutes attorney work product prepared in anticipation of litigation or for providing legal advice, and is protected under Fed. R. Civ. P. 26(b)(3) and the attorney-client privilege. Distribution limited to authorized recipients.
                  </div>
                </>
              ) : (
                <>
                  {/* ── LOCKED SECTIONS ── */}
                  <LockedSection title="Registrability Arguments" sectionNumber="I" onUpgrade={handleUpgrade} />
                  <LockedSection title="Registrability Obstacles" sectionNumber="II" onUpgrade={handleUpgrade} />
                  <LockedSection title="DuPont Factor Analysis" sectionNumber="III" onUpgrade={handleUpgrade} />
                  <LockedSection title="Prosecution Strategy" sectionNumber="IV" onUpgrade={handleUpgrade} />
                  <LockedSection title="Risk Matrix" sectionNumber="V" onUpgrade={handleUpgrade} />

                  {/* Upsell Banner */}
                  <UpsellBanner onUpgrade={handleUpgrade} mark={mark} />
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
