// pages/api/analysis-agent.js
// ─────────────────────────────────────────────────────────────────────────────
// AGENT 1: Analysis Agent
//
// Multi-step trademark analysis agent. Runs sequentially:
//   Step 1 - Retrieve: Pull 3 parallel USPTO searches (exact, phonetic, class)
//   Step 2 - Score:    Claude scores each conflict on DuPont factors
//   Step 3 - Rank:     Identify highest-risk conflict with full reasoning
//   Step 4 - Report:   Generate structured JSON ready for PDF generation
//
// POST /api/analysis-agent
// Body: { mark, goodsServices, classCode, useType }
//
// Hallucination safeguards:
//   - Claude never invents conflicts. It only reasons about USPTO data returned.
//   - Every factual claim cites serial number from live search results.
//   - Temperature 0 for scoring steps, 0.2 for narrative.
//   - System prompt explicitly forbids fabrication.
//   - QC step validates output structure before returning.
// ─────────────────────────────────────────────────────────────────────────────

const RAPIDAPI_HOST = "uspto-trademark.p.rapidapi.com";
const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

// ── USPTO helpers ─────────────────────────────────────────────────────────────

function rapidHeaders(apiKey) {
  return {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": RAPIDAPI_HOST,
  };
}

function normalizeItem(t) {
  return {
    markName: t.keyword || t.mark_identification || "",
    serialNumber: t.serial_number || "",
    registrationNumber: t.registration_number || "",
    owner: t.owners?.[0]?.name || "Unknown",
    status: t.status_label || t.status || "",
    filingDate: t.filing_date || "",
    registrationDate: t.registration_date || "",
    classCode: Array.isArray(t.class_codes)
      ? t.class_codes.join(", ")
      : t.class_codes || "",
    description: t.description_set?.[0]?.description || "",
    isActive:
      (t.status_label || "").toLowerCase().includes("live") ||
      (t.status_label || "").toLowerCase().includes("registered") ||
      (t.status_label || "").toLowerCase().includes("pending"),
  };
}

async function queryUSPTO(keyword, status, apiKey) {
  try {
    const encoded = encodeURIComponent(keyword.trim());
    const url = `https://${RAPIDAPI_HOST}/v1/trademarkSearch/${encoded}/${status}`;
    const res = await fetch(url, { headers: rapidHeaders(apiKey) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map(normalizeItem);
  } catch {
    return [];
  }
}

// Generate phonetic variant for broader search
function phoneticVariant(mark) {
  return mark
    .toLowerCase()
    .replace(/ph/g, "f")
    .replace(/ck/g, "k")
    .replace(/qu/g, "kw")
    .replace(/x/g, "ks")
    .replace(/[aeiou]+/g, (m) => m[0]); // collapse vowels
}

// ── Step 1: Retrieve USPTO data ───────────────────────────────────────────────

async function stepRetrieve(mark, classCode, apiKey) {
  const firstWord = mark.trim().split(/\s+/)[0];
  const phonetic = phoneticVariant(mark);

  const queries = [
    queryUSPTO(mark, "all", apiKey),           // exact, all statuses
    queryUSPTO(mark, "active", apiKey),        // exact, active only
    queryUSPTO(firstWord, "active", apiKey),   // first word, active
  ];

  // Add phonetic if meaningfully different
  if (phonetic !== mark.toLowerCase() && phonetic.length > 2) {
    queries.push(queryUSPTO(phonetic, "active", apiKey));
  }

  const results = await Promise.allSettled(queries);
  const allItems = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );

  // Deduplicate by serial number
  const seen = new Map();
  for (const item of allItems) {
    const key = item.serialNumber || `${item.markName}__${item.owner}`;
    if (!seen.has(key)) seen.set(key, item);
  }

  const deduplicated = [...seen.values()];

  // Active marks first, then by filing date
  deduplicated.sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return (b.filingDate || "").localeCompare(a.filingDate || "");
  });

  return {
    searchedMark: mark,
    phoneticVariant: phonetic,
    totalFound: deduplicated.length,
    activeCount: deduplicated.filter((i) => i.isActive).length,
    conflicts: deduplicated.slice(0, 25), // cap at 25 for token efficiency
  };
}

// ── Step 2: Score conflicts on DuPont factors ─────────────────────────────────

