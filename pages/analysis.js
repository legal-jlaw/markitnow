// pages/analysis.js
// ─────────────────────────────────────────────────────────────────────────────
// AI Analysis Report page
// - Accepts mark + goods/services + class from query params or form
// - Calls /api/analysis-agent (Agent 1)
// - Displays results with risk scores, DuPont breakdown, recommendation
// - Purchase CTA gates PDF delivery (Stripe)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Head from "next/head";
import Nav from "../components/Nav";

const RISK_COLORS = {
  HIGH: { bg: "#fff0f0", border: "#e53e3e", text: "#c53030", badge: "#e53e3e" },
  MEDIUM: { bg: "#fffbeb", border: "#d69e2e", text: "#b7791f", badge: "#d69e2e" },
  LOW: { bg: "#f0fff4", border: "#38a169", text: "#276749", badge: "#38a169" },
  UNKNOWN: { bg: "#f7fafc", border: "#a0aec0", text: "#718096", badge: "#a0aec0" },
};

const ACTION_LABELS = {
  PROCEED: { label: "Clear to File", color: "#38a169" },
  PROCEED_WITH_CAUTION: { label: "Proceed with Caution", color: "#d69e2e" },
  REBRAND_RECOMMENDED: { label: "Rebrand Recommended", color: "#e53e3e" },
  CONSULT_ATTORNEY: { label: "Attorney Review Needed", color: "#805ad5" },
};

