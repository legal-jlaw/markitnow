// pages/api/intake-agent.js
// ─────────────────────────────────────────────────────────────────────────────
// AGENT 11: intake-agent
//
// Fires on $399 attorney filing retention (confirmed Stripe payment).
// Conducts structured intake and delivers filing-ready summary to attorney.
//
// Steps:
//   Step 1 - Validate:  Check provided info for completeness
//   Step 2 - Classify:  Recommend Nice classes and ID Manual descriptions
//   Step 3 - Flag:      Identify pre-filing issues (specimens, use dates, etc)
//   Step 4 - Package:   Deliver filing-ready summary to attorney queue
//
// POST /api/intake-agent
// Body: {
//   mark, ownerName, ownerType, ownerAddress, ownerEmail,
//   goodsServices, useInCommerce, firstUseDate, firstUseInCommerceDate,
//   specimenDescription, classCode (optional), existingRegistrations
// }
//
// Internal tool - output goes to attorney queue, not client.
// ─────────────────────────────────────────────────────────────────────────────

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

// ── Step 1: Validate intake completeness ──────────────────────────────────────

function stepValidate(intakeData) {
  const issues = [];
  const warnings = [];

  const {
    mark, ownerName, ownerType, ownerAddress, goodsServices,
    useInCommerce, firstUseDate, firstUseInCommerceDate, specimenDescription,
  } = intakeData;

  // Hard blockers
  if (!mark?.trim()) issues.push("Mark name is required");
  if (!ownerName?.trim()) issues.push("Owner name is required");
  if (!ownerType) issues.push("Owner type required (individual/corporation/LLC/partnership)");
  if (!ownerAddress?.trim()) issues.push("Owner address is required");
  if (!goodsServices?.trim()) issues.push("Goods/services description is required");

  // Filing basis issues
  if (useInCommerce === true) {
    if (!firstUseDate) warnings.push("First use date not provided - needed for Section 1(a) filing");
    if (!firstUseInCommerceDate) warnings.push("First use in commerce date not provided");
    if (!specimenDescription) warnings.push("Specimen description not provided - needed for Section 1(a) filing");
  } else if (useInCommerce === false) {
    // Intent to use - fewer requirements
  } else {
    warnings.push("Filing basis not specified (use in commerce vs intent to use)");
  }

  // Owner type validation
  const validTypes = ["individual", "corporation", "llc", "partnership", "sole proprietorship", "trust", "other"];
  if (ownerType && !validTypes.includes(ownerType.toLowerCase())) {
    warnings.push(`Unusual owner type: "${ownerType}" - verify entity classification`);
  }

  return {
    isComplete: issues.length === 0,
    blockers: issues,
    warnings,
    missingFields: issues.map(i => i.split(" ")[0].toLowerCase()),
  };
}

// ── Step 2: Classify goods/services and recommend ID Manual descriptions ──────

