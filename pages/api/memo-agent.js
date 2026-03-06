import { runAnalysis } from "../../lib/analysisCore";

// pages/api/memo-agent.js
// ─────────────────────────────────────────────────────────────────────────────
// AGENT 8: memo-agent
//
// Takes Analysis Agent output and formats a full attorney-style legal memo.
// Product: AI Legal Memo - $149
//
// Steps:
//   Step 1 - Retrieve: Run Analysis Agent if no report provided
//   Step 2 - Draft:    Generate full legal memo structure
//   Step 3 - Format:   Apply memo formatting (TO/FROM/RE/DATE/sections)
//   Step 4 - QC:       Validate completeness before delivery
//
// POST /api/memo-agent
// Body: { mark, goodsServices, classCode, useType, report (optional) }
//
// If report is passed (from prior Analysis Agent run), skips Step 1.
// If no report, runs Analysis Agent first then builds memo on top.
//
// Hallucination safeguards:
//   - All factual claims must trace to report data (serial numbers, marks)
//   - Temperature 0.2 for legal reasoning
//   - System prompt forbids fabrication of registrations or legal conclusions
//   - QC validates all cited serials exist in source data
// ─────────────────────────────────────────────────────────────────────────────

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
// Use VERCEL_URL in production (auto-set by Vercel), fallback to markitnow-two for testing


// ── Step 1: Get analysis report (run inline - no HTTP call) ──────────────────

async function stepGetReport(mark, goodsServices, classCode, existingReport) {
  if (existingReport) return existingReport;
  return runAnalysis(mark, goodsServices, classCode, null);
}

// ── Step 2: Draft legal memo ──────────────────────────────────────────────────

