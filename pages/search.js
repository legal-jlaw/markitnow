import Nav from "../components/Nav";
import ChatWidget from "../components/ChatWidget";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

//  Helpers 

function statusStyle(status = "") {
  const s = status.toLowerCase();
  if (s.includes("live") && s.includes("regist"))  return { color: "#1a7a3c", bg: "#e8f7ee", dot: "#2ecc71",  label: "Registered",  category: "live" };
  if (s.includes("live") && s.includes("pending")) return { color: "#7a5c00", bg: "#fffae8", dot: "#f1c40f",  label: "Pending",     category: "live" };
  if (s.includes("live"))                          return { color: "#1a7a3c", bg: "#e8f7ee", dot: "#2ecc71",  label: "Live",        category: "live" };
  if (s.includes("cancel"))                        return { color: "#7a1a1a", bg: "#faeee8", dot: "#e74c3c",  label: "Cancelled",   category: "dead" };
  if (s.includes("abandon"))                       return { color: "#5a3a1a", bg: "#fdf3e8", dot: "#e67e22",  label: "Abandoned",   category: "dead" };
  if (s.includes("expir"))                         return { color: "#5a3a1a", bg: "#fdf3e8", dot: "#e67e22",  label: "Expired",     category: "dead" };
  if (s.includes("dead"))                          return { color: "#7a1a1a", bg: "#faeee8", dot: "#e74c3c",  label: "Dead",        category: "dead" };
  return                                                  { color: "#555",    bg: "#f0f0f0", dot: "#aaa",     label: status || "Unknown", category: "unknown" };
}

function riskColor(r) {
  return r === "HIGH" ? "#c0392b" : r === "MEDIUM" ? "#e67e22" : "#2d7a4f";
}

function scoreColor(s) {
  return s >= 70 ? "#2d7a4f" : s >= 45 ? "#e67e22" : "#c0392b";
}

//  Purchase / Analysis Panel 