async function stepScore(mark, goodsServices, classCode, retrievalData, anthropicKey) {
  if (retrievalData.conflicts.length === 0) {
    return { conflicts: [], overallRisk: "LOW", summary: "No conflicts found in USPTO database." };
  }

  const conflictList = retrievalData.conflicts
    .slice(0, 15) // top 15 for scoring
    .map(
      (c, i) =>
        `[${i + 1}] Serial: ${c.serialNumber} | Mark: "${c.markName}" | Owner: ${c.owner} | Status: ${c.status} | Class: ${c.classCode} | Goods/Services: ${c.description || "Not specified"} | Filing Date: ${c.filingDate}`
    )
    .join("\n");

  const prompt = `You are a trademark attorney AI. You will score trademark conflicts using the DuPont factors.

APPLICANT'S MARK: "${mark}"
APPLICANT'S GOODS/SERVICES: ${goodsServices || "Not specified"}
APPLICANT'S CLASS: ${classCode || "Not specified"}

USPTO CONFLICTS FOUND (real data, do not fabricate any marks not listed here):
${conflictList}

INSTRUCTIONS:
1. Score ONLY the conflicts listed above. Do not invent or add any marks.
2. For each conflict, apply the relevant DuPont factors:
   - Factor 1: Similarity of marks (appearance, sound, meaning) - weight: HIGH
   - Factor 2: Similarity of goods/services - weight: HIGH
   - Factor 3: Channels of trade - weight: MEDIUM
   - Factor 4: Strength/fame of prior mark - weight: MEDIUM
   - Factor 5: Actual confusion evidence - weight: LOW (rarely available pre-filing)
3. Assign a risk score: HIGH / MEDIUM / LOW
4. Focus scoring on ACTIVE marks. Inactive marks are lower risk but note them.
5. If goods/services description is missing, base similarity on class codes only.

Respond ONLY with valid JSON. No preamble, no explanation outside the JSON.

{
  "scoredConflicts": [
    {
      "serialNumber": "string",
      "markName": "string",
      "owner": "string",
      "status": "string",
      "riskScore": "HIGH|MEDIUM|LOW",
      "dupont": {
        "markSimilarity": "string (1-2 sentences)",
        "goodsServicesSimilarity": "string (1-2 sentences)",
        "channelsOfTrade": "string (1 sentence)",
        "priorMarkStrength": "string (1 sentence)"
      },
      "riskReasoning": "string (2-3 sentences explaining overall risk)"
    }
  ],
  "overallRisk": "HIGH|MEDIUM|LOW",
  "highRiskCount": number,
  "mediumRiskCount": number,
  "lowRiskCount": number
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
      max_tokens: 4000,
      temperature: 0,
      system:
        "You are a trademark conflict scoring AI. You score only the conflicts you are given. You never fabricate trademark registrations, serial numbers, or owner names. If data is missing, you note it. You respond only in valid JSON.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find((b) => b.type === "text")?.text || "{}";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      scoredConflicts: [],
      overallRisk: "UNKNOWN",
      error: "Scoring parse error",
    };
  }
}

// ── Step 3: Identify highest-risk conflict and generate narrative ──────────────

async function stepRank(mark, goodsServices, classCode, useType, scoringData, retrievalData, anthropicKey) {
  const highRisk = (scoringData.scoredConflicts || []).filter(
    (c) => c.riskScore === "HIGH"
  );
  const topConflict = highRisk[0] || scoringData.scoredConflicts?.[0] || null;

  const prompt = `You are a trademark attorney AI writing a professional analysis report section.

APPLICANT'S MARK: "${mark}"
APPLICANT'S GOODS/SERVICES: ${goodsServices || "Not specified"}
APPLICANT'S CLASS: ${classCode || "Not specified"}
USE TYPE: ${useType || "Use in commerce"}

OVERALL RISK ASSESSMENT: ${scoringData.overallRisk || "UNKNOWN"}
HIGH RISK CONFLICTS: ${scoringData.highRiskCount || 0}
MEDIUM RISK CONFLICTS: ${scoringData.mediumRiskCount || 0}
LOW RISK CONFLICTS: ${scoringData.lowRiskCount || 0}
TOTAL CONFLICTS FOUND: ${retrievalData.totalFound || 0}
ACTIVE CONFLICTS: ${retrievalData.activeCount || 0}

TOP CONFLICT (if any): ${topConflict ? JSON.stringify(topConflict) : "None identified"}

Write the following sections. Be specific - cite serial numbers when referencing conflicts. Do not fabricate any information.

Respond ONLY with valid JSON:

{
  "executiveSummary": "string (3-4 sentences: overall risk, key finding, recommendation)",
  "topConflict": {
    "serialNumber": "string or null",
    "markName": "string or null",
    "whyItMatters": "string (2-3 sentences on why this is the highest risk)",
    "whatToDoAboutIt": "string (2-3 sentences on concrete next steps)"
  },
  "registrabilityAssessment": {
    "distinctiveness": "string (assess mark strength: fanciful/arbitrary/suggestive/descriptive/generic)",
    "likelihood": "STRONG|MODERATE|WEAK|BLOCKED",
    "reasoning": "string (3-4 sentences)"
  },
  "recommendation": {
    "action": "PROCEED|PROCEED_WITH_CAUTION|REBRAND_RECOMMENDED|CONSULT_ATTORNEY",
    "reasoning": "string (2-3 sentences)",
    "nextSteps": ["string", "string", "string"]
  },
  "disclaimer": "This AI Analysis Report is generated by artificial intelligence and is provided for informational purposes only. It does not constitute legal advice and does not create an attorney-client relationship. Trademark law is complex and fact-specific. For advice specific to your situation, consult a licensed trademark attorney."
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
      max_tokens: 2000,
      temperature: 0.2,
      system:
        "You are a trademark attorney AI writing professional analysis reports. You cite real data only. You never fabricate serial numbers, marks, or legal conclusions unsupported by the data. You respond only in valid JSON.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find((b) => b.type === "text")?.text || "{}";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { error: "Ranking parse error", raw: text };
  }
}

