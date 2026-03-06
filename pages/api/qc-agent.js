// pages/api/qc-agent.js
// ─────────────────────────────────────────────────────────────────────────────
// AGENT 14: qc-agent
//
// Runs before every AI-generated PDF delivery.
// Reviews Analysis Agent and Memo Agent output for:
//   - Internal consistency (DuPont completeness, risk score alignment)
//   - Hallucination detection (serial numbers, mark names)
//   - Structural completeness (all required sections present)
//   - Language quality (disclaimer present, no legal conclusions)
//
// POST /api/qc-agent
// Body: { type: "analysis"|"memo", data: <agent output> }
//
// Returns: { passed: bool, score: 0-100, issues: [], approved: bool }
// ─────────────────────────────────────────────────────────────────────────────

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001"; // Haiku - fast, cheap, sufficient for QC

// ── Structural checks (deterministic) ────────────────────────────────────────

function checkAnalysisStructure(data) {
  const issues = [];
  let score = 100;

  // Required fields
  if (!data.meta?.mark) { issues.push("Missing mark in meta"); score -= 10; }
  if (!data.retrieval?.totalFound && data.retrieval?.totalFound !== 0) { issues.push("Missing retrieval data"); score -= 10; }
  if (!data.scoring?.overallRisk) { issues.push("Missing overall risk score"); score -= 15; }
  if (!data.analysis?.executiveSummary) { issues.push("Missing executive summary"); score -= 15; }
  if (!data.analysis?.recommendation?.action) { issues.push("Missing recommendation action"); score -= 10; }
  if (!data.analysis?.registrabilityAssessment?.likelihood) { issues.push("Missing registrability likelihood"); score -= 10; }
  if (!data.analysis?.disclaimer) { issues.push("Missing disclaimer"); score -= 20; }

  // Risk score alignment check
  const highCount = data.scoring?.highRiskCount || 0;
  const overallRisk = data.scoring?.overallRisk;
  if (highCount > 0 && overallRisk === "LOW") {
    issues.push("Risk score misalignment: HIGH conflicts but LOW overall risk");
    score -= 15;
  }

  // Hallucination check - scored serials vs retrieved serials
  const retrievedSerials = new Set(
    (data.conflicts || []).map(c => c.serialNumber).filter(Boolean)
  );
  const scoredSerials = (data.scoring?.scoredConflicts || [])
    .map(c => c.serialNumber)
    .filter(Boolean);
  const hallucinated = scoredSerials.filter(s => !retrievedSerials.has(s));
  if (hallucinated.length > 0) {
    issues.push(`Hallucinated serial numbers: ${hallucinated.join(", ")}`);
    score -= 30;
  }

  // DuPont completeness - at least check top conflicts have DuPont data
  const topConflicts = (data.scoring?.scoredConflicts || []).slice(0, 3);
  const missingDuPont = topConflicts.filter(c => !c.dupont?.markSimilarity);
  if (missingDuPont.length > 0) {
    issues.push(`${missingDuPont.length} top conflicts missing DuPont breakdown`);
    score -= 10;
  }

  return { issues, score: Math.max(0, score) };
}

function checkMemoStructure(data) {
  const issues = [];
  let score = 100;

  const memo = data.memo;
  if (!memo) { return { issues: ["No memo object found"], score: 0 }; }

  if (!memo.header?.re) { issues.push("Missing memo RE line"); score -= 5; }
  if (!memo.executiveSummary) { issues.push("Missing executive summary"); score -= 15; }
  if (!memo.sectionI?.content) { issues.push("Missing Section I (Background)"); score -= 10; }
  if (!memo.sectionII?.content) { issues.push("Missing Section II (Search Results)"); score -= 10; }
  if (!memo.sectionIII?.subsections?.length) { issues.push("Missing Section III (DuPont Analysis)"); score -= 20; }
  if (!memo.sectionIV?.content) { issues.push("Missing Section IV (Registrability)"); score -= 10; }
  if (!memo.sectionV?.conflicts) { issues.push("Missing Section V (Risk Assessment)"); score -= 10; }
  if (!memo.sectionVI?.conclusion) { issues.push("Missing Section VI (Conclusion)"); score -= 10; }
  if (!memo.disclaimer) { issues.push("Missing disclaimer - CRITICAL"); score -= 30; }

  // Word count check
  if (data.meta?.wordCount < 400) {
    issues.push(`Memo too short: ${data.meta?.wordCount} words (minimum 400)`);
    score -= 20;
  }

  // DuPont completeness - should have at least 4 factors analyzed
  const dupont = memo.sectionIII?.subsections || [];
  if (dupont.length < 4) {
    issues.push(`Only ${dupont.length} DuPont factors analyzed (minimum 4)`);
    score -= 10;
  }

  // Hallucination check
  const citedSerials = (memo.sectionV?.conflicts || [])
    .map(c => c.serialNumber)
    .filter(s => s && s !== "N/A");
  const retrievedSerials = new Set(
    (data.sourceConflicts || []).map(c => c.serialNumber).filter(Boolean)
  );
  if (retrievedSerials.size > 0) {
    const hallucinated = citedSerials.filter(s => !retrievedSerials.has(s));
    if (hallucinated.length > 0) {
      issues.push(`Hallucinated serial numbers in memo: ${hallucinated.join(", ")}`);
      score -= 25;
    }
  }

  return { issues, score: Math.max(0, score) };
}

