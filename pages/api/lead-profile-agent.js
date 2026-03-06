// pages/api/lead-profile-agent.js
// ─────────────────────────────────────────────────────────────────────────────
// AGENT 3: lead-profile-agent
//
// Fires when a user submits their email after a free search.
// Uses the search results they already generated to profile the lead.
//
// Steps:
//   Step 1 - Profile:  Score lead urgency based on conflict data
//   Step 2 - Segment:  Route to one of 4 drip sequences
//   Step 3 - Personalize: Generate personalized Day 1 email subject + opener
//
// Segments:
//   HIGH_RISK    - Active conflicts found, needs immediate action
//   PENDING_APP  - Has existing trademark (searched to monitor)
//   CLEAN_FIELD  - No conflicts, clear path to file
//   EXPLORER     - Early stage, just researching
//
// POST /api/lead-profile-agent
// Body: { email, mark, conflictCount, activeCount, goodsServices, source }
// ─────────────────────────────────────────────────────────────────────────────

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001"; // Haiku - fast, cheap, sufficient for profiling

// ── Step 1: Score lead urgency ────────────────────────────────────────────────

function stepProfile(mark, conflictCount, activeCount, goodsServices, source) {
  const score = {
    mark,
    conflictCount: conflictCount || 0,
    activeCount: activeCount || 0,
    goodsServices: goodsServices || null,
    source: source || "direct",
    urgencyScore: 0,
    urgencyFactors: [],
  };

  // Active conflicts = highest urgency signal
  if (activeCount >= 3) {
    score.urgencyScore += 40;
    score.urgencyFactors.push("3+ active conflicts found");
  } else if (activeCount >= 1) {
    score.urgencyScore += 25;
    score.urgencyFactors.push("Active conflict found");
  }

  // High total conflict count = busy class
  if (conflictCount >= 10) {
    score.urgencyScore += 20;
    score.urgencyFactors.push("Crowded trademark class");
  } else if (conflictCount >= 5) {
    score.urgencyScore += 10;
    score.urgencyFactors.push("Multiple similar marks exist");
  }

  // Goods/services provided = more serious buyer
  if (goodsServices) {
    score.urgencyScore += 15;
    score.urgencyFactors.push("Provided goods/services description");
  }

  // Paid traffic = higher intent
  if (source === "google_cpc" || source === "paid") {
    score.urgencyScore += 10;
    score.urgencyFactors.push("Paid traffic source");
  }

  // No conflicts = clean field, lower urgency but high conversion potential
  if (activeCount === 0 && conflictCount === 0) {
    score.urgencyScore = 30; // Base score - clear field is actually a buying signal
    score.urgencyFactors.push("Clean field - clear path to register");
  }

  return score;
}

// ── Step 2: Segment lead ──────────────────────────────────────────────────────

function stepSegment(profileData) {
  const { urgencyScore, activeCount, conflictCount, urgencyFactors } = profileData;

  // High conflict = immediate risk, needs action now
  if (activeCount >= 2 || urgencyScore >= 55) {
    return {
      segment: "HIGH_RISK",
      label: "High Risk",
      dripSequence: "high_risk",
      primaryCTA: "AI Analysis Report",
      primaryCTAPrice: "$99",
      urgency: "HIGH",
      reasoning: `${activeCount} active conflicts detected. Immediate analysis needed before filing.`,
    };
  }

  // Some conflicts, moderate urgency
  if (activeCount === 1 || (conflictCount >= 3 && urgencyScore >= 30)) {
    return {
      segment: "CONFLICT_PRESENT",
      label: "Conflict Present",
      dripSequence: "conflict_present",
      primaryCTA: "AI Analysis Report",
      primaryCTAPrice: "$99",
      urgency: "MEDIUM",
      reasoning: "Conflicts present. Analysis needed to assess registrability.",
    };
  }

  // Clean field = easy sell on filing
  if (activeCount === 0 && conflictCount === 0) {
    return {
      segment: "CLEAN_FIELD",
      label: "Clean Field",
      dripSequence: "clean_field",
      primaryCTA: "Attorney Filing",
      primaryCTAPrice: "$399",
      urgency: "MEDIUM",
      reasoning: "Clean search result. Strong candidate for direct filing.",
    };
  }

  // Default - general explorer
  return {
    segment: "EXPLORER",
    label: "Explorer",
    dripSequence: "explorer",
    primaryCTA: "AI Analysis Report",
    primaryCTAPrice: "$99",
    urgency: "LOW",
    reasoning: "Early stage researcher. Needs education before conversion.",
  };
}

