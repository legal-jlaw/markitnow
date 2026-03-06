// pages/api/ai-report.js
// ─────────────────────────────────────────────────────────────────────────────
// Server-side AI report generation. Keeps the Anthropic API key safe.
//
// POST /api/ai-report
// Body: { type: "report" | "memo", mark: string, goods?: string, trademarks: array }
//
// Returns the parsed JSON report/memo directly.
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { type, mark, goods, trademarks } = req.body;

  if (!type || !mark) {
    return res.status(400).json({ error: "type and mark are required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  // Build conflict text from search results
  const conflictList = (trademarks || []).slice(0, 15);
  const conflictText = conflictList
    .map(
      (c, i) =>
        `${i + 1}. "${c.markName}" | Owner: ${c.owner} | Status: ${c.status} | Class: ${c.classCode} | Serial: ${c.serialNumber}`
    )
    .join("\n");

  const conflictSection = conflictList.length
    ? `LIVE USPTO RESULTS (${trademarks.length} marks found matching "${mark}" or its keywords):\n${conflictText}`
    : `LIVE USPTO RESULTS: No marks found for "${mark}" — appears to be a clear mark.`;

  const isReport = type === "report";

  const systemPrompt = isReport
    ? `You are a plain-English trademark advisor. Write clearly, no legal jargon. Be honest about risks without being alarming.`
    : `You are a senior USPTO trademark attorney writing an internal legal memorandum. Cite Lanham Act sections (15 U.S.C. §), TMEP sections, and relevant TTAB or Federal Circuit cases. Apply DuPont factors. This is attorney work product.`;

  const userPrompt = isReport
    ? `A client wants to trademark: "${mark}"
Used for: ${goods || "general commercial use"}
${conflictSection}

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "executiveSummary": "2-3 sentence plain-English bottom line referencing real search results",
  "whyItCouldWork": [{"reason":"headline","explanation":"1-2 sentences","legalHook":"legal principle"}],
  "whyItMightNotWork": [{"reason":"headline","explanation":"1-2 sentences","legalHook":"legal principle"}],
  "conflictSnapshot": [{"markName":"EXACT REAL NAME","owner":"Actual Owner","class":41,"risk":"LOW/MEDIUM/HIGH","reason":"Why this conflicts","serialNumber":"from data"}],
  "overallRiskLevel": "LOW/MEDIUM/HIGH",
  "whatHappensNext": "2-3 sentence plain English next steps",
  "clientConfidenceScore": 72
}`
    : `Trademark Registrability Memo
MARK: "${mark}" | GOODS: ${goods || "TBD"} | BASIS: Section 1(b)
${conflictSection}

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "memoSummary": "One paragraph with legal citations referencing actual search results",
  "whyItCouldWork": [{"argument":"headline","analysis":"detailed paragraph","citations":["15 U.S.C. § 1052"]}],
  "whyItMightNotWork": [{"obstacle":"headline","analysis":"detailed paragraph citing specific marks","citations":["citation"]}],
  "duPontAnalysis": {
    "overview": "Summary citing In re E.I. DuPont de Nemours & Co., 177 U.S.P.Q. 563 (C.C.P.A. 1973)",
    "factors": [
      {"factor":"Similarity of the marks","number":1,"finding":"FAVORABLE/UNFAVORABLE/NEUTRAL","analysis":"analysis"},
      {"factor":"Similarity of goods/services","number":2,"finding":"FAVORABLE/UNFAVORABLE/NEUTRAL","analysis":"analysis"},
      {"factor":"Channels of trade","number":3,"finding":"FAVORABLE/UNFAVORABLE/NEUTRAL","analysis":"analysis"},
      {"factor":"Strength of the mark","number":5,"finding":"FAVORABLE/UNFAVORABLE/NEUTRAL","analysis":"analysis citing Abercrombie & Fitch"}
    ]
  },
  "prosecutionStrategy": [{"action":"action","rationale":"rationale","citation":"citation"}],
  "riskMatrix": [{"risk":"risk","likelihood":"LOW/MEDIUM/HIGH","severity":"LOW/MEDIUM/HIGH","mitigation":"strategy"}],
  "overallLegalAssessment": "LOW/MEDIUM/HIGH",
  "recommendProceed": true,
  "proceedRationale": "recommendation with legal basis"
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return res.status(500).json({
        error: data.error?.message || "AI generation failed",
      });
    }

    const text = data.content?.find((b) => b.type === "text")?.text || "{}";

    // Parse the JSON response, stripping any accidental markdown fences
    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch (parseErr) {
      console.error("JSON parse error from AI:", parseErr.message);
      console.error("Raw text:", text.slice(0, 500));
      return res.status(500).json({ error: "AI returned invalid JSON", raw: text.slice(0, 500) });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("AI report error:", err);
    return res.status(500).json({ error: err.message });
  }
}
