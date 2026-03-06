import Nav from "../components/Nav";
import ChatWidget from "../components/ChatWidget";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

//  Helpers 

function statusStyle(status = "") {
  const s = status.toLowerCase();
  if (s.includes("live") || s.includes("regist")) return { color: "#1a7a3c", bg: "#e8f7ee", dot: "#2ecc71" };
  if (s.includes("pending") || s.includes("published")) return { color: "#7a5c00", bg: "#fffae8", dot: "#f1c40f" };
  return { color: "#7a1a1a", bg: "#faeee8", dot: "#e74c3c" };
}

function riskColor(r) {
  return r === "HIGH" ? "#c0392b" : r === "MEDIUM" ? "#e67e22" : "#2d7a4f";
}

function scoreColor(s) {
  return s >= 70 ? "#2d7a4f" : s >= 45 ? "#e67e22" : "#c0392b";
}

//  Purchase / Analysis Panel 

function PurchasePanel({ mark, trademarks, loading, initialPaid }) {
  const [activeResult, setActiveResult] = useState(null);
  const [goods, setGoods] = useState("");
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [memo, setMemo] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  // Accept payment status from parent (Stripe redirect verification)
  useEffect(() => {
    if (initialPaid) setIsPaid(true);
  }, [initialPaid]);

  async function handleEmailCapture(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailLoading(true);
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mark, source: "search_results" }),
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

    try {
      const res = await fetch("/api/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          mark,
          goods: goods || "",
          trademarks,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("AI report error:", err);
        setGenerating(false);
        return;
      }

      const parsed = await res.json();
      if (type === "report") setReport(parsed);
      else setMemo(parsed);
    } catch (e) {
      console.error("AI report fetch error:", e);
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

  async function downloadPDF(type) {
    const data = type === "report" ? report : memo;
    if (!data) return;

    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, mark, goods, data }),
      });

      if (!res.ok) {
        console.error("PDF generation failed:", await res.text());
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MarkItNow-${type === "report" ? "Report" : "Memo"}-${mark.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF download error:", e);
    }
  }

  //  Idle: show product cards 
  if (!activeResult) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #eef2f0" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#8aa898", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>AI Analysis</div>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: "#0f1e3c", margin: "0 0 6px" }}>
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
          <div style={{ margin: "0", padding: "12px 20px", background: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>Get a free PDF of these results</div>
            <form onSubmit={handleEmailCapture} style={{ display: "flex", gap: 6 }}>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com"
                style={{ flex: 1, padding: "7px 10px", borderRadius: 7, border: "1px solid #fcd34d", fontSize: 12, fontFamily: "inherit", outline: "none", background: "#fff", minWidth: 0 }} />
              <button type="submit" disabled={emailLoading} style={{ background: "#c9a84c", color: "#111", border: "none", borderRadius: 7, padding: "7px 12px", fontWeight: 800, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>
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
          {/* Goods input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#0f1e3c", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>
              What does your brand do?
            </label>
            <textarea
              value={goods}
              onChange={e => setGoods(e.target.value)}
              placeholder="e.g. Sparkling water and health beverages sold online..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #d4e3d9", fontSize: 12, fontFamily: "inherit", background: "#f8faf9", color: "#1a2e23", outline: "none", resize: "none", minHeight: 60, boxSizing: "border-box" }}
            />
          </div>

          {/* Client Report card */}
          <div style={{ border: "1.5px solid #d4e3d9", borderRadius: 12, padding: 16, marginBottom: 12, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#0f1e3c" }}> Client Report</div>
                <div style={{ fontSize: 11, color: "#6b8a78", marginTop: 2 }}>Plain English · Risk assessment · Conflict analysis</div>
              </div>
              <div style={{ background: "#f0f7f2", color: "#2d7a4f", fontWeight: 800, fontSize: 11, padding: "3px 8px", borderRadius: 5 }}>Free Preview</div>
            </div>
            <div style={{ fontSize: 11, color: "#4a7060", lineHeight: 1.6, marginBottom: 12 }}>
              Summary + pros/cons + conflict breakdown. Full PDF (with DuPont memo) unlocks for $99.
            </div>
            <button onClick={() => generate("report")} style={{ width: "100%", padding: "9px", background: "#0f1e3c", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Generate Client Report Free →
            </button>
          </div>

          {/* Attorney Memo card */}
          <div style={{ border: "2px solid #c9a84c", borderRadius: 12, padding: 16, marginBottom: 12, background: "#fffdf7" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#0f1e3c" }}>️ Attorney Memo</div>
                <div style={{ fontSize: 11, color: "#6b8a78", marginTop: 2 }}>DuPont analysis · Case citations · Prosecution strategy</div>
              </div>
              <div style={{ background: "#c9a84c", color: "#0a0a0a", fontWeight: 800, fontSize: 11, padding: "3px 8px", borderRadius: 5 }}>Free Preview</div>
            </div>
            <div style={{ fontSize: 11, color: "#4a7060", lineHeight: 1.6, marginBottom: 12 }}>
              Full legal memo w/ DuPont 13-factor analysis, risk matrix, prosecution strategy. PDF unlocks for $149.
            </div>
            <button onClick={() => generate("memo")} style={{ width: "100%", padding: "9px", background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 8, fontWeight: 800, fontSize: 12 }}>
              Generate Attorney Memo Free →
            </button>
          </div>

          {/* File CTA */}
          <div style={{ background: "#0f1e3c", borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#e8e8e8", marginBottom: 4 }}> Skip straight to filing?</div>
            <div style={{ fontSize: 11, color: "#a0aab4", lineHeight: 1.6, marginBottom: 10 }}>
              U.S. Licensed Attorney reviews your application and files TEAS Plus. $399 flat $100 less than Trademarkia.
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
        <div style={{ fontWeight: 800, fontSize: 16, color: "#0f1e3c", marginBottom: 6 }}>
          {activeResult === "report" ? "Analyzing conflicts..." : "Drafting attorney memo..."}
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

  //  Client Report result
  if (activeResult === "report" && report) {
    const sc = report.clientConfidenceScore || 50;
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {/* Sticky header */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #eef2f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: "#fff" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#0f1e3c" }}> Client Report</div>
          <button onClick={() => { setActiveResult(null); setReport(null); }} style={{ background: "#f4f7f5", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "#0f1e3c", cursor: "pointer" }}>← Back</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {/* Score card — always visible */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, background: "#f8faf9", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#8aa898", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Bottom Line</div>
              <p style={{ fontSize: 12, lineHeight: 1.7, color: "#1a2e23", margin: 0 }}>{report.executiveSummary}</p>
            </div>
            <div style={{ width: 78, background: `${scoreColor(sc)}11`, border: `2px solid ${scoreColor(sc)}`, borderRadius: 10, padding: 10, textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: scoreColor(sc), lineHeight: 1 }}>{sc}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: "#8aa898", marginTop: 3, textTransform: "uppercase" }}>Confidence</div>
              <div style={{ fontSize: 9, fontWeight: 800, marginTop: 3, color: scoreColor(sc) }}>{report.overallRiskLevel}</div>
            </div>
          </div>

          {/* Could work — show first item free, blur rest */}
          {report.whyItCouldWork?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: "#2d7a4f", marginBottom: 8, background: "#f0f7f2", display: "inline-block", padding: "2px 10px", borderRadius: 20 }}> Why It Could Work</div>
              {/* First item — always visible */}
              <div style={{ borderLeft: "3px solid #2d7a4f", paddingLeft: 10, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#0f1e3c" }}>{report.whyItCouldWork[0].reason}</div>
                <div style={{ fontSize: 11, color: "#4a7060", lineHeight: 1.5 }}>{report.whyItCouldWork[0].explanation}</div>
              </div>
              {/* Remaining items — blurred unless paid */}
              {report.whyItCouldWork.length > 1 && !isPaid && (
                <div style={{ position: "relative" }}>
                  <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none", opacity: 0.6 }}>
                    {report.whyItCouldWork.slice(1, 3).map((w, i) => (
                      <div key={i} style={{ borderLeft: "3px solid #2d7a4f", paddingLeft: 10, marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: "#0f1e3c" }}>{w.reason}</div>
                        <div style={{ fontSize: 11, color: "#4a7060", lineHeight: 1.5 }}>{w.explanation}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ background: "#0f1e3c", color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>+{report.whyItCouldWork.length - 1} more in full report</span>
                  </div>
                </div>
              )}
              {/* Show all when paid */}
              {report.whyItCouldWork.length > 1 && isPaid && report.whyItCouldWork.slice(1).map((w, i) => (
                <div key={i} style={{ borderLeft: "3px solid #2d7a4f", paddingLeft: 10, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#0f1e3c" }}>{w.reason}</div>
                  <div style={{ fontSize: 11, color: "#4a7060", lineHeight: 1.5 }}>{w.explanation}</div>
                  {w.legalHook && <div style={{ fontSize: 10, color: "#8aa898", fontStyle: "italic" }}>{w.legalHook}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Risks — show first item free, blur rest */}
          {report.whyItMightNotWork?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: "#c0392b", marginBottom: 8, background: "#fdf2f1", display: "inline-block", padding: "2px 10px", borderRadius: 20 }}> Risks</div>
              {/* First item — always visible */}
              <div style={{ borderLeft: "3px solid #c0392b", paddingLeft: 10, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#0f1e3c" }}>{report.whyItMightNotWork[0].reason}</div>
                <div style={{ fontSize: 11, color: "#4a7060", lineHeight: 1.5 }}>{report.whyItMightNotWork[0].explanation}</div>
              </div>
              {/* Remaining items — blurred unless paid */}
              {report.whyItMightNotWork.length > 1 && !isPaid && (
                <div style={{ position: "relative" }}>
                  <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none", opacity: 0.6 }}>
                    {report.whyItMightNotWork.slice(1, 3).map((w, i) => (
                      <div key={i} style={{ borderLeft: "3px solid #c0392b", paddingLeft: 10, marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: "#0f1e3c" }}>{w.reason}</div>
                        <div style={{ fontSize: 11, color: "#4a7060", lineHeight: 1.5 }}>{w.explanation}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ background: "#c0392b", color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>+{report.whyItMightNotWork.length - 1} more risks identified</span>
                  </div>
                </div>
              )}
              {/* Show all when paid */}
              {report.whyItMightNotWork.length > 1 && isPaid && report.whyItMightNotWork.slice(1).map((w, i) => (
                <div key={i} style={{ borderLeft: "3px solid #c0392b", paddingLeft: 10, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#0f1e3c" }}>{w.reason}</div>
                  <div style={{ fontSize: 11, color: "#4a7060", lineHeight: 1.5 }}>{w.explanation}</div>
                  {w.legalHook && <div style={{ fontSize: 10, color: "#8aa898", fontStyle: "italic" }}>{w.legalHook}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Conflicts — fully gated */}
          {report.conflictSnapshot?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#0f1e3c", marginBottom: 8 }}>Key Conflicts ({report.conflictSnapshot.length})</div>
              {!isPaid ? (
                <div style={{ position: "relative" }}>
                  <div style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none", opacity: 0.5 }}>
                    {report.conflictSnapshot.slice(0, 3).map((c, i) => (
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
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ background: "#0f1e3c", color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>{report.conflictSnapshot.length} conflicts — unlock to view details</span>
                  </div>
                </div>
              ) : (
                report.conflictSnapshot.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "8px 10px", background: "#f8faf9", borderRadius: 8, marginBottom: 5 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 11 }}>{c.markName}</div>
                      <div style={{ fontSize: 10, color: "#6b8a78" }}>{c.owner}</div>
                      <div style={{ fontSize: 10, color: "#4a7060" }}>{c.reason}</div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: `${riskColor(c.risk)}11`, color: riskColor(c.risk), height: "fit-content" }}>{c.risk}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Unlock / Download CTA */}
          {!isPaid ? (
            <div style={{ background: "linear-gradient(135deg, #c9a84c 0%, #b8942f 100%)", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: "#fff", marginBottom: 4 }}>Unlock Full Report</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", marginBottom: 12, lineHeight: 1.5 }}>All conflicts · DuPont analysis · Legal hooks · Prosecution strategy · Downloadable PDF</div>
              <button onClick={() => handlePurchase("report", 99)} style={{ width: "100%", padding: "11px", background: "#fff", color: "#0f1e3c", border: "none", borderRadius: 8, fontWeight: 900, fontSize: 14, cursor: "pointer", letterSpacing: -0.3 }}>
                Get Full Report — $99
              </button>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 8 }}>Instant PDF delivery · Money back guarantee</div>
            </div>
          ) : (
            <div style={{ background: "#f0f7f2", borderRadius: 10, padding: 14, border: "2px solid #2d7a4f" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ flex: 1, fontSize: 12, color: "#2d7a4f", fontWeight: 700 }}> Report Unlocked</div>
                <button onClick={() => downloadPDF("report")} style={{ padding: "9px 16px", background: "#2d7a4f", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Download PDF</button>
              </div>
            </div>
          )}

          <button onClick={() => { setActiveResult(null); setReport(null); generate("memo"); }} style={{ marginTop: 10, width: "100%", padding: "9px", background: "#fffdf7", border: "2px solid #c9a84c", borderRadius: 8, fontWeight: 700, fontSize: 11, color: "#7a5c00", cursor: "pointer" }}>
            Also generate Attorney Memo →
          </button>
        </div>
      </div>
    );
  }

  //  Attorney Memo result
  if (activeResult === "memo" && memo) {
    const duPontFactors = memo.duPontAnalysis?.factors || [];
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #eef2f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: "#fff" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#0f1e3c" }}>️ Attorney Memo</div>
          <button onClick={() => { setActiveResult(null); setMemo(null); }} style={{ background: "#f4f7f5", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "#0f1e3c", cursor: "pointer" }}>← Back</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {/* Memo summary — always visible */}
          <div style={{ background: "#f8faf9", borderRadius: 10, padding: 14, marginBottom: 16, borderLeft: "4px solid #0f1e3c" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8aa898", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Memo Summary</div>
            <p style={{ fontSize: 12, lineHeight: 1.7, color: "#1a2e23", margin: 0 }}>{memo.memoSummary}</p>
          </div>

          {/* DuPont Analysis — show first 2 factors free, blur rest */}
          {memo.duPontAnalysis && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: "#0f1e3c", marginBottom: 8 }}>DuPont Analysis</div>
              <div style={{ fontSize: 10, color: "#6b8a78", lineHeight: 1.6, marginBottom: 8 }}>{memo.duPontAnalysis.overview}</div>
              {/* First 2 factors — always visible */}
              {duPontFactors.slice(0, 2).map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 8, padding: "8px 10px", background: "#f8faf9", borderRadius: 7, marginBottom: 5, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 9, fontWeight: 800, background: "#0f1e3c", color: "#fff", width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{f.number}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 11, color: "#0f1e3c" }}>{f.factor}</div>
                    <div style={{ fontSize: 10, color: "#4a7060", lineHeight: 1.4 }}>{f.analysis}</div>
                  </div>
                  <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 5px", borderRadius: 3, height: "fit-content", whiteSpace: "nowrap",
                    background: f.finding === "FAVORABLE" ? "#f0f7f2" : f.finding === "UNFAVORABLE" ? "#fdf2f1" : "#f5f5f5",
                    color: f.finding === "FAVORABLE" ? "#2d7a4f" : f.finding === "UNFAVORABLE" ? "#c0392b" : "#7f8c8d" }}>
                    {f.finding}
                  </span>
                </div>
              ))}
              {/* Remaining factors — blurred unless paid */}
              {duPontFactors.length > 2 && !isPaid && (
                <div style={{ position: "relative" }}>
                  <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none", opacity: 0.5 }}>
                    {duPontFactors.slice(2, 5).map((f, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, padding: "8px 10px", background: "#f8faf9", borderRadius: 7, marginBottom: 5, alignItems: "flex-start" }}>
                        <div style={{ fontSize: 9, fontWeight: 800, background: "#0f1e3c", color: "#fff", width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{f.number}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 11, color: "#0f1e3c" }}>{f.factor}</div>
                          <div style={{ fontSize: 10, color: "#4a7060", lineHeight: 1.4 }}>{f.analysis}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ background: "#0f1e3c", color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>+{duPontFactors.length - 2} more DuPont factors in full memo</span>
                  </div>
                </div>
              )}
              {/* Show all when paid */}
              {duPontFactors.length > 2 && isPaid && duPontFactors.slice(2).map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 8, padding: "8px 10px", background: "#f8faf9", borderRadius: 7, marginBottom: 5, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 9, fontWeight: 800, background: "#0f1e3c", color: "#fff", width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{f.number}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 11, color: "#0f1e3c" }}>{f.factor}</div>
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

          {/* Prosecution Strategy — fully gated */}
          {memo.prosecutionStrategy?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: "#0f1e3c", marginBottom: 8 }}>Prosecution Strategy ({memo.prosecutionStrategy.length} steps)</div>
              {!isPaid ? (
                <div style={{ position: "relative" }}>
                  <div style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none", opacity: 0.5 }}>
                    {memo.prosecutionStrategy.slice(0, 3).map((s, i) => (
                      <div key={i} style={{ borderLeft: "3px solid #2d7a4f", paddingLeft: 10, marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 11, color: "#0f1e3c" }}>{s.action}</div>
                        <div style={{ fontSize: 10, color: "#4a7060", lineHeight: 1.4 }}>{s.rationale}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ background: "#2d7a4f", color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>Unlock to view prosecution strategy</span>
                  </div>
                </div>
              ) : (
                memo.prosecutionStrategy.map((s, i) => (
                  <div key={i} style={{ borderLeft: "3px solid #2d7a4f", paddingLeft: 10, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 11, color: "#0f1e3c" }}>{s.action}</div>
                    <div style={{ fontSize: 10, color: "#4a7060", lineHeight: 1.4 }}>{s.rationale}</div>
                    {s.citation && <code style={{ fontSize: 9, color: "#6b8a78", background: "#f0f4f2", padding: "1px 5px", borderRadius: 3 }}>{s.citation}</code>}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Risk Matrix — fully gated */}
          {memo.riskMatrix?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: "#0f1e3c", marginBottom: 8 }}>Risk Matrix</div>
              {!isPaid ? (
                <div style={{ position: "relative" }}>
                  <div style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none", opacity: 0.5 }}>
                    {memo.riskMatrix.slice(0, 3).map((r, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 55px 55px", gap: 6, padding: "7px 10px", background: "#f8faf9", borderRadius: 7, marginBottom: 4 }}>
                        <div><div style={{ fontWeight: 600, fontSize: 10 }}>{r.risk}</div></div>
                        <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, fontWeight: 700 }}>-</div></div>
                        <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, fontWeight: 700 }}>-</div></div>
                      </div>
                    ))}
                  </div>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ background: "#0f1e3c", color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>Unlock to view risk matrix</span>
                  </div>
                </div>
              ) : (
                memo.riskMatrix.map((r, i) => (
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
                ))
              )}
            </div>
          )}

          {/* Unlock / Download CTA */}
          {!isPaid ? (
            <div style={{ background: "linear-gradient(135deg, #c9a84c 0%, #b8942f 100%)", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: "#fff", marginBottom: 4 }}>Unlock Full Attorney Memo</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", marginBottom: 12, lineHeight: 1.5 }}>All 13 DuPont factors · Prosecution strategy · Risk matrix · Case citations · Downloadable PDF</div>
              <button onClick={() => handlePurchase("memo", 149)} style={{ width: "100%", padding: "11px", background: "#fff", color: "#0f1e3c", border: "none", borderRadius: 8, fontWeight: 900, fontSize: 14, cursor: "pointer", letterSpacing: -0.3 }}>
                Get Full Memo — $149
              </button>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 8 }}>Attorney-grade work product · Instant PDF</div>
            </div>
          ) : (
            <div style={{ background: "#fffdf7", borderRadius: 10, padding: 14, border: "2px solid #c9a84c" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ flex: 1, fontSize: 12, color: "#2d7a4f", fontWeight: 700 }}> Memo Unlocked</div>
                <button onClick={() => downloadPDF("memo")} style={{ padding: "9px 16px", background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Download PDF</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

//  Main Page 

export default function SearchPage() {
  const router = useRouter();
  const { mark, paid, session_id } = router.query;

  const [trademarks, setTrademarks] = useState([]);
  const [usptoCount, setUsptoCount] = useState(null);
  const [activeCount, setActiveCount] = useState(null);
  const [usptoStatus, setUsptoStatus] = useState("loading");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newSearchInput, setNewSearchInput] = useState("");
  const [paymentVerified, setPaymentVerified] = useState(false);

  useEffect(() => { if (mark) setNewSearchInput(mark); }, [mark]);

  // Verify Stripe payment on redirect
  useEffect(() => {
    if (!session_id) return;
    fetch(`/api/verify-payment?session_id=${encodeURIComponent(session_id)}`)
      .then(r => r.json())
      .then(data => {
        if (data.paid) {
          setPaymentVerified(true);
          // Clean URL params without triggering navigation
          const url = new URL(window.location);
          url.searchParams.delete("paid");
          url.searchParams.delete("session_id");
          window.history.replaceState({}, "", url.toString());
        }
      })
      .catch(() => {});
  }, [session_id]);

  useEffect(() => {
    if (!mark) return;
    setUsptoStatus("loading");
    setTrademarks([]);
    fetch(`/api/trademark-search?mark=${encodeURIComponent(mark)}`)
      .then(r => r.json())
      .then(data => {
        setTrademarks(data.items || []);
        setUsptoCount(data.totalCount || 0);
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
    if (filterStatus === "active") return t.isActive;
    if (filterStatus === "dead") return !t.isActive;
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
        <div style={{ background: "#0f1e3c", padding: "10px 24px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <a href="/" style={{ background: "rgba(255,255,255,0.1)", color: "#ccc", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", textDecoration: "none" }}>← MarkItNow</a>
          <form onSubmit={handleNewSearch} style={{ flex: 1, display: "flex", gap: 8, maxWidth: 540 }}>
            <input value={newSearchInput} onChange={e => setNewSearchInput(e.target.value)}
              style={{ flex: 1, padding: "7px 14px", borderRadius: 7, border: "1.5px solid rgba(255,255,255,0.15)", background: "#f4f4f4", color: "#111", fontSize: 14, fontFamily: "inherit", outline: "none" }}
              placeholder="Search another mark..." />
            <button type="submit" style={{ padding: "7px 16px", background: "#c9a84c", color: "#0a0a0a", border: "none", borderRadius: 7, fontWeight: 800, fontSize: 13 }}>Search</button>
          </form>
          <a href={`/file?mark=${encodeURIComponent(mark)}`} style={{ background: "#c9a84c", color: "#0a0a0a", padding: "7px 14px", borderRadius: 7, fontWeight: 800, fontSize: 13, whiteSpace: "nowrap" }}>Don't file blind - Get Analysis</a>
        </div>

        {/* Split pane */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 370px", overflow: "hidden" }}>

          {/* LEFT: USPTO results */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid #d4e0da", background: "#fff" }}>
            {/* Panel header */}
            <div style={{ padding: "14px 22px", borderBottom: "1px solid #eef2f0", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: usptoStatus === "loading" ? "#f1c40f" : usptoStatus === "done" ? "#2ecc71" : "#e74c3c",
                    animation: usptoStatus === "loading" ? "mni-pulse 1s infinite" : "none" }} />
                  <span style={{ fontWeight: 800, fontSize: 15, color: "#0f1e3c" }}>USPTO Database</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#2ecc71", background: "rgba(46,204,113,0.12)", padding: "2px 7px", borderRadius: 4, letterSpacing: 1.2 }}>LIVE</span>
                </div>
                {usptoStatus === "done" && (
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "#0f1e3c" }}>{usptoCount?.toLocaleString()}</span>
                    <span style={{ fontSize: 11, color: "#8aa898", marginLeft: 6 }}>marks · </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: activeCount > 0 ? "#c0392b" : "#2d7a4f" }}>{activeCount} active</span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#6b8a78" }}>
                Results for: <strong style={{ color: "#0f1e3c" }}>"{mark}"</strong>
                {trademarks.length > 0 && ` expanded search includes first keyword`}
              </div>
              {usptoStatus === "done" && trademarks.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  {[["all", "All"], ["active", "Active Only"], ["dead", "Dead Marks"]].map(([val, label]) => (
                    <button key={val} onClick={() => setFilterStatus(val)} style={{ padding: "3px 10px", borderRadius: 20, border: "1px solid", borderColor: filterStatus === val ? "#0f1e3c" : "#d4e3d9", background: filterStatus === val ? "#0f1e3c" : "#fff", color: filterStatus === val ? "#fff" : "#6b8a78", fontSize: 10, fontWeight: 600 }}>
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
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f1e3c" }}>Searching USPTO database...</div>
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
                  {/* Table header */}
                  <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1.5fr 65px 120px", gap: 8, padding: "8px 22px", background: "#f8faf9", borderBottom: "1px solid #eef2f0", fontSize: 10, fontWeight: 700, color: "#8aa898", textTransform: "uppercase", letterSpacing: 0.8, position: "sticky", top: 0, zIndex: 5 }}>
                    <div>Mark / Owner</div>
                    <div>Goods & Services</div>
                    <div>Class</div>
                    <div>Status</div>
                  </div>

                  {filteredMarks.map((t, i) => {
                    const ss = statusStyle(t.status);
                    return (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "2.2fr 1.5fr 65px 120px", gap: 8, padding: "11px 22px", borderBottom: "1px solid #f0f4f2", background: i % 2 === 0 ? "#fff" : "#fafcfb", alignItems: "start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f1e3c", lineHeight: 1.3 }}>{t.markName}</div>
                          <div style={{ fontSize: 11, color: "#6b8a78", marginTop: 2 }}>{t.owner}</div>
                          <div style={{ fontSize: 9, color: "#b0bcb8", marginTop: 1 }}>#{t.serialNumber}{t.filingDate ? ` · ${t.filingDate}` : ""}</div>
                        </div>
                        <div style={{ fontSize: 11, color: "#4a7060", lineHeight: 1.4 }}>
                          {t.description ? t.description.slice(0, 90) + (t.description.length > 90 ? "…" : "") : "-"}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#0f1e3c" }}>{t.classCode || "-"}</div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: ss.dot, flexShrink: 0 }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: ss.color, background: ss.bg, padding: "2px 7px", borderRadius: 5 }}>
                              {t.status?.replace("Live/", "") || "Unknown"}
                            </span>
                          </div>
                          {t.registrationDate && <div style={{ fontSize: 9, color: "#aab8b2", marginTop: 3 }}>Reg. {t.registrationDate}</div>}
                        </div>
                      </div>
                    );
                  })}

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
            <PurchasePanel mark={mark} trademarks={trademarks} loading={usptoStatus === "loading"} initialPaid={paymentVerified} />
          </div>
        </div>
      </div>
      <ChatWidget />
    </>
  );
}