function PurchasePanel({ mark, trademarks, loading }) {
  const [activeResult, setActiveResult] = useState(null);
  const [goods, setGoods] = useState("");
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [memo, setMemo] = useState(null);
  const [showModal, setShowModal] = useState(null); // "report" | "memo" | null
  const [isPaid, setIsPaid] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  async function handleEmailCapture(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailLoading(true);
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mark, source: "search_results", conflictCount: trademarks.length || 0, activeCount: trademarks.filter(t => t.isActive).length || 0 }),
      });
    } catch (err) {}
    setEmailSubmitted(true);
    setEmailLoading(false);
  }

  async function generate(type) {
    setGenerating(true);
    setActiveResult(type);
    setReport(null);
    setMemo(null);

    const isReport = type === "report";

    try {
      if (isReport) {
        // Use Agent 1 (analysis-agent) - multi-step USPTO search + DuPont scoring
        const res = await fetch("/api/analysis-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mark, goodsServices: goods, classCode: null, prefetchedConflicts: trademarks }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        // Map Agent 1 output to existing report display format
        const conflicts = data.scoring?.scoredConflicts || [];
        const mapped = {
          executiveSummary: data.analysis?.executiveSummary || "",
          overallRiskLevel: data.scoring?.overallRisk || "UNKNOWN",
          clientConfidenceScore: (() => {
            const risk = data.scoring?.overallRisk;
            const high = data.scoring?.highRiskCount || 0;
            const med = data.scoring?.mediumRiskCount || 0;
            const total = data.retrieval?.activeCount || 0;
            if (risk === "HIGH" || high >= 3) return Math.max(10, 30 - high * 3);
            if (risk === "MEDIUM" || high >= 1 || med >= 3) return Math.max(30, 60 - high * 5 - med * 2);
            if (total > 50) return 65; // clean field but crowded space
            if (total > 20) return 72;
            return 85;
          })(),
          whyItCouldWork: data.scoring?.overallRisk === "LOW" || conflicts.filter(c => c.riskScore === "LOW").length > 0
            ? [{ reason: data.analysis?.registrabilityAssessment?.distinctiveness || "Mark appears registrable", explanation: data.analysis?.registrabilityAssessment?.reasoning || "", legalHook: `Registration likelihood: ${data.analysis?.registrabilityAssessment?.likelihood}` }]
            : [{ reason: "Registrability depends on conflict resolution", explanation: data.analysis?.recommendation?.reasoning || "", legalHook: "Likelihood of confusion analysis required" }],
          whyItMightNotWork: conflicts.filter(c => c.riskScore === "HIGH" || c.riskScore === "MEDIUM").slice(0, 3).map(c => ({
            reason: `Conflict: ${c.markName}`,
            explanation: c.riskReasoning || "",
            legalHook: `DuPont factor: ${c.dupont?.markSimilarity || "Mark similarity"}`
          })),
          conflictSnapshot: conflicts.slice(0, 5).map(c => ({
            markName: c.markName,
            owner: c.owner,
            class: c.classCode,
            risk: c.riskScore,
            reason: c.riskReasoning,
            serialNumber: c.serialNumber,
          })),
          whatHappensNext: (data.analysis?.recommendation?.nextSteps || []).join(" "),
          _agentData: data, // preserve full agent output
        };
        setReport(mapped);

      } else {
        // Step 1: Run analysis-agent to get conflict data (pass already-loaded conflicts)
        const analysisRes = await fetch("/api/analysis-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mark, goodsServices: goods, classCode: null, prefetchedConflicts: trademarks }),
        });
        const analysisData = await analysisRes.json();
        if (analysisData.error) throw new Error(analysisData.error);

        // Step 2: Pass analysis result to memo-draft (single Claude call, fast)
        const memoRes = await fetch("/api/memo-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mark, goodsServices: goods, report: analysisData }),
        });
        const memoData = await memoRes.json();
        if (memoData.error) throw new Error(memoData.error);

        // Map to display format
        const memo = memoData.memo || {};
        const dupont = memo.sectionIII?.subsections || [];
        const mapped = {
          memoSummary: memo.executiveSummary || "",
          overallLegalAssessment: analysisData.scoring?.overallRisk || "UNKNOWN",
          recommendProceed: !["REBRAND_RECOMMENDED", "CONSULT_ATTORNEY"].includes(analysisData.analysis?.recommendation?.action),
          proceedRationale: memo.sectionVI?.filingStrategy || "",
          whyItCouldWork: (memo.sectionVI?.recommendations || []).map(r => ({ argument: r, analysis: r, citations: [] })),
          whyItMightNotWork: (memo.sectionV?.conflicts || []).filter(c => c.riskLevel === "HIGH").slice(0, 3).map(c => ({
            obstacle: c.markName,
            analysis: c.analysis,
            citations: [`Serial No. ${c.serialNumber}`],
          })),
          duPontAnalysis: {
            overview: memo.sectionIII?.overallConclusion || "",
            factors: dupont.slice(0, 2).map((s, i) => ({
              factor: s.factor,
              number: i + 1,
              finding: s.weight === "FAVORS_APPLICANT" ? "FAVORABLE" : s.weight === "FAVORS_REGISTRANT" ? "UNFAVORABLE" : "NEUTRAL",
              analysis: s.analysis,
            })),
          },
          prosecutionStrategy: (memo.sectionVI?.recommendations || []).slice(0, 2).map(r => ({ action: r, rationale: r, citation: "" })),
          riskMatrix: (memo.sectionV?.conflicts || []).slice(0, 1).map(c => ({
            risk: c.markName,
            likelihood: c.riskLevel || "MEDIUM",
            severity: c.riskLevel || "MEDIUM",
            mitigation: c.analysis,
          })),
          _agentData: { analysis: analysisData, memo: memoData },
        };
        setMemo(mapped);
      }
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  }

  async function handlePurchase(product, price) {
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark, product, price }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setIsPaid(true);
    } catch {
      setIsPaid(true); // fallback for local dev without Stripe
    }
  }

  //  Idle: show product cards 
  if (!activeResult) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

        {/* Modal overlay */}
        {showModal && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#111", marginBottom: 4 }}>
                {showModal === "report" ? "🔍 Run AI Analysis Report" : "⚖️ Generate AI Legal Memo"}
              </div>
              <div style={{ fontSize: 12, color: "#6b8a78", marginBottom: 16, lineHeight: 1.5 }}>
                Tell us what your brand does so we can assess goods &amp; services similarity — one of the most important DuPont factors.
              </div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#111", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>
                What does your brand do?
              </label>
              <textarea
                value={goods}
                onChange={e => setGoods(e.target.value)}
                placeholder="e.g. Sparkling water and health beverages sold online..."
                autoFocus
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #d4e3d9", fontSize: 12, fontFamily: "inherit", background: "#f8faf9", color: "#1a2e23", outline: "none", resize: "none", minHeight: 70, boxSizing: "border-box", marginBottom: 14 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowModal(null)} style={{ flex: 1, padding: "9px", background: "#f4f4f4", color: "#555", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                  Cancel
                </button>
                <button
                  onClick={() => { setShowModal(null); generate(showModal); }}
                  style={{ flex: 2, padding: "9px", background: showModal === "memo" ? "#c9a84c" : "#111", color: showModal === "memo" ? "#0a0a0a" : "#fff", border: "none", borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: "pointer" }}
                >
                  {showModal === "report" ? "Run Analysis →" : "Generate Memo →"}
                </button>
              </div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 10, textAlign: "center" }}>You can skip this — we'll analyze based on mark name alone.</div>
            </div>
          </div>
        )}

        <div style={{ padding: "20px 24px", borderBottom: "1px solid #eef2f0" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#8aa898", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>AI Analysis</div>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: "#111", margin: "0 0 6px" }}>
            {loading ? "Searching USPTO..." : trademarks.length > 0
              ? `${trademarks.filter(t => t.isActive).length} active conflicts found - review before filing`
              : `"${mark}" looks clear - confirm before filing`}
          </h3>
          <p style={{ fontSize: 12, color: "#6b8a78", margin: 0, lineHeight: 1.6 }}>
            {loading ? "Run AI analysis while we search the USPTO database." : trademarks.length > 0
              ? `Run AI analysis to assess likelihood of confusion against ${trademarks.length} found marks under DuPont.`
              : `No exact USPTO matches. Run AI analysis to confirm mark strength and registrability.`}
          </p>
        </div>

        {/* Brand Risk Summary - warm middle step */}
        {!loading && trademarks.length > 0 && (
          <div style={{ margin: "0", padding: "14px 20px", background: "#fff5f5", borderBottom: "1px solid #fed7d7" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#c53030", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Brand Risk Summary</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#333" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: trademarks.filter(t => t.isActive).length > 3 ? "#e74c3c" : trademarks.filter(t => t.isActive).length > 0 ? "#f39c12" : "#2ecc71", flexShrink: 0 }} />
                <span><strong>{trademarks.filter(t => t.isActive).length} active marks</strong> found that could conflict with yours</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#333" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f39c12", flexShrink: 0 }} />
                <span>Run an <strong>AI conflict analysis</strong> to see your likelihood of confusion score</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#333" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#e74c3c", flexShrink: 0 }} />
                <span>Without monitoring, you won't know when new conflicts are filed</span>
              </div>
            </div>
          </div>
        )}

        {/* Email capture banner */}
        {!emailSubmitted ? (
          <div style={{ margin: "0", padding: "10px 16px", background: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>Get a free PDF of these results</div>
            <form onSubmit={handleEmailCapture} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com"
                style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid #fcd34d", fontSize: 12, fontFamily: "inherit", outline: "none", background: "#fff", boxSizing: "border-box" }} />
              <button type="submit" disabled={emailLoading} style={{ width: "100%", background: "#c9a84c", color: "#111", border: "none", borderRadius: 7, padding: "7px 12px", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>
                {emailLoading ? "..." : "Send PDF"}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ padding: "10px 20px", background: "#f0fff4", borderBottom: "1px solid #9ae6b4", fontSize: 12, color: "#276749", fontWeight: 600 }}>
            Check your inbox - PDF on its way.
          </div>
        )}

        <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
          {/* AI Analysis Report card */}
          <div style={{ border: "1.5px solid #d4e3d9", borderRadius: 12, padding: 16, marginBottom: 12, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#111" }}> AI Analysis Report</div>
                <div style={{ fontSize: 11, color: "#6b8a78", marginTop: 2 }}>Plain English · Risk assessment · Conflict analysis</div>
              </div>
              <div style={{ background: "#f0f7f2", color: "#2d7a4f", fontWeight: 800, fontSize: 11, padding: "3px 8px", borderRadius: 5 }}>Free Preview</div>
            </div>
            <div style={{ fontSize: 11, color: "#4a7060", lineHeight: 1.6, marginBottom: 12 }}>
              Summary + pros/cons + conflict breakdown. Full PDF (with DuPont memo) unlocks for $99.
            </div>
            <button onClick={() => setShowModal("report")} style={{ width: "100%", padding: "9px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12 }}>
              Run AI Analysis Report →
            </button>
          </div>

          {/* AI Legal Memo card */}
          <div style={{ border: "2px solid #c9a84c", borderRadius: 12, padding: 16, marginBottom: 12, background: "#fffdf7" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#111" }}>️ AI Legal Memo</div>
                <div style={{ fontSize: 11, color: "#6b8a78", marginTop: 2 }}>DuPont analysis · Case citations · Prosecution strategy</div>
              </div>
              <div style={{ background: "#c9a84c", color: "#0a0a0a", fontWeight: 800, fontSize: 11, padding: "3px 8px", borderRadius: 5 }}>Free Preview</div>
            </div>
            <div style={{ fontSize: 11, color: "#4a7060", lineHeight: 1.6, marginBottom: 12 }}>
              Full legal memo w/ DuPont 13-factor analysis, risk matrix, prosecution strategy. PDF unlocks for $149.
            </div>
            <button onClick={() => setShowModal("memo")} style={{ width: "100%", padding: "9px", background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 8, fontWeight: 800, fontSize: 12 }}>
              Generate AI Legal Memo - $149 →
            </button>
          </div>

          {/* File CTA */}
          <div style={{ background: "#111", borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#fff", marginBottom: 4 }}> Skip straight to filing?</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 10 }}>
              U.S. Licensed Attorney reviews your application and files TEAS Plus. $399 flat - $100 less than Trademarkia.
            </div>
            <a href={`/file?mark=${encodeURIComponent(mark)}`} style={{ display: "block", textAlign: "center", padding: "9px", background: "#c9a84c", color: "#0a0a0a", borderRadius: 8, fontWeight: 800, fontSize: 12 }}>
              File With Attorney $399 →
            </a>
          </div>
        </div>
      </div>
    );
  }

  //  Generating spinner 
  if (generating) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>️</div>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#111", marginBottom: 6 }}>
          {activeResult === "report" ? "Analyzing conflicts..." : "Drafting AI Legal Memo..."}
        </div>
        <div style={{ fontSize: 12, color: "#8aa898", lineHeight: 1.7 }}>
          {activeResult === "report"
            ? "Applying DuPont factors\nScoring confidence · Assessing mark strength"
            : "Citing case law · DuPont 13-factor analysis\nBuilding prosecution strategy"}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d7a4f", animation: `dp 1.2s ${i * 0.2}s infinite ease-in-out` }} />
          ))}
        </div>
        <style>{`@keyframes dp{0%,80%,100%{transform:scale(0);opacity:.4}40%{transform:scale(1);opacity:1}}`}</style>
      </div>
    );
  }

  //  AI Analysis Report result 
  if (activeResult === "report" && report) {
    const sc = report.clientConfidenceScore || 50;
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {/* Sticky header */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #eef2f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: "#fff" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#111" }}> AI Analysis Report</div>
          <button onClick={() => { setActiveResult(null); setReport(null); }} style={{ background: "#f4f7f5", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "#111" }}>← Back</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {/* Score card - always visible */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, background: "#f8faf9", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#8aa898", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Risk Summary</div>
              <p style={{ fontSize: 12, lineHeight: 1.7, color: "#1a2e23", margin: 0 }}>
                {(() => {
                  const high = report._agentData?.scoring?.highRiskCount || 0;
                  const med = report._agentData?.scoring?.mediumRiskCount || 0;
                  const total = report._agentData?.retrieval?.totalFound || 0;
                  const active = report._agentData?.retrieval?.activeCount || 0;
                  const risk = report.overallRiskLevel;
                  if (risk === "HIGH") return `We found ${high} high-risk conflict${high !== 1 ? "s" : ""} that could block registration. Full analysis required before filing.`;
                  if (risk === "MEDIUM") return `${active} active marks overlap with yours. ${med > 0 ? `${med} present a moderate likelihood of confusion risk.` : "Further analysis recommended before filing."}`;
                  return `${total} marks found in the USPTO database. Full DuPont analysis determines your registrability odds.`;
                })()}
              </p>
            </div>
            <div style={{ width: 100, background: `${scoreColor(sc)}11`, border: `2px solid ${scoreColor(sc)}`, borderRadius: 10, padding: 10, textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: scoreColor(sc), lineHeight: 1 }}>{sc}</div>
              <div style={{ fontSize: 7, fontWeight: 700, color: "#8aa898", marginTop: 3, textTransform: "uppercase", letterSpacing: 0, whiteSpace: "nowrap" }}>Registrability</div>
              <div style={{ fontSize: 9, fontWeight: 800, marginTop: 3, color: scoreColor(sc) }}>{report.overallRiskLevel === "LOW" ? "LOW RISK" : report.overallRiskLevel === "MEDIUM" ? "MED RISK" : report.overallRiskLevel === "HIGH" ? "HIGH RISK" : report.overallRiskLevel}</div>
            </div>
          </div>

          {/* Teaser rows - show counts but not content */}
          {!isPaid && (
            <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f0f7f2", borderRadius: 8, padding: "9px 12px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#2d7a4f" }}>✓ Registration arguments</span>
                <span style={{ fontSize: 10, color: "#8aa898" }}>{report.whyItCouldWork?.length || 0} found — unlock to read</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fdf2f1", borderRadius: 8, padding: "9px 12px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#c0392b" }}>⚠ Risk factors identified</span>
                <span style={{ fontSize: 10, color: "#8aa898" }}>{report.whyItMightNotWork?.length || 0} found — unlock to read</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8f5ff", borderRadius: 8, padding: "9px 12px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6b46c1" }}>⚖ DuPont factor analysis</span>
                <span style={{ fontSize: 10, color: "#8aa898" }}>13 factors — unlock to read</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff8ec", borderRadius: 8, padding: "9px 12px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#b7791f" }}>📋 Conflict breakdown</span>
                <span style={{ fontSize: 10, color: "#8aa898" }}>{report.conflictSnapshot?.length || 0} conflicts analyzed — unlock to read</span>
              </div>
            </div>
          )}

          {/* Locked content - blurred behind paywall */}
          {!isPaid ? (
            <div style={{ position: "relative", marginBottom: 14 }}>
              {/* Blurred preview */}
              <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none", opacity: 0.7 }}>
                {/* Risks preview */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 11, color: "#c0392b", marginBottom: 8, background: "#fdf2f1", display: "inline-block", padding: "2px 10px", borderRadius: 20 }}> Risks</div>
                  {(report.whyItMightNotWork?.length > 0 
                    ? report.whyItMightNotWork.slice(0, 2) 
                    : [{ reason: "Potential conflict risk identified", explanation: "Unlock to see full risk breakdown." }, { reason: "Registrability issue detected", explanation: "Unlock to see detailed analysis." }]
                  ).map((w, i) => (
                    <div key={i} style={{ borderLeft: "3px solid #c0392b", paddingLeft: 10, marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#111" }}>{w.reason}</div>
                      <div style={{ fontSize: 11, color: "#4a7060", lineHeight: 1.5 }}>{w.explanation}</div>
                    </div>
                  ))}
                </div>
                {/* Conflicts preview */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#111", marginBottom: 8 }}>Key Conflicts</div>
                  {(report.conflictSnapshot?.slice(0, 2) || []).map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, padding: "8px 10px", background: "#f8faf9", borderRadius: 8, marginBottom: 5 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 11 }}>{c.markName}</div>
                        <div style={{ fontSize: 10, color: "#6b8a78" }}>{c.owner}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: `${riskColor(c.risk)}11`, color: riskColor(c.risk), height: "fit-content" }}>{c.risk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paywall overlay */}
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.97) 40%)", borderRadius: 10, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>🔒</div>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#111", marginBottom: 4 }}>See the Full Analysis — $99</div>
                <div style={{ fontSize: 11, color: "#6b8a78", marginBottom: 14, lineHeight: 1.6 }}>
                  Every conflict ranked by risk · Attorney-grade DuPont scoring · Exact recommendation on whether to file, rebrand, or modify · Full PDF delivered to your inbox
                </div>
                <button onClick={() => handlePurchase("report", 99)} style={{ width: "100%", padding: "10px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
                  Unlock Full Report — $99
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Risks - unlocked */}
              {report.whyItMightNotWork?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 11, color: "#c0392b", marginBottom: 8, background: "#fdf2f1", display: "inline-block", padding: "2px 10px", borderRadius: 20 }}> Risks</div>
                  {report.whyItMightNotWork.map((w, i) => (
                    <div key={i} style={{ borderLeft: "3px solid #c0392b", paddingLeft: 10, marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#111" }}>{w.reason}</div>
                      <div style={{ fontSize: 11, color: "#4a7060", lineHeight: 1.5 }}>{w.explanation}</div>
                      {w.legalHook && <div style={{ fontSize: 10, color: "#8aa898", fontStyle: "italic" }}>{w.legalHook}</div>}
                    </div>
                  ))}
                </div>
              )}
              {/* Conflicts - unlocked */}
              {report.conflictSnapshot?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#111", marginBottom: 8 }}>Key Conflicts</div>
                  {report.conflictSnapshot.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, padding: "8px 10px", background: "#f8faf9", borderRadius: 8, marginBottom: 5 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 11 }}>{c.markName}</div>
                        <div style={{ fontSize: 10, color: "#6b8a78" }}>{c.owner}</div>
                        <div style={{ fontSize: 10, color: "#4a7060" }}>{c.reason}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: `${riskColor(c.risk)}11`, color: riskColor(c.risk), height: "fit-content" }}>{c.risk}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ background: "#f0fff4", borderRadius: 10, padding: 14, border: "1px solid #9ae6b4", display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <div style={{ flex: 1, fontSize: 12, color: "#2d7a4f", fontWeight: 700 }}>✓ Report Unlocked</div>
                <button style={{ padding: "9px 16px", background: "#2d7a4f", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12 }}>Download PDF</button>
              </div>
            </>
          )}

          <div style={{ marginTop: 12, background: "#111", borderRadius: 10, padding: 14, border: "1px solid #333" }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#fff", marginBottom: 3 }}>Want attorney-grade analysis?</div>
            <div style={{ fontSize: 11, color: "#999", marginBottom: 12, lineHeight: 1.6 }}>Generate a full AI Legal Memo with all 13 DuPont factors scored, conflict risk matrix, prosecution strategy, and case citations — $149</div>
            <button onClick={() => { setActiveResult(null); setReport(null); generate("memo"); }} style={{ width: "100%", padding: "10px", background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
              Generate AI Legal Memo — $149 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  //  AI Legal Memo result 
  if (activeResult === "memo" && memo) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #eef2f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: "#fff" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#111" }}>️ AI Legal Memo</div>
          <button onClick={() => { setActiveResult(null); setMemo(null); }} style={{ background: "#f4f7f5", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "#111" }}>← Back</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

          {/* Risk summary teaser — never reveals conclusion */}
          <div style={{ background: "#f8faf9", borderRadius: 10, padding: 14, marginBottom: 16, borderLeft: "4px solid #111" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8aa898", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Memo Summary</div>
            <p style={{ fontSize: 12, lineHeight: 1.7, color: "#1a2e23", margin: 0 }}>
              {(() => {
                const high = memo.whyItMightNotWork?.length || 0;
                const dupont = memo.duPontAnalysis?.factors?.length || 0;
                const strat = memo.prosecutionStrategy?.length || 0;
                if (high > 0) return `This memo identifies ${high} high-risk conflict${high !== 1 ? "s" : ""} requiring analysis before filing. Full DuPont scoring and prosecution strategy available in the complete memo.`;
                return `Analysis complete. ${dupont > 0 ? `${dupont} DuPont factors scored.` : ""} ${strat > 0 ? `${strat} prosecution strategies identified.` : ""} Unlock to see the full recommendation.`;
              })()}
            </p>
          </div>

          {/* Locked content rows — show what's inside without giving it away */}
          {!isPaid && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8f5ff", borderRadius: 8, padding: "9px 12px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6b46c1" }}>⚖ DuPont 13-Factor Analysis</span>
                <span style={{ fontSize: 10, color: "#8aa898" }}>all 13 factors — unlock to read</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fdf2f1", borderRadius: 8, padding: "9px 12px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#c0392b" }}>⚠ Conflict Risk Matrix</span>
                <span style={{ fontSize: 10, color: "#8aa898" }}>{memo.riskMatrix?.length || 0} conflicts scored — unlock to read</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f0f7f2", borderRadius: 8, padding: "9px 12px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#2d7a4f" }}>📋 Prosecution Strategy</span>
                <span style={{ fontSize: 10, color: "#8aa898" }}>{memo.prosecutionStrategy?.length || 0} strategies — unlock to read</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff8ec", borderRadius: 8, padding: "9px 12px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#b7791f" }}>📌 Filing Recommendation</span>
                <span style={{ fontSize: 10, color: "#8aa898" }}>file / rebrand / amend — unlock to read</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f5f5f5", borderRadius: 8, padding: "9px 12px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#444" }}>⚖ Case Law Citations</span>
                <span style={{ fontSize: 10, color: "#8aa898" }}>relevant precedent — unlock to read</span>
              </div>
            </div>
          )}

          {/* Full memo content — only shown after purchase */}
          {isPaid && (
            <>
              {memo.duPontAnalysis && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 12, color: "#111", marginBottom: 8 }}>DuPont Analysis</div>
                  <div style={{ fontSize: 10, color: "#6b8a78", lineHeight: 1.6, marginBottom: 8 }}>{memo.duPontAnalysis.overview}</div>
                  {memo.duPontAnalysis.factors?.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, padding: "8px 10px", background: "#f8faf9", borderRadius: 7, marginBottom: 5, alignItems: "flex-start" }}>
                      <div style={{ fontSize: 9, fontWeight: 800, background: "#111", color: "#fff", width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{f.number}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 11, color: "#111" }}>{f.factor}</div>
                        <div style={{ fontSize: 10, color: "#4a7060", lineHeight: 1.4 }}>{f.analysis}</div>
                      </div>
                      <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 5px", borderRadius: 3, height: "fit-content", whiteSpace: "nowrap",
                        background: f.finding === "FAVORABLE" ? "#f0f7f2" : f.finding === "UNFAVORABLE" ? "#fdf2f1" : "#f5f5f5",
                        color: f.finding === "FAVORABLE" ? "#2d7a4f" : f.finding === "UNFAVORABLE" ? "#c0392b" : "#7f8c8d" }}>
                        {f.finding}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {memo.prosecutionStrategy?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 12, color: "#111", marginBottom: 8 }}>Prosecution Strategy</div>
                  {memo.prosecutionStrategy.map((s, i) => (
                    <div key={i} style={{ borderLeft: "3px solid #2d7a4f", paddingLeft: 10, marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 11, color: "#111" }}>{s.action}</div>
                      <div style={{ fontSize: 10, color: "#4a7060", lineHeight: 1.4 }}>{s.rationale}</div>
                      {s.citation && <code style={{ fontSize: 9, color: "#6b8a78", background: "#f0f4f2", padding: "1px 5px", borderRadius: 3 }}>{s.citation}</code>}
                    </div>
                  ))}
                </div>
              )}
              {memo.riskMatrix?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 12, color: "#111", marginBottom: 8 }}>Risk Matrix</div>
                  {memo.riskMatrix.map((r, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 55px 55px", gap: 6, padding: "7px 10px", background: "#f8faf9", borderRadius: 7, marginBottom: 4 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 10 }}>{r.risk}</div>
                        <div style={{ fontSize: 9, color: "#6b8a78" }}>{r.mitigation}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 8, color: "#8aa898" }}>LIKELIHOOD</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: riskColor(r.likelihood) }}>{r.likelihood}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 8, color: "#8aa898" }}>SEVERITY</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: riskColor(r.severity) }}>{r.severity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div style={{ background: "#fffdf7", borderRadius: 10, padding: 14, border: "2px solid #c9a84c" }}>
            {!isPaid ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#111", marginBottom: 3 }}>Full AI Legal Memo PDF — $149</div>
                <div style={{ fontSize: 11, color: "#6b8a78", marginBottom: 10 }}>All 13 DuPont factors · Conflict risk matrix · Prosecution strategy · Filing recommendation · Case citations · PDF delivered to inbox</div>
                <button onClick={() => handlePurchase("memo", 149)} style={{ width: "100%", padding: "9px", background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 8, fontWeight: 800, fontSize: 12 }}>
                  Unlock Full Memo — $149
                </button>
              </>
            ) : (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ flex: 1, fontSize: 12, color: "#2d7a4f", fontWeight: 700 }}>✓ Memo Unlocked</div>
                <button style={{ padding: "9px 16px", background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 8, fontWeight: 800, fontSize: 12 }}>Download PDF</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