export default function AnalysisPage() {
  const [mark, setMark] = useState("");
  const [goodsServices, setGoodsServices] = useState("");
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("");

  const runAgent = async () => {
    if (!mark.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);

    // Simulate step feedback for UX
    const steps = [
      "Searching USPTO database...",
      "Running phonetic variation search...",
      "Scoring conflicts against DuPont factors...",
      "Analyzing registrability...",
      "Generating report...",
    ];
    let i = 0;
    setStep(steps[0]);
    const interval = setInterval(() => {
      i = Math.min(i + 1, steps.length - 1);
      setStep(steps[i]);
    }, 4000);

    try {
      const res = await fetch("/api/analysis-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark, goodsServices, classCode }),
      });
      clearInterval(interval);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Agent error");
      setReport(data);
      setStep("");
    } catch (e) {
      clearInterval(interval);
      setError(e.message);
      setStep("");
    } finally {
      setLoading(false);
    }
  };

  const risk = report?.scoring?.overallRisk || "UNKNOWN";
  const colors = RISK_COLORS[risk] || RISK_COLORS.UNKNOWN;
  const action = report?.analysis?.recommendation?.action;
  const actionMeta = ACTION_LABELS[action] || null;

  return (
    <>
      <Head>
        <title>AI Analysis Report | MarkItNow.ai</title>
        <meta name="description" content="Run a multi-step AI trademark analysis. USPTO conflict search, DuPont factor scoring, and registrability assessment in one report." />
      </Head>
      <Nav />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "inline-block", background: "#f4f0e8", color: "#c9a84c", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 4, marginBottom: 12, letterSpacing: 1 }}>
            AI ANALYSIS REPORT
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111", margin: "0 0 12px" }}>
            Is your trademark safe to file?
          </h1>
          <p style={{ fontSize: 16, color: "#555", margin: 0, lineHeight: 1.6 }}>
            Multi-step USPTO conflict search, DuPont factor scoring, and registrability assessment. Delivered as a PDF for $99.
          </p>
        </div>

        {/* Input Form */}
        <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, padding: 32, marginBottom: 32 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 8 }}>
              TRADEMARK / BRAND NAME *
            </label>
            <input
              value={mark}
              onChange={(e) => setMark(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runAgent()}
              placeholder="e.g. Strange Water, Pineapple Sol, City of Gods"
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e0e0e0", borderRadius: 6, fontSize: 15, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 8 }}>
              GOODS / SERVICES (optional but improves accuracy)
            </label>
            <input
              value={goodsServices}
              onChange={(e) => setGoodsServices(e.target.value)}
              placeholder="e.g. Restaurant services, live music events, clothing"
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e0e0e0", borderRadius: 6, fontSize: 15, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 8 }}>
              NICE CLASS (optional)
            </label>
            <input
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              placeholder="e.g. 41 (entertainment), 43 (restaurant), 25 (clothing)"
              style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e0e0e0", borderRadius: 6, fontSize: 15, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <button
            onClick={runAgent}
            disabled={loading || !mark.trim()}
            style={{
              width: "100%",
              background: loading ? "#999" : "#111",
              color: "#fff",
              border: "none",
              padding: "14px 24px",
              borderRadius: 6,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Running Analysis..." : "Run Free Analysis"}
          </button>
          <p style={{ fontSize: 12, color: "#999", textAlign: "center", marginTop: 10, marginBottom: 0 }}>
            Free preview. Full PDF report with all conflict details: $99.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>{step}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
              {["Retrieve", "Score", "Rank", "QC"].map((s, i) => (
                <div key={s} style={{ padding: "6px 14px", background: i === 0 ? "#c9a84c" : "#f4f4f4", color: i === 0 ? "#fff" : "#999", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "#fff0f0", border: "1px solid #e53e3e", borderRadius: 8, padding: 20, color: "#c53030", marginBottom: 24 }}>
            {error}
          </div>
        )}

        {/* Report Output */}
        {report && (
          <div>

            {/* Risk banner */}
            <div style={{ background: colors.bg, border: `1.5px solid ${colors.border}`, borderRadius: 10, padding: 24, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors.text, letterSpacing: 1, marginBottom: 4 }}>OVERALL RISK</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: colors.text }}>{risk}</div>
                <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
                  {report.retrieval.activeCount} active conflicts found out of {report.retrieval.totalFound} total
                </div>
              </div>
              {actionMeta && (
                <div style={{ background: actionMeta.color, color: "#fff", padding: "10px 20px", borderRadius: 6, fontWeight: 700, fontSize: 14 }}>
                  {actionMeta.label}
                </div>
              )}
            </div>

            {/* Executive Summary */}
            <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, padding: 24, marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 12px" }}>Executive Summary</h2>
              <p style={{ fontSize: 15, color: "#333", lineHeight: 1.7, margin: 0 }}>
                {report.analysis.executiveSummary}
              </p>
            </div>

            {/* Registrability */}
            {report.analysis.registrabilityAssessment && (
              <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, padding: 24, marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 16px" }}>Registrability Assessment</h2>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                  <div style={{ background: "#f4f4f4", borderRadius: 6, padding: "8px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 2 }}>MARK STRENGTH</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{report.analysis.registrabilityAssessment.distinctiveness}</div>
                  </div>
                  <div style={{ background: "#f4f4f4", borderRadius: 6, padding: "8px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#777", marginBottom: 2 }}>REGISTRATION LIKELIHOOD</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{report.analysis.registrabilityAssessment.likelihood}</div>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7, margin: 0 }}>
                  {report.analysis.registrabilityAssessment.reasoning}
                </p>
              </div>
            )}

            {/* Top Conflict */}
            {report.analysis.topConflict?.markName && (
              <div style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: 10, padding: 24, marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 16px" }}>
                  Highest-Risk Conflict
                </h2>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#111", marginBottom: 4 }}>
                  {report.analysis.topConflict.markName}
                </div>
                {report.analysis.topConflict.serialNumber && (
                  <div style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>
                    Serial No. {report.analysis.topConflict.serialNumber}
                  </div>
                )}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#777", marginBottom: 4 }}>WHY IT MATTERS</div>
                  <p style={{ fontSize: 14, color: "#333", lineHeight: 1.7, margin: 0 }}>
                    {report.analysis.topConflict.whyItMatters}
                  </p>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#777", marginBottom: 4 }}>WHAT TO DO</div>
                  <p style={{ fontSize: 14, color: "#333", lineHeight: 1.7, margin: 0 }}>
                    {report.analysis.topConflict.whatToDoAboutIt}
                  </p>
                </div>
              </div>
            )}

            {/* Conflict list preview - first 3 */}
            {report.scoring.scoredConflicts?.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, padding: 24, marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>
                  Conflict Breakdown
                </h2>
                <p style={{ fontSize: 13, color: "#999", margin: "0 0 20px" }}>
                  Showing 3 of {report.scoring.scoredConflicts.length} scored conflicts. Full list in PDF report.
                </p>
                {report.scoring.scoredConflicts.slice(0, 3).map((c, i) => {
                  const cc = RISK_COLORS[c.riskScore] || RISK_COLORS.LOW;
                  return (
                    <div key={i} style={{ borderTop: i > 0 ? "1px solid #f0f0f0" : "none", paddingTop: i > 0 ? 16 : 0, marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{c.markName}</span>
                          <span style={{ fontSize: 12, color: "#999", marginLeft: 8 }}>{c.owner}</span>
                        </div>
                        <span style={{ background: cc.badge, color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                          {c.riskScore}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.6 }}>
                        {c.riskReasoning}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Next Steps */}
            {report.analysis.recommendation?.nextSteps && (
              <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, padding: 24, marginBottom: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 16px" }}>Recommended Next Steps</h2>
                {report.analysis.recommendation.nextSteps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#c9a84c", color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <p style={{ fontSize: 14, color: "#333", margin: 0, lineHeight: 1.6 }}>{step}</p>
                  </div>
                ))}
              </div>
            )}

            {/* PDF CTA */}
            <div style={{ background: "#111", borderRadius: 10, padding: 32, textAlign: "center" }}>
              <div style={{ color: "#c9a84c", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                FULL REPORT
              </div>
              <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 12px" }}>
                Get the complete AI Analysis Report
              </h3>
              <p style={{ color: "#aaa", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
                All {report.scoring.scoredConflicts?.length || 0} scored conflicts with full DuPont breakdowns, registrability analysis, and filing strategy. Delivered as a PDF instantly.
              </p>
              <button
                style={{ background: "#c9a84c", color: "#fff", border: "none", padding: "14px 32px", borderRadius: 6, fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 12 }}
                onClick={() => window.location.href = `/pricing?mark=${encodeURIComponent(mark)}`}
              >
                Get Full PDF Report - $99
              </button>
              <div style={{ color: "#666", fontSize: 12 }}>
                Instant delivery. No account required.
              </div>
            </div>

            {/* Disclaimer */}
            <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 24, lineHeight: 1.7 }}>
              {report.analysis.disclaimer}
            </p>

            {/* QC badge (dev mode) */}
            {report.qc && !report.qc.passed && (
              <div style={{ background: "#fff0f0", border: "1px solid #e53e3e", borderRadius: 6, padding: 12, marginTop: 16, fontSize: 12, color: "#c53030" }}>
                QC Issues: {report.qc.issues.join(", ")}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