async function stepClassify(mark, goodsServices, classCode, anthropicKey) {
  const prompt = `You are a trademark attorney AI specializing in USPTO TEAS Plus filings. Classify the following goods/services and recommend USPTO ID Manual-compliant descriptions.

MARK: "${mark}"
GOODS/SERVICES (as described by applicant): "${goodsServices}"
SUGGESTED CLASS (if any): ${classCode || "Not specified"}

Your task:
1. Identify the correct Nice Classification class(es)
2. Recommend USPTO ID Manual-compliant identification language
3. Flag any custom/free-form language that would trigger the $200/class surcharge
4. Identify if multi-class filing is needed

Respond ONLY with valid JSON:
{
  "classifications": [
    {
      "classNumber": number,
      "className": "string",
      "idManualDescription": "string (USPTO ID Manual compliant language)",
      "applicantDescription": "string (what applicant provided)",
      "surchargeRisk": boolean,
      "surchargeReason": "string or null",
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],
  "isMultiClass": boolean,
  "totalClasses": number,
  "estimatedFilingFee": number,
  "idManualNotes": "string (any important notes about ID selection)",
  "alternativeDescriptions": ["string"] or []
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
      system: "You are a trademark attorney AI specializing in USPTO TEAS Plus ID Manual compliance. You recommend only established ID Manual language. You flag surcharge risks. You respond only in valid JSON.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find(b => b.type === "text")?.text || "{}";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ── Step 3: Flag pre-filing issues ────────────────────────────────────────────

async function stepFlag(intakeData, classificationData, anthropicKey) {
  const { mark, ownerType, useInCommerce, firstUseDate, firstUseInCommerceDate, specimenDescription, existingRegistrations } = intakeData;

  const prompt = `You are a trademark attorney AI reviewing a trademark filing intake for issues before submission.

MARK: "${mark}"
OWNER TYPE: ${ownerType}
FILING BASIS: ${useInCommerce ? "Section 1(a) - Use in Commerce" : "Section 1(b) - Intent to Use"}
FIRST USE DATE: ${firstUseDate || "Not provided"}
FIRST USE IN COMMERCE DATE: ${firstUseInCommerceDate || "Not provided"}
SPECIMEN DESCRIPTION: ${specimenDescription || "Not provided"}
EXISTING REGISTRATIONS: ${existingRegistrations || "None provided"}
CLASSIFICATION DATA: ${JSON.stringify(classificationData?.classifications?.map(c => ({ class: c.classNumber, description: c.idManualDescription })))}

Identify any pre-filing issues that need to be resolved before filing. Flag items that could cause:
- Refusal by examining attorney
- Procedural rejection
- Unnecessary surcharges
- Missed deadlines or legal issues

Respond ONLY with valid JSON:
{
  "preFiingIssues": [
    {
      "severity": "BLOCKER|WARNING|NOTE",
      "category": "string (e.g. 'Specimen', 'Dates', 'Owner', 'ID')",
      "issue": "string",
      "resolution": "string (how to fix)"
    }
  ],
  "specimenAssessment": {
    "adequate": boolean,
    "issues": ["string"] or [],
    "recommendations": ["string"] or []
  },
  "dateConsistency": {
    "consistent": boolean,
    "issues": ["string"] or []
  },
  "ownershipIssues": ["string"] or [],
  "readyToFile": boolean,
  "estimatedTimeToReady": "string (e.g. 'Ready now', '1-2 days to gather specimen')"
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
      system: "You are a trademark attorney AI reviewing filing intake for pre-filing issues. You flag issues that could cause refusal or problems. You respond only in valid JSON.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find(b => b.type === "text")?.text || "{}";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ── Step 4: Package for attorney queue ────────────────────────────────────────

function stepPackage(intakeData, validationData, classificationData, flagData) {
  const blockers = [...validationData.blockers, ...(flagData.preFiingIssues || []).filter(i => i.severity === "BLOCKER").map(i => i.issue)];
  const warnings = [...validationData.warnings, ...(flagData.preFiingIssues || []).filter(i => i.severity === "WARNING").map(i => i.issue)];

  const totalFee = (classificationData?.estimatedFilingFee || 350) + 399; // USPTO + service fee

  return {
    status: blockers.length > 0 ? "INTAKE_INCOMPLETE" : "READY_FOR_ATTORNEY_REVIEW",
    priority: flagData.readyToFile ? "READY" : "PENDING_CLIENT_INFO",
    summary: {
      mark: intakeData.mark,
      ownerName: intakeData.ownerName,
      ownerType: intakeData.ownerType,
      filingBasis: intakeData.useInCommerce ? "Section 1(a)" : "Section 1(b)",
      totalClasses: classificationData?.totalClasses || 1,
      estimatedTotalFee: totalFee,
      readyToFile: flagData.readyToFile,
      estimatedTimeToReady: flagData.estimatedTimeToReady,
      blockers,
      warnings,
    },
    filingDetails: {
      classifications: classificationData?.classifications || [],
      idManualNotes: classificationData?.idManualNotes,
      surchargeRisk: classificationData?.classifications?.some(c => c.surchargeRisk),
    },
    preFiingFlags: flagData.preFiingIssues || [],
    specimenAssessment: flagData.specimenAssessment,
    dateConsistency: flagData.dateConsistency,
    attorneyChecklist: [
      "Verify owner name matches entity formation documents",
      "Confirm filing basis (use vs ITU)",
      ...(flagData.specimenAssessment?.issues || []).map(i => `Specimen: ${i}`),
      ...(flagData.dateConsistency?.issues || []).map(i => `Dates: ${i}`),
      ...(flagData.preFiingIssues || []).filter(i => i.severity === "BLOCKER").map(i => `BLOCKER: ${i.resolution}`),
      "Review ID Manual descriptions for accuracy",
      "Confirm USPTO fees and payment",
      "File TEAS Plus application",
    ],
    rawIntake: intakeData,
    disclaimer: "ATTORNEY REVIEW REQUIRED. This intake summary was generated by AI and must be reviewed by a licensed trademark attorney before filing. The attorney is responsible for all filings submitted to the USPTO.",
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const intakeData = req.body;
  const { mark, ownerName, goodsServices } = intakeData;

  if (!mark?.trim()) return res.status(400).json({ error: "mark is required" });
  if (!ownerName?.trim()) return res.status(400).json({ error: "ownerName is required" });
  if (!goodsServices?.trim()) return res.status(400).json({ error: "goodsServices is required" });

  const anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_KEY;
  if (!anthropicKey) return res.status(500).json({ error: "ANTHROPIC_KEY not configured" });

  const startTime = Date.now();

  try {
    // Step 1: Validate
    console.log(`[Agent11] Step 1 - Validating intake for "${mark}"`);
    const validationData = stepValidate(intakeData);
    console.log(`[Agent11] Step 1 complete - Complete: ${validationData.isComplete} | Blockers: ${validationData.blockers.length}`);

    // Step 2: Classify
    console.log(`[Agent11] Step 2 - Classifying goods/services`);
    const classificationData = await stepClassify(mark, goodsServices, intakeData.classCode, anthropicKey);
    console.log(`[Agent11] Step 2 complete - Classes: ${classificationData.totalClasses} | Fee: $${classificationData.estimatedFilingFee}`);

    // Step 3: Flag pre-filing issues
    console.log(`[Agent11] Step 3 - Flagging pre-filing issues`);
    const flagData = await stepFlag(intakeData, classificationData, anthropicKey);
    console.log(`[Agent11] Step 3 complete - Ready to file: ${flagData.readyToFile} | Issues: ${flagData.preFiingIssues?.length}`);

    // Step 4: Package
    const packaged = stepPackage(intakeData, validationData, classificationData, flagData);
    console.log(`[Agent11] Step 4 complete - Status: ${packaged.status}`);

    return res.status(200).json({
      ...packaged,
      meta: {
        agentVersion: "1.0",
        elapsedMs: Date.now() - startTime,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[Agent11] Fatal error:", err);
    return res.status(500).json({ error: err.message });
  }
}
