// lib/ai.js
// Calls Anthropic API for trademark analysis reports
// Uses the same prompts as the Claude artifact

const ANTHROPIC_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_KEY;

const CLIENT_SYSTEM = `You are a plain-English trademark advisor helping a business owner understand whether their brand name can be trademarked. Write clearly and friendly with no legal jargon. Be honest about risks without being alarming.`;

const ATTORNEY_SYSTEM = `You are a senior USPTO trademark attorney writing an internal legal analysis memorandum. Cite specific Lanham Act sections (by 15 U.S.C. section number), TMEP sections, and relevant TTAB or Federal Circuit cases by name and citation. Apply DuPont factors where relevant. This is attorney work product.`;

function buildClientPrompt(mark, goods, classes, liveConflicts) {
  const conflictSection = liveConflicts?.length
    ? `LIVE USPTO DATABASE RESULTS — ${liveConflicts.length} marks found matching "${mark}":
${liveConflicts.map((c, i) => `${i + 1}. "${c.markName}" | Owner: ${c.owner} | Status: ${c.status} | Class: ${c.classCode} | Serial: ${c.serialNumber}`).join("\n")}
Analyze each for likelihood of confusion. Include real marks in conflictSnapshot with accurate serial numbers.`
    : `LIVE USPTO DATABASE RESULTS: No active marks found matching "${mark}". Analyze on mark strength and descriptiveness.`;

  return `A client wants to trademark: "${mark}"
Used for: ${goods}
Proposed classes: ${classes || "TBD"}

${conflictSection}

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "executiveSummary": "2-3 sentence plain-English bottom line referencing real search results",
  "whyItCouldWork": [{ "reason": "headline", "explanation": "1-2 sentences", "legalHook": "legal principle" }],
  "whyItMightNotWork": [{ "reason": "headline", "explanation": "1-2 sentences", "legalHook": "legal principle" }],
  "conflictSnapshot": [{ "markName": "REAL MARK NAME", "owner": "Actual Owner", "class": 41, "risk": "LOW/MEDIUM/HIGH", "reason": "Why this conflicts", "serialNumber": "from data" }],
  "overallRiskLevel": "LOW/MEDIUM/HIGH",
  "whatHappensNext": "2-3 sentence plain English next steps",
  "clientConfidenceScore": 72
}`;
}

function buildAttorneyPrompt(mark, goods, classes, basis, liveConflicts) {
  const conflictSection = liveConflicts?.length
    ? `LIVE USPTO SEARCH RESULTS — ${liveConflicts.length} marks returned for "${mark}":
${liveConflicts.map((c, i) => `${i + 1}. "${c.markName}" | Owner: ${c.owner} | Status: ${c.status} | Class: ${c.classCode} | Serial: ${c.serialNumber}`).join("\n")}
Conduct full DuPont likelihood of confusion analysis for each materially relevant cited mark.`
    : `LIVE USPTO SEARCH RESULTS: No active marks found for "${mark}". Analyze on mark strength and descriptiveness spectrum.`;

  return `Trademark Registrability Memo
MARK: "${mark}" | GOODS: ${goods} | CLASSES: ${classes || "TBD"} | BASIS: ${basis}

${conflictSection}

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "memoSummary": "One paragraph with legal citations referencing actual USPTO search results",
  "whyItCouldWork": [{ "argument": "headline", "analysis": "detailed paragraph", "citations": ["15 U.S.C. § 1052"] }],
  "whyItMightNotWork": [{ "obstacle": "headline", "analysis": "detailed paragraph citing specific conflicting marks", "citations": ["citation"] }],
  "duPontAnalysis": {
    "overview": "Summary citing In re E.I. DuPont de Nemours & Co., 177 U.S.P.Q. 563 (C.C.P.A. 1973)",
    "factors": [
      { "factor": "Similarity of the marks", "number": 1, "finding": "FAVORABLE/UNFAVORABLE/NEUTRAL", "analysis": "analysis" },
      { "factor": "Similarity of goods/services", "number": 2, "finding": "FAVORABLE/UNFAVORABLE/NEUTRAL", "analysis": "analysis" },
      { "factor": "Channels of trade", "number": 3, "finding": "FAVORABLE/UNFAVORABLE/NEUTRAL", "analysis": "analysis" },
      { "factor": "Conditions of sale", "number": 4, "finding": "FAVORABLE/UNFAVORABLE/NEUTRAL", "analysis": "analysis" },
      { "factor": "Strength of the mark", "number": 5, "finding": "FAVORABLE/UNFAVORABLE/NEUTRAL", "analysis": "analysis citing Abercrombie & Fitch" }
    ]
  },
  "prosecutionStrategy": [{ "action": "action", "rationale": "rationale", "citation": "citation" }],
  "riskMatrix": [{ "risk": "risk", "likelihood": "LOW/MEDIUM/HIGH", "severity": "LOW/MEDIUM/HIGH", "mitigation": "strategy" }],
  "overallLegalAssessment": "LOW/MEDIUM/HIGH",
  "recommendProceed": true,
  "proceedRationale": "recommendation with legal basis"
}`;
}

export async function generateClientReport(mark, goods, classes, liveConflicts) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: CLIENT_SYSTEM,
      messages: [{ role: "user", content: buildClientPrompt(mark, goods, classes, liveConflicts) }],
    }),
  });
  const data = await res.json();
  const text = data.content?.find(b => b.type === "text")?.text || "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

export async function generateAttorneyMemo(mark, goods, classes, basis, liveConflicts) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: ATTORNEY_SYSTEM,
      messages: [{ role: "user", content: buildAttorneyPrompt(mark, goods, classes, basis, liveConflicts) }],
    }),
  });
  const data = await res.json();
  const text = data.content?.find(b => b.type === "text")?.text || "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