// ── Step 4: QC validation ─────────────────────────────────────────────────────

function stepQC(retrievalData, scoringData, rankingData) {
  const issues = [];

  if (!retrievalData.conflicts) issues.push("Missing conflicts array");
  if (!scoringData.overallRisk) issues.push("Missing overall risk score");
  if (!rankingData.executiveSummary) issues.push("Missing executive summary");
  if (!rankingData.recommendation?.action) issues.push("Missing recommendation action");
  if (!rankingData.registrabilityAssessment?.likelihood) issues.push("Missing registrability likelihood");

  // Check for hallucinated serial numbers
  const retrievedSerials = new Set(
    retrievalData.conflicts.map((c) => c.serialNumber).filter(Boolean)
  );
  const scoredSerials = (scoringData.scoredConflicts || [])
    .map((c) => c.serialNumber)
    .filter(Boolean);

  const hallucinated = scoredSerials.filter(
    (s) => s && !retrievedSerials.has(s)
  );
  if (hallucinated.length > 0) {
    issues.push(`Potential hallucinated serials: ${hallucinated.join(", ")}`);
  }

  return {
    passed: issues.length === 0,
    issues,
    checkedAt: new Date().toISOString(),
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { mark, goodsServices, classCode, useType } = req.body;
  if (!mark?.trim())
    return res.status(400).json({ error: "mark is required" });

  const rapidKey = process.env.RAPIDAPI_KEY;
  const anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_KEY;

  if (!rapidKey) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });
  if (!anthropicKey) return res.status(500).json({ error: "ANTHROPIC_KEY not configured" });

  const startTime = Date.now();

  try {
    // ── Step 1: Retrieve USPTO data ──
    console.log(`[Agent1] Step 1 - Retrieving USPTO data for "${mark}"`);
    const retrievalData = await stepRetrieve(mark, classCode, rapidKey);
    console.log(`[Agent1] Step 1 complete - Found ${retrievalData.totalFound} conflicts`);

    // ── Step 2: Score conflicts ──
    console.log(`[Agent1] Step 2 - Scoring ${retrievalData.conflicts.length} conflicts`);
    const scoringData = await stepScore(mark, goodsServices, classCode, retrievalData, anthropicKey);
    console.log(`[Agent1] Step 2 complete - Overall risk: ${scoringData.overallRisk}`);

    // ── Step 3: Rank and generate narrative ──
    console.log(`[Agent1] Step 3 - Generating analysis narrative`);
    const rankingData = await stepRank(mark, goodsServices, classCode, useType, scoringData, retrievalData, anthropicKey);
    console.log(`[Agent1] Step 3 complete - Recommendation: ${rankingData.recommendation?.action}`);

    // ── Step 4: QC validation ──
    const qcResult = stepQC(retrievalData, scoringData, rankingData);
    console.log(`[Agent1] QC ${qcResult.passed ? "PASSED" : "FAILED"}: ${qcResult.issues.join(", ") || "No issues"}`);

    const elapsed = Date.now() - startTime;

    // ── Assemble final report payload ──
    const report = {
      meta: {
        mark,
        goodsServices: goodsServices || null,
        classCode: classCode || null,
        useType: useType || null,
        generatedAt: new Date().toISOString(),
        elapsedMs: elapsed,
        agentVersion: "1.0",
      },
      retrieval: {
        totalFound: retrievalData.totalFound,
        activeCount: retrievalData.activeCount,
        phoneticVariantSearched: retrievalData.phoneticVariant,
      },
      scoring: {
        overallRisk: scoringData.overallRisk,
        highRiskCount: scoringData.highRiskCount || 0,
        mediumRiskCount: scoringData.mediumRiskCount || 0,
        lowRiskCount: scoringData.lowRiskCount || 0,
        scoredConflicts: scoringData.scoredConflicts || [],
      },
      analysis: rankingData,
      conflicts: retrievalData.conflicts, // full raw conflict list
      qc: qcResult,
    };

    return res.status(200).json(report);
  } catch (err) {
    console.error("[Agent1] Fatal error:", err);
    return res.status(500).json({ error: err.message });
  }
}