// ── Step 3: Generate personalized email opener ────────────────────────────────

async function stepPersonalize(mark, profileData, segmentData, anthropicKey) {
  const prompt = `You are writing the opening lines of a follow-up email for a trademark search tool.

The user just searched for: "${mark}"
Conflict data: ${profileData.activeCount} active conflicts, ${profileData.conflictCount} total results
Segment: ${segmentData.segment}
Primary CTA: ${segmentData.primaryCTA} (${segmentData.primaryCTAPrice})
Urgency: ${segmentData.urgency}

Write a personalized email subject line and opening sentence for this specific user.
Rules:
- Subject: max 8 words, no clickbait, reference the mark by name
- Opener: 1 sentence, conversational, references what they found (or didn't find)
- If HIGH_RISK: lead with the risk finding, not the product
- If CLEAN_FIELD: lead with the good news, then pivot to next step
- If CONFLICT_PRESENT: acknowledge the finding, frame it as solvable
- If EXPLORER: educational tone, no pressure
- Never fabricate specific legal conclusions
- Never say "I" - write from the brand voice of MarkItNow

Respond ONLY with valid JSON:
{
  "subject": "string",
  "opener": "string"
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
        max_tokens: 200,
        temperature: 0.3,
        system:
          "You write personalized email copy for a trademark search platform. You reference real search data only. You respond only in valid JSON. You never fabricate legal conclusions.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.find((b) => b.type === "text")?.text || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    // Fallback to segment-based defaults if AI call fails
    const fallbacks = {
      HIGH_RISK: {
        subject: `"${mark}" has active conflicts - here's what that means`,
        opener: `Your search for "${mark}" turned up active marks that could affect your filing.`,
      },
      CONFLICT_PRESENT: {
        subject: `What those "${mark}" results mean for your filing`,
        opener: `Your search for "${mark}" returned some results worth looking at before you file.`,
      },
      CLEAN_FIELD: {
        subject: `Good news on "${mark}" - here's your next step`,
        opener: `Your search for "${mark}" came back clean - that's a strong signal you have a clear path to register.`,
      },
      EXPLORER: {
        subject: `Your "${mark}" trademark search results`,
        opener: `You searched for "${mark}" - here's what you need to know before you decide what to do next.`,
      },
    };
    return fallbacks[segmentData.segment] || fallbacks.EXPLORER;
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { email, mark, conflictCount, activeCount, goodsServices, source } = req.body;

  if (!email?.trim()) return res.status(400).json({ error: "email required" });
  if (!mark?.trim()) return res.status(400).json({ error: "mark required" });

  const anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_KEY;
  if (!anthropicKey) return res.status(500).json({ error: "ANTHROPIC_KEY not configured" });

  const startTime = Date.now();

  try {
    // ── Step 1: Profile ──
    console.log(`[Agent3] Step 1 - Profiling lead: ${email} | mark: "${mark}" | conflicts: ${activeCount} active`);
    const profileData = stepProfile(mark, conflictCount, activeCount, goodsServices, source);
    console.log(`[Agent3] Step 1 complete - Urgency score: ${profileData.urgencyScore}`);

    // ── Step 2: Segment ──
    console.log(`[Agent3] Step 2 - Segmenting lead`);
    const segmentData = stepSegment(profileData);
    console.log(`[Agent3] Step 2 complete - Segment: ${segmentData.segment}`);

    // ── Step 3: Personalize ──
    console.log(`[Agent3] Step 3 - Generating personalized email opener`);
    const personalizedCopy = await stepPersonalize(mark, profileData, segmentData, anthropicKey);
    console.log(`[Agent3] Step 3 complete - Subject: "${personalizedCopy.subject}"`);

    const elapsed = Date.now() - startTime;

    return res.status(200).json({
      email,
      mark,
      profile: profileData,
      segment: segmentData,
      emailCopy: personalizedCopy,
      meta: {
        agentVersion: "1.0",
        elapsedMs: elapsed,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[Agent3] Fatal error:", err);
    return res.status(500).json({ error: err.message });
  }
}