async function stepDraft(mark, goodsServices, classCode, useType, report, anthropicKey) {
  const conflicts = report?.scoring?.scoredConflicts || [];
  const highRisk = conflicts.filter(c => c.riskScore === "HIGH");
  const medRisk = conflicts.filter(c => c.riskScore === "MEDIUM");

  const conflictSummary = conflicts.slice(0, 10).map((c, i) =>
    `[${i + 1}] "${c.markName}" (Serial: ${c.serialNumber || "N/A"}) | Owner: ${c.owner} | Status: ${c.status} | Risk: ${c.riskScore}
     DuPont - Mark Similarity: ${c.dupont?.markSimilarity || "N/A"}
     DuPont - Goods/Services: ${c.dupont?.goodsServicesSimilarity || "N/A"}
     Reasoning: ${c.riskReasoning || "N/A"}`
  ).join("\n\n");

  const prompt = `You are a trademark attorney AI drafting a legal memorandum. You must write in the style of a professional legal memo from a trademark law firm.

MEMO FACTS:
- Mark under review: "${mark}"
- Goods/Services: ${goodsServices || "Not specified"}
- Nice Class: ${classCode || "Not specified"}
- Use type: ${useType || "Use in commerce"}
- Analysis date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

SEARCH RESULTS:
- Total conflicts found: ${report?.retrieval?.totalFound || 0}
- Active conflicts: ${report?.retrieval?.activeCount || 0}
- High risk conflicts: ${highRisk.length}
- Medium risk conflicts: ${medRisk.length}
- Overall risk: ${report?.scoring?.overallRisk || "UNKNOWN"}
- Phonetic variant searched: ${report?.retrieval?.phoneticVariantSearched || "N/A"}

TOP CONFLICTS (cite serial numbers when referencing):
${conflictSummary || "No conflicts found."}

REGISTRABILITY:
- Mark strength/distinctiveness: ${report?.analysis?.registrabilityAssessment?.distinctiveness || "N/A"}
- Registration likelihood: ${report?.analysis?.registrabilityAssessment?.likelihood || "N/A"}
- Reasoning: ${report?.analysis?.registrabilityAssessment?.reasoning || "N/A"}

RECOMMENDATION: ${report?.analysis?.recommendation?.action || "N/A"}

INSTRUCTIONS:
1. Write a complete legal memorandum with all standard sections
2. Cite serial numbers when referencing specific conflicts
3. Apply DuPont factor analysis with legal precision
4. Do NOT fabricate any marks, registrations, or legal holdings not in the data above
5. Write as AI-generated analysis clearly - do not imply this is attorney work product
6. Use proper legal memo language and structure
7. Be thorough but concise - this is a $149 professional product

Respond ONLY with valid JSON. No preamble outside JSON.

{
  "memo": {
    "header": {
      "to": "Client",
      "from": "MarkItNow.ai Legal Analysis",
      "re": "string (trademark clearance subject line for '${mark}')",
      "date": "string (today's date)",
      "confidentiality": "AI-Generated Legal Analysis - Not Attorney Work Product - Confidential"
    },
    "executiveSummary": "string (2-3 paragraph professional summary)",
    "sectionI": {
      "title": "I. BACKGROUND AND SCOPE OF ANALYSIS",
      "content": "string (mark description, goods/services, filing basis, scope of search conducted)"
    },
    "sectionII": {
      "title": "II. TRADEMARK SEARCH RESULTS",
      "content": "string (detailed description of search methodology and results found)"
    },
    "sectionIII": {
      "title": "III. LIKELIHOOD OF CONFUSION ANALYSIS",
      "subsections": [
        {
          "factor": "string (DuPont factor name)",
          "analysis": "string (analysis of this factor for the specific mark)",
          "weight": "FAVORS_APPLICANT|FAVORS_REGISTRANT|NEUTRAL"
        }
      ],
      "overallConclusion": "string (overall DuPont conclusion)"
    },
    "sectionIV": {
      "title": "IV. REGISTRABILITY ANALYSIS",
      "content": "string (distinctiveness, descriptiveness, acquired distinctiveness if relevant)"
    },
    "sectionV": {
      "title": "V. RISK ASSESSMENT BY CONFLICT",
      "conflicts": [
        {
          "markName": "string",
          "serialNumber": "string",
          "riskLevel": "HIGH|MEDIUM|LOW",
          "analysis": "string (2-3 sentences on this specific conflict)"
        }
      ]
    },
    "sectionVI": {
      "title": "VI. CONCLUSION AND RECOMMENDATIONS",
      "conclusion": "string (overall conclusion)",
      "recommendations": ["string", "string", "string"],
      "filingStrategy": "string (specific filing strategy recommendation)"
    },
    "disclaimer": "This memorandum was generated by artificial intelligence and constitutes an AI-generated legal analysis. It is provided for informational purposes only and does not constitute legal advice, does not create an attorney-client relationship, and should not be relied upon as a substitute for advice from a licensed trademark attorney. Trademark law is complex, fact-specific, and subject to change. For advice specific to your situation, consult a licensed trademark attorney."
  }
}`;

  const response = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 6000,
      temperature: 0.2,
      system: "You are a trademark attorney AI drafting professional legal memoranda. You cite only real data provided to you. You never fabricate serial numbers, registrations, or legal conclusions. You clearly label all output as AI-generated. You respond only in valid JSON.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find(b => b.type === "text")?.text || "{}";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    throw new Error("Memo draft parse error");
  }
}

// ── Step 3: Format memo for delivery ─────────────────────────────────────────

function stepFormat(memoData, mark, report) {
  const memo = memoData.memo;
  if (!memo) throw new Error("No memo data to format");

  // Build plain text version for email fallback
  const plainText = [
    `TRADEMARK LEGAL MEMORANDUM`,
    `${"=".repeat(60)}`,
    `TO: ${memo.header?.to}`,
    `FROM: ${memo.header?.from}`,
    `RE: ${memo.header?.re}`,
    `DATE: ${memo.header?.date}`,
    `CONFIDENTIALITY: ${memo.header?.confidentiality}`,
    ``,
    `EXECUTIVE SUMMARY`,
    `${"─".repeat(40)}`,
    memo.executiveSummary,
    ``,
    memo.sectionI?.title,
    `${"─".repeat(40)}`,
    memo.sectionI?.content,
    ``,
    memo.sectionII?.title,
    `${"─".repeat(40)}`,
    memo.sectionII?.content,
    ``,
    memo.sectionIII?.title,
    `${"─".repeat(40)}`,
    ...(memo.sectionIII?.subsections || []).map(s =>
      `${s.factor} [${s.weight}]\n${s.analysis}`
    ),
    ``,
    `Overall DuPont Conclusion: ${memo.sectionIII?.overallConclusion}`,
    ``,
    memo.sectionIV?.title,
    `${"─".repeat(40)}`,
    memo.sectionIV?.content,
    ``,
    memo.sectionV?.title,
    `${"─".repeat(40)}`,
    ...(memo.sectionV?.conflicts || []).map(c =>
      `${c.markName} (Serial: ${c.serialNumber}) - ${c.riskLevel}\n${c.analysis}`
    ),
    ``,
    memo.sectionVI?.title,
    `${"─".repeat(40)}`,
    memo.sectionVI?.conclusion,
    ``,
    `Recommendations:`,
    ...(memo.sectionVI?.recommendations || []).map((r, i) => `${i + 1}. ${r}`),
    ``,
    `Filing Strategy: ${memo.sectionVI?.filingStrategy}`,
    ``,
    `${"=".repeat(60)}`,
    `DISCLAIMER`,
    memo.disclaimer,
  ].join("\n");

  return {
    memo,
    plainText,
    wordCount: plainText.split(/\s+/).length,
    sectionCount: 6,
    conflictCount: (memo.sectionV?.conflicts || []).length,
  };
}

