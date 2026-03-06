// pages/api/trademark-search.js
// ─────────────────────────────────────────────────────────────────────────────
// Comprehensive USPTO trademark search proxy.
// Runs MULTIPLE queries in parallel to get broad results like Trademarkia:
//   1. Exact match / all statuses
//   2. First word only (catches "STRANGE BREWERY", "STRANGE WATER WORKS", etc.)
//   3. Active-only exact match (for risk highlighting)
// Deduplicates by serial number. Returns normalized items.
//
// GET /api/trademark-search?mark=strange+water
// GET /api/trademark-search?mark=strange+water&mode=active   (active only)
// ─────────────────────────────────────────────────────────────────────────────

const RAPIDAPI_HOST = "uspto-trademark.p.rapidapi.com";

function rapidHeaders(apiKey) {
  return {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": RAPIDAPI_HOST,
  };
}

function normalizeItem(t) {
  // Log raw fields on first call to debug
  if (!normalizeItem._logged) { console.log('[USPTO raw fields]', JSON.stringify(Object.keys(t))); normalizeItem._logged = true; }
  return {
    markName: t.keyword || t.mark_identification || "",
    serialNumber: t.serial_number || "",
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

async function queryRapidAPI(keyword, status, apiKey) {
  const encoded = encodeURIComponent(keyword.trim());
  const url = `https://${RAPIDAPI_HOST}/v1/trademarkSearch/${encoded}/${status}`;
  const res = await fetch(url, { headers: rapidHeaders(apiKey) });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items || []).map(normalizeItem);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { mark, mode = "all" } = req.query;
  if (!mark?.trim()) return res.status(400).json({ error: "mark parameter required" });

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });

  const trimmed = mark.trim();
  const firstWord = trimmed.split(/\s+/)[0]; // "strange water" → "strange"

  try {
    // Run parallel queries for broad coverage
    const queries = [
      queryRapidAPI(trimmed, "all", apiKey),           // exact full mark, all statuses
      queryRapidAPI(trimmed, "active", apiKey),        // exact, active only
    ];

    // If multi-word, also search first word for broader results
    if (firstWord.length > 2 && firstWord.toLowerCase() !== trimmed.toLowerCase()) {
      queries.push(queryRapidAPI(firstWord, "active", apiKey));
    }

    const results = await Promise.allSettled(queries);
    const allItems = results.flatMap(r => r.status === "fulfilled" ? r.value : []);

    // Deduplicate by serial number, prefer entries with more data
    const seen = new Map();
    for (const item of allItems) {
      const key = item.serialNumber || `${item.markName}__${item.owner}`;
      if (!seen.has(key)) {
        seen.set(key, item);
      }
    }

    const deduplicated = [...seen.values()];

    // Sort: active marks first, then by filing date descending
    deduplicated.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return (b.filingDate || "").localeCompare(a.filingDate || "");
    });

    // Stats
    const activeCount = deduplicated.filter(i => i.isActive).length;
    const totalCount = deduplicated.length;

    return res.status(200).json({
      count: totalCount,
      activeCount,
      totalCount,
      items: deduplicated,
    });
  } catch (err) {
    console.error("USPTO proxy error:", err);
    return res.status(500).json({ error: err.message });
  }
}
