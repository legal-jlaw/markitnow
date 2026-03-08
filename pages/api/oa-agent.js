// pages/api/oa-agent.js
// ─────────────────────────────────────────────────────────────────────────────
// AGENT 10: oa-agent (Office Action Drafting Agent)
//
// Internal tool - attorney review required before delivery to client.
//
// Accepts: Office Action text or structured OA data
// Outputs: Structured response draft for attorney review
//
// Steps:
//   Step 1 - Parse:   Identify OA type, refusal grounds, deadlines
//   Step 2 - Research: Identify applicable arguments and precedents
//   Step 3 - Draft:   Generate response structure with arguments
//   Step 4 - Package: Format for attorney review queue
//
// POST /api/oa-agent
// Body: { oaText, mark, serialNumber, goodsServices, classCode }
//
// OA Types handled:
//   - Section 2(d) Likelihood of Confusion
//   - Section 2(e)(1) Merely Descriptive
//   - Section 2(e)(4) Primarily Merely a Surname
//   - Specimen refusal
//   - Identification of goods/services amendment needed
//   - Disclaimer requirement
//
// MANDATORY: Output is labeled as draft for attorney review.
//            Never delivered directly to client without attorney sign-off.
// ─────────────────────────────────────────────────────────────────────────────

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

// ── Step 1: Parse Office Action ───────────────────────────────────────────────

