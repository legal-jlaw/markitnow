// pages/api/protection-score.js
// Runs USPTO search and returns a brand protection score + findings

const RAPIDAPI_HOST = "uspto-trademark.p.rapidapi.com";

function normalizeItem(t) {
  return {
    markName: t.keyword || t.mark_identification || "",
    serialNumber: t.serial_number || "",
    owner: t.owners?.[0]?.name || "Unknown",
    status: t.status_label || t.status || "",
    filingDate: t.filing_date || "",
    classCode: Array.isArray(t.class_codes) ? t.class_codes.join(", ") : t.class_codes || "",
    isActive:
      (t.status_label || "").toLowerCase().includes("live") ||
      (t.status_label || "").toLowerCase().includes("registered") ||
      (t.status_label || "").toLowerCase().includes("pending"),
    isRegistered:
      (t.status_label || "").toLowerCase().includes("registered"),
  };
}

async function queryUSPTO(keyword, status, apiKey) {
  const url = `https://${RAPIDAPI_HOST}/v1/trademarkSearch/${encodeURIComponent(keyword.trim())}/${status}`;
  const res = await fetch(url, {
    headers: { "x-rapidapi-key": apiKey, "x-rapidapi-host": RAPIDAPI_HOST },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items || []).map(normalizeItem);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { mark } = req.query;
  if (!mark?.trim()) return res.status(400).json({ error: "mark required" });

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });

  const trimmed = mark.trim();

  try {
    const [allResults, activeResults] = await Promise.all([
      queryUSPTO(trimmed, "all", apiKey),
      queryUSPTO(trimmed, "active", apiKey),
    ]);

    // Deduplicate
    const seen = new Set();
    const combined = [...allResults, ...activeResults].filter(item => {
      const key = item.serialNumber || `${item.markName}__${item.owner}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const exactMatch = combined.find(
      i => i.markName.toLowerCase() === trimmed.toLowerCase() && i.isRegistered
    );
    const activeConflicts = activeResults.filter(
      i => i.markName.toLowerCase() !== trimmed.toLowerCase()
    );
    const exactActive = combined.filter(
      i => i.markName.toLowerCase() === trimmed.toLowerCase() && i.isActive
    );
    const totalConflicts = activeConflicts.length;
    const isRegistered = !!exactMatch;
    const hasPending = exactActive.some(i =>
      (i.status || "").toLowerCase().includes("pending")
    );

    // Score calculation (0-100)
    let score = 100;
    const findings = [];

    // No federal registration — big deduction
    if (!isRegistered) {
      score -= 40;
      findings.push({
        type: "danger",
        icon: "⚠️",
        text: "No active federal registration found for this mark",
        cta: "File Now",
        path: "/file",
      });
    } else {
      findings.push({
        type: "good",
        icon: "✓",
        text: "Active federal trademark registration found",
        cta: null,
        path: null,
      });
    }

    // Conflicts
    if (totalConflicts >= 5) {
      score -= 30;
      findings.push({
        type: "danger",
        icon: "⚠️",
        text: `${totalConflicts} similar marks found in the USPTO database`,
        cta: "Get AI Conflict Analysis",
        path: "/file",
      });
    } else if (totalConflicts >= 2) {
      score -= 15;
      findings.push({
        type: "warning",
        icon: "⚡",
        text: `${totalConflicts} potentially similar marks found`,
        cta: "Review Conflicts",
        path: "/file",
      });
    } else if (totalConflicts === 1) {
      score -= 8;
      findings.push({
        type: "warning",
        icon: "⚡",
        text: "1 similar mark found — low risk but worth reviewing",
        cta: "Review",
        path: "/file",
      });
    } else {
      findings.push({
        type: "good",
        icon: "✓",
        text: "No similar active marks found in USPTO database",
        cta: null,
        path: null,
      });
    }

    // No monitoring
    score -= 15;
    findings.push({
      type: "warning",
      icon: "⚡",
      text: "No active monitoring — new conflicts won't be flagged",
      cta: "Start Monitoring",
      path: "/protect",
    });

    // Pending application
    if (hasPending && !isRegistered) {
      score += 10;
      findings.push({
        type: "info",
        icon: "📋",
        text: "Pending USPTO application found — registration in progress",
        cta: null,
        path: null,
      });
    }

    score = Math.max(0, Math.min(100, score));

    let grade, label, color;
    if (score >= 80) { grade = "A"; label = "Well Protected"; color = "#22c55e"; }
    else if (score >= 60) { grade = "B"; label = "Moderate Risk"; color = "#f59e0b"; }
    else if (score >= 40) { grade = "C"; label = "Needs Attention"; color = "#f97316"; }
    else { grade = "D"; label = "At Risk"; color = "#ef4444"; }

    return res.status(200).json({
      mark: trimmed,
      score,
      grade,
      label,
      color,
      findings,
      stats: {
        isRegistered,
        totalConflicts,
        hasPending,
      },
    });
  } catch (err) {
    console.error("Protection score error:", err);
    return res.status(500).json({ error: err.message });
  }
}