//  Main Page 

export default function SearchPage() {
  const router = useRouter();
  const { mark } = router.query;

  const [trademarks, setTrademarks] = useState([]);
  const [usptoCount, setUsptoCount] = useState(null);
  const [activeCount, setActiveCount] = useState(null);
  const [usptoStatus, setUsptoStatus] = useState("loading");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newSearchInput, setNewSearchInput] = useState("");

  useEffect(() => { if (mark) setNewSearchInput(mark); }, [mark]);

  useEffect(() => {
    if (!mark) return;
    setUsptoStatus("loading");
    setTrademarks([]);

    // Call our server-side proxy which hits USPTO's own OpenSearch API directly
    fetch(`/api/trademark-search?mark=${encodeURIComponent(mark.trim())}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        const items = data.items || [];
        setTrademarks(items);
        setUsptoCount(items.length);
        setActiveCount(data.activeCount || 0);
        setUsptoStatus("done");
      })
      .catch(() => setUsptoStatus("error"));
  }, [mark]);

  function handleNewSearch(e) {
    e.preventDefault();
    if (newSearchInput.trim()) router.push(`/search?mark=${encodeURIComponent(newSearchInput.trim())}`);
  }

  const filteredMarks = trademarks.filter(t => {
    if (filterStatus === "active") return statusStyle(t.status).label === "Registered";
    if (filterStatus === "pending") return statusStyle(t.status).label === "Pending";
    if (filterStatus === "dead") return statusStyle(t.status).category === "dead";
    return true;
  });

  if (!mark) return null;

  return (
    <>
      <Head>
        <title>Free USPTO Trademark Search | MarkItNow.ai</title>
        <meta name="description" content="Search the live USPTO trademark database free. See active marks, dead marks, owner info, and filing dates. Instant results across 4M+ federal trademark registrations." />
        <meta name="keywords" content="free trademark search, USPTO TESS search, trademark database search, check trademark availability, trademark conflict search, is my trademark available" />
        <meta property="og:title" content="Free USPTO Trademark Search | MarkItNow.ai" />
        <meta property="og:description" content="Search the live USPTO trademark database free. See active marks, dead marks, owner info, and filing dates. Instant results across 4M+ federal trademark registrations." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MarkItNow.ai" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Free USPTO Trademark Search | MarkItNow.ai" />
        <meta name="twitter:description" content="Search the live USPTO trademark database free. See active marks, dead marks, owner info, and filing dates. Instant results across 4M+ federal trademark registrations." />
      </Head>
      <style>{`
        @keyframes mni-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'DM Sans', system-ui, sans-serif; }
      `}</style>

      <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ background: "#111", padding: "10px 24px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <a href="/" style={{ background: "rgba(255,255,255,0.1)", color: "#555", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>← MarkItNow</a>
          <form onSubmit={handleNewSearch} style={{ flex: 1, display: "flex", gap: 8, maxWidth: 540 }}>
            <input value={newSearchInput} onChange={e => setNewSearchInput(e.target.value)}
              style={{ flex: 1, padding: "7px 14px", borderRadius: 7, border: "1.5px solid rgba(255,255,255,0.15)", background: "#f4f4f4", color: "#111", fontSize: 14, fontFamily: "inherit", outline: "none" }}
              placeholder="Search another mark..." />
            <button type="submit" style={{ padding: "7px 16px", background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 7, fontWeight: 800, fontSize: 13 }}>Search</button>
          </form>
          <a href={`/file?mark=${encodeURIComponent(mark)}`} style={{ background: "#c9a84c", color: "#0a0a0a", padding: "7px 14px", borderRadius: 7, fontWeight: 800, fontSize: 13, whiteSpace: "nowrap" }}>Don't file blind - Get Analysis</a>
        </div>

        {/* Split pane */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 30%", overflow: "hidden" }}>

          {/* LEFT: USPTO results */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid #d4e0da", background: "#fff" }}>
            {/* Panel header */}
            <div style={{ padding: "14px 22px", borderBottom: "1px solid #eef2f0", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: usptoStatus === "loading" ? "#f1c40f" : usptoStatus === "done" ? "#2ecc71" : "#e74c3c",
                    animation: usptoStatus === "loading" ? "mni-pulse 1s infinite" : "none" }} />
                  <span style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>USPTO Database</span>
                  <span style={{ fontSize: 9, fontWeight: 700, background: "#c9a84c", padding: "2px 7px", borderRadius: 4, letterSpacing: 1.2, color: "#fff" }}>LIVE</span>
                </div>
                {usptoStatus === "done" && (
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "#111" }}>{usptoCount?.toLocaleString()}</span>
                    <span style={{ fontSize: 11, color: "#8aa898", marginLeft: 6 }}>marks · </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: activeCount > 0 ? "#c0392b" : "#2d7a4f" }}>{activeCount} active</span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#6b8a78" }}>
                Results for: <strong style={{ color: "#111" }}>"{mark}"</strong>
                {trademarks.length > 0 && ` expanded search includes first keyword`}
              </div>
              {usptoStatus === "done" && trademarks.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  {[["all", "All"], ["active", "Live (Registered)"], ["pending", "Live (Pending)"], ["dead", "Dead"]].map(([val, label]) => (
                    <button key={val} onClick={() => setFilterStatus(val)} style={{ padding: "3px 10px", borderRadius: 20, border: "1px solid", borderColor: filterStatus === val ? "#111" : "#d4e3d9", background: filterStatus === val ? "#111" : "#fff", color: filterStatus === val ? "#fff" : "#6b8a78", fontSize: 10, fontWeight: 600 }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Results */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {usptoStatus === "loading" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 280, color: "#6b8a78" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}></div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>Searching USPTO database...</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Running parallel queries · Deduplicating results</div>
                </div>
              )}

              {usptoStatus === "error" && (
                <div style={{ margin: 16, padding: 14, background: "#fdf2f1", borderRadius: 10, color: "#c0392b", fontSize: 12, lineHeight: 1.6 }}>
                  <strong>USPTO search unavailable.</strong><br />
                  Check that RAPIDAPI_KEY is set in .env.local and restart the dev server with <code>npm run dev</code>.
                </div>
              )}

              {usptoStatus === "done" && filteredMarks.length === 0 && (
                <div style={{ margin: 16, padding: 18, background: "#f0f7f2", borderRadius: 12, color: "#2d7a4f" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}> No matching marks found</div>
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                    {filterStatus === "all"
                      ? `No USPTO marks found matching "${mark}" or its keywords. Positive indicator for registrability proceed with AI analysis.`
                      : `No ${filterStatus} marks for this filter. Try "All" to see all results.`}
                  </div>
                </div>
              )}

              {usptoStatus === "done" && filteredMarks.length > 0 && (
                <>
                  {/* Cards */}
                  <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {filteredMarks.map((t, i) => {
                      const ss = statusStyle(t.status);
                      return (
                        <div key={i} style={{ border: "1px solid #e0e8e4", borderRadius: 8, background: "#fff", padding: "10px 12px", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
                          {/* Wordmark header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                            <div>
                              <div style={{ fontSize: 9, fontWeight: 700, color: "#8aa898", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>{t.markType || "Wordmark"}</div>
                              <div style={{ fontWeight: 900, fontSize: 16, color: "#111", letterSpacing: 0.5, fontFamily: "Georgia, serif" }}>{t.markName}</div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{
                                  fontSize: 10, fontWeight: 800, borderRadius: 4, padding: "2px 7px",
                                  color: "#fff",
                                  background: ss.category === "live"
                                    ? (ss.label === "Pending" ? "#e8a000" : "#00a846")
                                    : "#d93025",
                                }}>
                                  {ss.category === "live" ? "LIVE" : "DEAD"} / {ss.label}
                                </span>
                              </div>
                              {t.registrationDate && <div style={{ fontSize: 9, color: "#aab8b2" }}>Reg. {t.registrationDate}</div>}
                            </div>
                          </div>

                          {/* Detail grid */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 12px", fontSize: 12 }}>
                            <div>
                              <div style={{ fontSize: 9, fontWeight: 700, color: "#8aa898", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 1 }}>Serial</div>
                              <div style={{ color: "#111", fontWeight: 600 }}>
                                {t.serialNumber}
                                {t.serialNumber && (
                                  <a href={`https://tsdr.uspto.gov/#caseNumber=${t.serialNumber}&caseType=SERIAL_NO&searchType=statusSearch`} target="_blank" rel="noreferrer" style={{ marginLeft: 5, color: "#2d7a4f", fontWeight: 700, fontSize: 10 }}>USPTO ↗</a>
                                )}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 9, fontWeight: 700, color: "#8aa898", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 1 }}>Filing Date</div>
                              <div style={{ color: "#111" }}>{t.filingDate || "—"}</div>
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: "#8aa898", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 1 }}>Owner</div>
                              <div style={{ color: "#111" }}>{t.owner}</div>
                            </div>
                            {t.classCode && (
                              <div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: "#8aa898", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 1 }}>Class</div>
                                <div style={{ color: "#111", fontWeight: 600 }}>{t.classCode}</div>
                              </div>
                            )}
                            {t.description && (
                              <div style={{ gridColumn: "1 / -1" }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: "#8aa898", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 1 }}>Goods &amp; Services</div>
                                <div style={{ color: "#4a7060", lineHeight: 1.4 }}>{t.description}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ padding: "10px 22px", background: "#f8faf9", fontSize: 10, color: "#8aa898", borderTop: "1px solid #eef2f0" }}>
                    {filteredMarks.length} result{filteredMarks.length !== 1 ? "s" : ""} · RapidAPI USPTO ·{" "}
                    <a href="https://tmsearch.uspto.gov" target="_blank" rel="noreferrer" style={{ color: "#2d7a4f" }}>Open USPTO Search ↗</a>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT: AI Analysis + Purchase */}
          <div style={{ background: "#fff", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <PurchasePanel mark={mark} trademarks={trademarks} loading={usptoStatus === "loading"} />
          </div>
        </div>
      </div>
      <ChatWidget />
    </>
  );
}