async function stepParse(oaText, mark, serialNumber, anthropicKey) {
  const prompt = `You are a trademark attorney AI. Parse this USPTO Office Action and extract structured information.

MARK: "${mark}"
SERIAL NUMBER: ${serialNumber || "Not provided"}

OFFICE ACTION TEXT:
${oaText}

Extract all refusal grounds and requirements. Be precise about section numbers cited.

Respond ONLY with valid JSON:
{
  "oaType": "NON_FINAL|FINAL|EXAMINER_AMENDMENT|OTHER",
  "responseDeadline": "string (deadline mentioned or '3 months from mailing date - extendable to 6')",
  "mailingDate": "string or null",
  "examinerName": "string or null",
  "examinerPhone": "string or null",
  "refusalGrounds": [
    {
      "section": "string (e.g. '2(d)', '2(e)(1)')",
      "type": "string (e.g. 'Likelihood of Confusion', 'Merely Descriptive')",
      "conflictingMark": "string or null (if 2d refusal)",
      "conflictingSerial": "string or null",
      "details": "string (specific examiner reasoning)"
    }
  ],
  "requirements": [
    {
      "type": "string (e.g. 'Disclaimer', 'Specimen', 'ID Amendment')",
      "details": "string"
    }
  ],
  "isDeadlineUrgent": boolean,
  "complexity": "SIMPLE|MODERATE|COMPLEX"
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
      temperature: 0,
      system: "You are a trademark attorney AI parsing USPTO Office Actions. You extract only information present in the OA text. You never fabricate refusal grounds or deadlines. You respond only in valid JSON.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find(b => b.type === "text")?.text || "{}";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ── Step 2: Research arguments and precedents ─────────────────────────────────

async function stepResearch(parsedOA, mark, goodsServices, anthropicKey) {
  const refusals = parsedOA.refusalGrounds || [];

  const prompt = `You are a trademark attorney AI. Based on these Office Action refusal grounds, identify the strongest response arguments.

MARK: "${mark}"
GOODS/SERVICES: ${goodsServices || "Not specified"}

REFUSAL GROUNDS:
${JSON.stringify(refusals, null, 2)}

For each refusal ground, identify:
1. Best available arguments for response
2. Key TTAB/Federal Circuit cases supporting those arguments (only cite cases you are confident exist - if uncertain, note "verify case citation")
3. Whether the refusal is likely overcomenable
4. Strategic considerations (amend goods/services vs. argue vs. appeal)

Respond ONLY with valid JSON:
{
  "arguments": [
    {
      "refusalSection": "string",
      "overcomeability": "LIKELY|POSSIBLE|UNLIKELY|REQUIRES_AMENDMENT",
      "primaryArguments": ["string"],
      "supportingCases": [
        {
          "citation": "string",
          "relevance": "string",
          "confidence": "HIGH|MEDIUM|LOW - verify before using"
        }
      ],
      "strategicOptions": ["string"],
      "recommendedApproach": "string"
    }
  ],
  "overallStrategy": "string (2-3 sentences on overall response strategy)",
  "estimatedSuccessRate": "HIGH|MODERATE|LOW",
  "requiresAttorneyJudgment": ["string (specific items needing attorney input)"]
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
      max_tokens: 3000,
      temperature: 0.2,
      system: "You are a trademark attorney AI identifying response arguments for USPTO Office Actions. You flag uncertain case citations. You always note items requiring attorney judgment. You respond only in valid JSON.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find(b => b.type === "text")?.text || "{}";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ── Step 3: Draft response ────────────────────────────────────────────────────

async function stepDraft(parsedOA, research, mark, serialNumber, goodsServices, anthropicKey) {
  const prompt = `You are a trademark attorney AI drafting an Office Action response. This draft requires attorney review before filing.

MARK: "${mark}"
SERIAL: ${serialNumber || "Not provided"}
GOODS/SERVICES: ${goodsServices || "Not specified"}

PARSED OA:
${JSON.stringify(parsedOA, null, 2)}

RESEARCH:
${JSON.stringify(research, null, 2)}

Draft a complete Office Action response. Format as a professional USPTO response letter.

Rules:
- Draft ONLY - clearly label as requiring attorney review
- Use proper USPTO response format
- Address each refusal ground with specific arguments
- Address each requirement
- Include proper signature block placeholder
- Flag any items needing attorney judgment with [ATTORNEY: note]
- Do not fabricate case citations - use [VERIFY CITATION] if uncertain

Respond ONLY with valid JSON:
{
  "draft": {
    "header": {
      "to": "Commissioner for Trademarks",
      "re": "string",
      "serialNumber": "string",
      "markName": "string",
      "responseDeadline": "string"
    },
    "introduction": "string",
    "responseToRefusals": [
      {
        "section": "string",
        "heading": "string",
        "argument": "string (full argument text)",
        "attorneyFlags": ["string"] or []
      }
    ],
    "responseToRequirements": [
      {
        "requirement": "string",
        "response": "string",
        "attorneyFlags": ["string"] or []
      }
    ],
    "conclusion": "string",
    "signatureBlock": "Respectfully submitted,\n\n[ATTORNEY NAME]\n[BAR NUMBER]\n[FIRM NAME]\n[ADDRESS]\n[PHONE]\n[EMAIL]",
    "attachmentsNeeded": ["string"] or [],
    "totalAttorneyFlags": number
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
      max_tokens: 5000,
      temperature: 0.2,
      system: "You are a trademark attorney AI drafting USPTO Office Action responses. All drafts require attorney review before filing. You flag uncertain items. You respond only in valid JSON.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find(b => b.type === "text")?.text || "{}";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ── Step 4: Package for attorney queue ────────────────────────────────────────

function stepPackage(parsedOA, research, draftData, mark, serialNumber) {
  const draft = draftData.draft;
  const attorneyFlags = draft?.totalAttorneyFlags || 0;
  const complexity = parsedOA.complexity || "MODERATE";
  const deadline = parsedOA.responseDeadline;

  return {
    status: "PENDING_ATTORNEY_REVIEW",
    priority: parsedOA.isDeadlineUrgent ? "URGENT" : complexity === "COMPLEX" ? "HIGH" : "NORMAL",
    summary: {
      mark,
      serialNumber,
      oaType: parsedOA.oaType,
      refusalCount: parsedOA.refusalGrounds?.length || 0,
      requirementCount: parsedOA.requirements?.length || 0,
      responseDeadline: deadline,
      estimatedSuccessRate: research.estimatedSuccessRate,
      complexity,
      attorneyFlagsInDraft: attorneyFlags,
    },
    parsedOA,
    research,
    draft,
    attorneyChecklist: [
      "Review all [ATTORNEY: ...] flags in draft",
      "Verify all case citations marked [VERIFY CITATION]",
      "Confirm response strategy aligns with client goals",
      "Review attachments needed list",
      "Sign and file before deadline",
      ...(research.requiresAttorneyJudgment || []),
    ],
    disclaimer: "ATTORNEY REVIEW REQUIRED. This draft was generated by AI and must be reviewed, edited, and approved by a licensed trademark attorney before filing with the USPTO. Do not file this response without attorney sign-off.",
  };
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
const { aiLimiter, applyRateLimit } = require("../../lib/rateLimit");

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (applyRateLimit(req, res, aiLimiter)) return;

  const { oaText, mark, serialNumber, goodsServices, classCode } = req.body;
  if (!oaText?.trim()) return res.status(400).json({ error: "oaText is required" });
  if (!mark?.trim()) return res.status(400).json({ error: "mark is required" });

  const anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_KEY;
  if (!anthropicKey) return res.status(500).json({ error: "ANTHROPIC_KEY not configured" });

  const startTime = Date.now();

  try {
    // Step 1: Parse OA
    console.log(`[Agent10] Step 1 - Parsing Office Action for "${mark}" (Serial: ${serialNumber})`);
    const parsedOA = await stepParse(oaText, mark, serialNumber, anthropicKey);
    console.log(`[Agent10] Step 1 complete - ${parsedOA.refusalGrounds?.length} refusals, complexity: ${parsedOA.complexity}`);

    // Step 2: Research arguments
    console.log(`[Agent10] Step 2 - Researching arguments`);
    const research = await stepResearch(parsedOA, mark, goodsServices, anthropicKey);
    console.log(`[Agent10] Step 2 complete - Success rate: ${research.estimatedSuccessRate}`);

    // Step 3: Draft response
    console.log(`[Agent10] Step 3 - Drafting response`);
    const draftData = await stepDraft(parsedOA, research, mark, serialNumber, goodsServices, anthropicKey);
    console.log(`[Agent10] Step 3 complete - ${draftData.draft?.totalAttorneyFlags} attorney flags`);

    // Step 4: Package for attorney queue
    const packaged = stepPackage(parsedOA, research, draftData, mark, serialNumber);
    console.log(`[Agent10] Step 4 complete - Priority: ${packaged.priority}`);

    return res.status(200).json({
      ...packaged,
      meta: {
        agentVersion: "1.0",
        elapsedMs: Date.now() - startTime,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[Agent10] Fatal error:", err);
    return res.status(500).json({ error: err.message });
  }
}