// ── AI semantic review (catches things structural check misses) ───────────────

async function aiReview(type, data, anthropicKey) {
  const content = type === "analysis"
    ? `Executive Summary: ${data.analysis?.executiveSummary}\nRecommendation: ${data.analysis?.recommendation?.action}\nRisk: ${data.scoring?.overallRisk}\nTop conflict: ${data.scoring?.scoredConflicts?.[0]?.riskReasoning}`
    : `Memo conclusion: ${data.memo?.sectionVI?.conclusion}\nDuPont factors analyzed: ${data.memo?.sectionIII?.subsections?.length}\nDisclaimer: ${data.memo?.disclaimer?.substring(0, 100)}`;

  const prompt = `You are a QC reviewer for an AI trademark analysis platform. Review this output excerpt and flag any issues.

TYPE: ${type === "analysis" ? "AI Analysis Report" : "AI Legal Memo"}

CONTENT EXCERPT:
${content}

Check for:
1. Does the output make specific legal guarantees or promises? (it should not)
2. Does the output claim to be attorney work product? (it should not)
3. Is there any obviously fabricated legal content?
4. Is the disclaimer present and adequate?
5. Are risk assessments internally consistent?

Respond ONLY with valid JSON:
{
  "aiIssues": ["string"] or [],
  "aiScore": number (0-100, penalty points deducted per issue),
  "approved": boolean
}`;

  try {
    const response = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        temperature: 0,
        system: "You are a QC reviewer. You check AI-generated legal analysis for quality and compliance issues. You respond only in valid JSON.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const result = await response.json();
    const text = result.content?.find(b => b.type === "text")?.text || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { aiIssues: [], aiScore: 0, approved: true };
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { type, data } = req.body;
  if (!type || !data) return res.status(400).json({ error: "type and data are required" });
  if (!["analysis", "memo"].includes(type)) return res.status(400).json({ error: "type must be analysis or memo" });

  const anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_KEY;
  if (!anthropicKey) return res.status(500).json({ error: "ANTHROPIC_KEY not configured" });

  const startTime = Date.now();

  try {
    console.log(`[Agent14] Running QC on ${type} report`);

    // Structural check
    const structural = type === "analysis"
      ? checkAnalysisStructure(data)
      : checkMemoStructure(data);

    // AI semantic review
    const ai = await aiReview(type, data, anthropicKey);

    // Combined score
    const finalScore = Math.max(0, structural.score - (100 - (ai.aiScore ?? 100)));
    const allIssues = [...structural.issues, ...(ai.aiIssues || [])];
    const passed = finalScore >= 70 && allIssues.length === 0;
    const approved = passed && (ai.approved !== false);

    console.log(`[Agent14] QC complete - Score: ${finalScore} | Passed: ${passed} | Issues: ${allIssues.length}`);

    return res.status(200).json({
      type,
      passed,
      approved,
      score: finalScore,
      issues: allIssues,
      structural: {
        score: structural.score,
        issues: structural.issues,
      },
      ai: {
        score: ai.aiScore,
        issues: ai.aiIssues,
        approved: ai.approved,
      },
      meta: {
        agentVersion: "1.0",
        elapsedMs: Date.now() - startTime,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[Agent14] Fatal error:", err);
    return res.status(500).json({ error: err.message });
  }
}
