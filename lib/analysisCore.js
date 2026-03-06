// lib/analysisCore.js
// ─────────────────────────────────────────────────────────────────────────────
// Shared trademark analysis core logic
// Used by: analysis-agent, memo-agent, stripe-webhook
// No HTTP calls - runs all logic in-process
// ─────────────────────────────────────────────────────────────────────────────

const USPTO_SEARCH_API = "https://tmsearch.uspto.gov/prod-stage-v1-0-0/tmsearch";
const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const USPTO_HEADERS = {
  "Content-Type": "application/json",
  "Accept": "application/json",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Origin": "https://tmsearch.uspto.gov",
  "Referer": "https://tmsearch.uspto.gov/search/search-results",
};

function resolveStatus(src) {
  const alive = src.alive;
  const desc  = (src.statusDescription || "").toLowerCase();
  if (alive) {
    return src.registrationDate ? "Live/Registered" : "Live/Pending";
  }
  if (desc.includes("cancel")) return "Dead/Cancelled";
  if (desc.includes("expir"))  return "Dead/Expired";
  return "Dead/Abandoned";
}

function normalizeItem(src) {
  // Filter out pure design marks (drawingCode 2 = design without words)
  const drawingCode = src.drawingCode || 4;
  if (drawingCode === 2) return null;

  const statusLabel = resolveStatus(src);
  return {
    markName:         src.wordmark || "",
    serialNumber:     String(src.id || ""),
    registrationNumber: src.registrationId || "",
    owner:            (src.ownerName || [])[0] || src.ownerFullText?.[0] || "Unknown",
    status:           statusLabel,
    filingDate:       src.filedDate ? src.filedDate.split("T")[0] : "",
    registrationDate: src.registrationDate ? src.registrationDate.split("T")[0] : "",
    classCode:        (src.internationalClass || []).map(c => c.replace(/^IC\s*/i, "")).join(", "),
    description:      (src.goodsAndServices || []).join("; "),
    drawingCode,
    isActive:         statusLabel.startsWith("Live"),
  };
}

async function queryUSPTO(esQuery) {
  try {
    const res = await fetch(USPTO_SEARCH_API, {
      method:  "POST",
      headers: USPTO_HEADERS,
      body:    JSON.stringify(esQuery),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.error) return [];
    return (data.hits?.hits || []).map(h => normalizeItem(h.source || {})).filter(Boolean);
  } catch {
    return [];
  }
}

// ── Phonetic expansion ───────────────────────────────────────────────────────
// Generates sound-alike variants the USPTO examiner would consider confusingly
// similar. Two layers:
//   1. Rule-based substitutions (NITE→NIGHT, KOOL→COOL, etc.)
//   2. Native OpenSearch fuzzy query (edit-distance, catches PHAZE→PHASE)

function phoneticVariants(word) {
  const w = word.toLowerCase();
  const variants = new Set();

  // Sound-alike substitution rules (USPTO TMEP § 1207.01(b)(i) examples)
  const rules = [
    [/ph/g,   "f"],   [/f/g,    "ph"],
    [/ck/g,   "k"],   [/k/g,    "ck"],
    [/qu/g,   "kw"],  [/kw/g,   "qu"],
    [/x/g,    "ks"],  [/ks/g,   "x"],
    [/z/g,    "s"],   [/s/g,    "z"],
    [/ight/g, "ite"], [/ite/g,  "ight"],
    [/ight/g, "yt"],
    [/oo/g,   "u"],   [/u/g,    "oo"],
    [/ie/g,   "y"],   [/y/g,    "ie"],
    [/ea/g,   "ee"],  [/ee/g,   "ea"],
    [/tion/g, "shun"],
    [/c(?=[ei])/g, "s"], // "cent" → "sent"
    [/c(?=[^ei])/g, "k"], // "cool" → "kool"
    [/k(?=[ei])/g, "c"],
  ];

  for (const [pattern, replacement] of rules) {
    const v = w.replace(pattern, replacement);
    if (v !== w && v.length > 2) variants.add(v);
  }

  // For multi-word marks, also run variants on each word
  const words = w.split(/\s+/);
  if (words.length > 1) {
    for (const wd of words) {
      for (const [pattern, replacement] of rules) {
        const v = wd.replace(pattern, replacement);
        if (v !== wd && v.length > 2) variants.add(v);
      }
    }
  }

  return [...variants].slice(0, 4); // cap at 4 to avoid too many queries
}

export async function stepRetrieve(mark, classCode) {
  const trimmed   = mark.trim();
  const firstWord = trimmed.split(/\s+/)[0];
  const isMulti   = firstWord.toLowerCase() !== trimmed.toLowerCase();
  const phonetics = phoneticVariants(trimmed);

  const queries = [
    // 1. Exact phrase match
    queryUSPTO({ query: { match_phrase: { wordmark: trimmed } }, from: 0, size: 50 }),
    // 2. Broad query_string (token-level matching)
    queryUSPTO({ query: { query_string: { query: trimmed, default_field: "wordmark" } }, from: 0, size: 50 }),
    // 3. Wildcard prefix — catches "MAYAN WARRIOR GALAXYER" when searching "mayan warrior"
    queryUSPTO({ query: { query_string: { query: `${trimmed}*`, default_field: "wordmark" } }, from: 0, size: 25 }),
    // 4. Fuzzy match — catches PHAZE/FAZE/stylized variants (edit-distance)
    queryUSPTO({ query: { match: { wordmark: { query: trimmed, fuzziness: "AUTO", prefix_length: 1 } } }, from: 0, size: 25 }),
  ];

  // 5. First word of multi-word marks
  if (isMulti && firstWord.length > 2) {
    queries.push(queryUSPTO({ query: { match_phrase: { wordmark: firstWord } }, from: 0, size: 25 }));
    // Also fuzzy on first word
    queries.push(queryUSPTO({ query: { match: { wordmark: { query: firstWord, fuzziness: "AUTO", prefix_length: 1 } } }, from: 0, size: 15 }));
  }

  // 6. Phonetic sound-alike variants (NITE→NIGHT, KOOL→COOL, etc.)
  for (const variant of phonetics) {
    queries.push(queryUSPTO({ query: { match: { wordmark: { query: variant, fuzziness: "1", prefix_length: 1 } } }, from: 0, size: 15 }));
  }

  const results  = await Promise.allSettled(queries);
  const allItems = results.flatMap((r) => r.status === "fulfilled" ? r.value : []);

  const seen = new Map();
  for (const item of allItems) {
    const key = item.serialNumber || `${item.markName}__${item.owner}`;
    if (!seen.has(key)) seen.set(key, item);
  }

  const deduplicated = [...seen.values()];
  deduplicated.sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return (b.filingDate || "").localeCompare(a.filingDate || "");
  });

  return {
    searchedMark:    trimmed,
    phoneticVariant: phonetic,
    totalFound:      deduplicated.length,
    activeCount:     deduplicated.filter((i) => i.isActive).length,
    conflicts:       deduplicated.slice(0, 25),
  };
}