// ── Step 4: QC validation ─────────────────────────────────────────────────────

function stepQC(formattedMemo, report) {
  const issues = [];
  const memo = formattedMemo.memo;

  if (!memo?.executiveSummary) issues.push("Missing executive summary");
  if (!memo?.sectionIII?.subsections?.length) issues.push("Missing DuPont analysis");
  if (!memo?.sectionVI?.conclusion) issues.push("Missing conclusion");
  if (!memo?.disclaimer) issues.push("Missing disclaimer");
  if (formattedMemo.wordCount < 500) issues.push("Memo too short - possible generation error");

  // Check cited serials against retrieved data
  const retrievedSerials = new Set(
    (report?.conflicts || []).map(c => c.serialNumber).filter(Boolean)
  );
  const citedSerials = (memo?.sectionV?.conflicts || [])
    .map(c => c.serialNumber)
    .filter(s => s && s !== "N/A");

  const hallucinated = citedSerials.filter(s => s && !retrievedSerials.has(s));
  if (hallucinated.length > 0) {
    issues.push(`Potential hallucinated serials in memo: ${hallucinated.join(", ")}`);
  }

  return {
    passed: issues.length === 0,
    issues,
    wordCount: formattedMemo.wordCount,
    checkedAt: new Date().toISOString(),
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { mark, goodsServices, classCode, useType, report: existingReport } = req.body;
  if (!mark?.trim()) return res.status(400).json({ error: "mark is required" });

  const anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_KEY;
  if (!anthropicKey) return res.status(500).json({ error: "ANTHROPIC_KEY not configured" });

  const startTime = Date.now();

  try {
    // Step 1: Get analysis report
    console.log(`[Agent8] Step 1 - Getting analysis report for "${mark}"`);
    const report = await stepGetReport(mark, goodsServices, classCode, existingReport);
    console.log(`[Agent8] Step 1 complete - Risk: ${report?.scoring?.overallRisk}`);

    // Step 2: Draft memo
    console.log(`[Agent8] Step 2 - Drafting legal memo`);
    const memoData = await stepDraft(mark, goodsServices, classCode, useType, report, anthropicKey);
    console.log(`[Agent8] Step 2 complete`);

    // Step 3: Format
    console.log(`[Agent8] Step 3 - Formatting memo`);
    const formatted = stepFormat(memoData, mark, report);
    console.log(`[Agent8] Step 3 complete - ${formatted.wordCount} words`);

    // Step 4: QC
    const qc = stepQC(formatted, report);
    console.log(`[Agent8] QC ${qc.passed ? "PASSED" : "FAILED"}: ${qc.issues.join(", ") || "No issues"}`);

    return res.status(200).json({
      mark,
      report: {
        overallRisk: report?.scoring?.overallRisk,
        totalConflicts: report?.retrieval?.totalFound,
        activeConflicts: report?.retrieval?.activeCount,
      },
      memo: formatted.memo,
      plainText: formatted.plainText,
      meta: {
        wordCount: formatted.wordCount,
        sectionCount: formatted.sectionCount,
        conflictCount: formatted.conflictCount,
        agentVersion: "1.0",
        elapsedMs: Date.now() - startTime,
        generatedAt: new Date().toISOString(),
      },
      qc,
    });
  } catch (err) {
    console.error("[Agent8] Fatal error:", err);
    return res.status(500).json({ error: err.message });
  }
}