export async function stepScore(mark, goodsServices, classCode, retrievalData, anthropicKey) {
  if (retrievalData.conflicts.length === 0) {
    return { scoredConflicts: [], overallRisk: "LOW", highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0 };
  }

  const conflictList = retrievalData.conflicts.slice(0, 15).map((c, i) =>
    `[${i + 1}] Serial: ${c.serialNumber} | Mark: "${c.markName}" | Owner: ${c.owner} | Status: ${c.status} | Class: ${c.classCode} | Goods/Services: ${c.description || "Not specified"} | Filing Date: ${c.filingDate}`
  ).join("\n");

  const prompt = `You are a trademark attorney AI. Score these trademark conflicts using DuPont factors.

APPLICANT'S MARK: "${mark}"
APPLICANT'S GOODS/SERVICES: ${goodsServices || "Not specified"}
APPLICANT'S CLASS: ${classCode || "Not specified"}

USPTO CONFLICTS (real data only - do not fabricate any marks not listed here):
${conflictList}

Score ONLY the conflicts listed. Assign HIGH/MEDIUM/LOW risk per DuPont factors.

Respond ONLY with valid JSON:
{
  "scoredConflicts": [
    {
      "serialNumber": "string",
      "markName": "string",
      "owner": "string",
      "status": "string",
      "classCode": "string",
      "riskScore": "HIGH|MEDIUM|LOW",
      "dupont": {
        "markSimilarity": "string",
        "goodsServicesSimilarity": "string",
        "channelsOfTrade": "string",
        "priorMarkStrength": "string"
      },
      "riskReasoning": "string"
    }
  ],
  "overallRisk": "HIGH|MEDIUM|LOW",
  "highRiskCount": number,
  "mediumRiskCount": number,
  "lowRiskCount": number
}`;

  const response = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODEL, max_tokens: 4000, temperature: 0,
      system: "You are a trademark conflict scoring AI. Score only conflicts given. Never fabricate registrations. Respond only in valid JSON.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find((b) => b.type === "text")?.text || "{}";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { scoredConflicts: [], overallRisk: "UNKNOWN", error: "Scoring parse error" };
  }
}

export async function stepRank(mark, goodsServices, classCode, useType, scoringData, retrievalData, anthropicKey) {
  const highRisk = (scoringData.scoredConflicts || []).filter((c) => c.riskScore === "HIGH");
  const topConflict = highRisk[0] || scoringData.scoredConflicts?.[0] || null;

  const prompt = `You are a trademark attorney AI writing a professional analysis report.

APPLICANT'S MARK: "${mark}"
GOODS/SERVICES: ${goodsServices || "Not specified"}
CLASS: ${classCode || "Not specified"}
USE TYPE: ${useType || "Use in commerce"}
OVERALL RISK: ${scoringData.overallRisk}
HIGH RISK CONFLICTS: ${scoringData.highRiskCount || 0}
TOTAL CONFLICTS: ${retrievalData.totalFound}
ACTIVE CONFLICTS: ${retrievalData.activeCount}
TOP CONFLICT: ${topConflict ? JSON.stringify(topConflict) : "None"}

Write analysis sections. Cite serial numbers. Do not fabricate information.

Respond ONLY with valid JSON:
{
  "executiveSummary": "string (3-4 sentences)",
  "topConflict": {
    "serialNumber": "string or null",
    "markName": "string or null",
    "whyItMatters": "string",
    "whatToDoAboutIt": "string"
  },
  "registrabilityAssessment": {
    "distinctiveness": "string",
    "likelihood": "STRONG|MODERATE|WEAK|BLOCKED",
    "reasoning": "string"
  },
  "recommendation": {
    "action": "PROCEED|PROCEED_WITH_CAUTION|REBRAND_RECOMMENDED|CONSULT_ATTORNEY",
    "reasoning": "string",
    "nextSteps": ["string", "string", "string"]
  },
  "disclaimer": "This AI Analysis Report is generated by artificial intelligence for informational purposes only. It does not constitute legal advice or create an attorney-client relationship. Consult a licensed trademark attorney for advice specific to your situation."
}`;

  const response = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODEL, max_tokens: 2000, temperature: 0.2,
      system: "You are a trademark attorney AI. Cite real data only. Never fabricate. Respond only in valid JSON.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find((b) => b.type === "text")?.text || "{}";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { error: "Ranking parse error" };
  }
}

export function stepQC(retrievalData, scoringData, rankingData) {
  const issues = [];
  if (!retrievalData.conflicts) issues.push("Missing conflicts array");
  if (!scoringData.overallRisk) issues.push("Missing overall risk score");
  if (!rankingData.executiveSummary) issues.push("Missing executive summary");
  if (!rankingData.recommendation?.action) issues.push("Missing recommendation action");

  const retrievedSerials = new Set(retrievalData.conflicts.map((c) => c.serialNumber).filter(Boolean));
  const scoredSerials = (scoringData.scoredConflicts || []).map((c) => c.serialNumber).filter(Boolean);
  const hallucinated = scoredSerials.filter((s) => s && !retrievedSerials.has(s));
  if (hallucinated.length > 0) issues.push(`Potential hallucinated serials: ${hallucinated.join(", ")}`);

  return { passed: issues.length === 0, issues, checkedAt: new Date().toISOString() };
}

// ── Full analysis pipeline (all 4 steps) ─────────────────────────────────────

export async function runAnalysis(mark, goodsServices, classCode, useType, prefetchedConflicts) {
  const anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_KEY;

  if (!anthropicKey) throw new Error("ANTHROPIC_KEY not configured");

  const startTime = Date.now();

  // If the frontend already has search results, use them directly.
  // This prevents a second independent search from missing conflicts shown on the left panel.
  let retrievalData;
  if (prefetchedConflicts && prefetchedConflicts.length > 0) {
    retrievalData = {
      searchedMark:    mark,
      phoneticVariant: null,
      totalFound:      prefetchedConflicts.length,
      activeCount:     prefetchedConflicts.filter(c => c.isActive).length,
      conflicts:       prefetchedConflicts.slice(0, 25),
    };
  } else {
    retrievalData = await stepRetrieve(mark, classCode);
  }
  const scoringData = await stepScore(mark, goodsServices, classCode, retrievalData, anthropicKey);
  const rankingData = await stepRank(mark, goodsServices, classCode, useType, scoringData, retrievalData, anthropicKey);
  const qcResult = stepQC(retrievalData, scoringData, rankingData);

  return {
    meta: { mark, goodsServices: goodsServices || null, classCode: classCode || null, useType: useType || null, generatedAt: new Date().toISOString(), elapsedMs: Date.now() - startTime, agentVersion: "1.0" },
    retrieval: { totalFound: retrievalData.totalFound, activeCount: retrievalData.activeCount, phoneticVariantSearched: retrievalData.phoneticVariant },
    scoring: { overallRisk: scoringData.overallRisk, highRiskCount: scoringData.highRiskCount || 0, mediumRiskCount: scoringData.mediumRiskCount || 0, lowRiskCount: scoringData.lowRiskCount || 0, scoredConflicts: scoringData.scoredConflicts || [] },
    analysis: rankingData,
    conflicts: retrievalData.conflicts,
    qc: qcResult,
  };
}
