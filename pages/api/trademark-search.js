// pages/api/trademark-search.js
// ─────────────────────────────────────────────────────────────────────────────
// USPTO trademark search via Marker API (markerapi.com)
// Free tier: 1,000 searches/month. No quota issues.
// Returns: mark name, serial, owner, status, filing date, class, goods/services
//
// Requires env vars: MARKER_USERNAME, MARKER_PASSWORD
//
// GET /api/trademark-search?mark=strange+water
// GET /api/trademark-search?mark=nike&_debug=1
// ─────────────────────────────────────────────────────────────────────────────

const MARKER_BASE = "https://dev.markerapi.com/api/v2/trademarks";

function resolveStatus(item) {
  const code = String(item.statuscode || "");
  const desc = (item.statusdescription || "").toLowerCase();
  const s = (item.status || "").toLowerCase();

  if (s.includes("registered") || code === "1" || desc.includes("registered")) return "Live/Registered";
  if (s.includes("pending") || code === "3" || desc.includes("pending"))       return "Live/Pending";
  if (s.includes("abandon") || desc.includes("abandon"))                        return "Dead/Abandoned";
  if (s.includes("cancel") || desc.includes("cancel"))                          return "Dead/Cancelled";
  if (s.includes("expir") || desc.includes("expir"))                            return "Dead/Expired";
  if (s.includes("dead") || code === "2")                                       return "Dead/Abandoned";
  if (s.includes("live"))                                                        return "Live/Registered";
  return item.status || "Unknown";
}

function normalizeItem(t) {
  const statusLabel = resolveStatus(t);
  const isActive = statusLabel.toLowerCase().startsWith("live");
  return {
    markName:         t.wordmark || t.trademark || "",
    serialNumber:     t.serialnumber || "",
    owner:            t.owner || "Unknown",
    status:           statusLabel,
    filingDate:       t.filingdate || "",
    registrationDate: t.registrationdate || "",
    classCode:        t.code || "",
    description:      t.description || "",
    isActive,
  };
}

async function queryMarker(keyword, status, username, password) {
  const encoded = encodeURIComponent(keyword.trim());
  const url = `${MARKER_BASE}/trademark/${encoded}/status/${status}/start/0/username/${username}/password/${password}`;
  try {
    const res = await fetch(url);
    if (!res.ok) { console.error(`[Marker] HTTP ${res.status}`); return []; }
    const data = await res.json();
    if (data.error) { console.error(`[Marker] error: ${data.error}`); return []; }
    return (data.trademarks || []).map(normalizeItem);
  } catch (err) {
    console.error(`[Marker] fetch error: ${err.message}`);
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { mark } = req.query;
  if (!mark?.trim()) return res.status(400).json({ error: "mark parameter required" });

  const username = process.env.MARKER_USERNAME;
  const password = process.env.MARKER_PASSWORD;
  if (!username || !password) return res.status(500).json({ error: "MARKER_USERNAME / MARKER_PASSWORD not configured" });

  const trimmed = mark.trim();
  const firstWord = trimmed.split(/\s+/)[0];

  // Debug mode
  if (req.query._debug) {
    const encoded = encodeURIComponent(trimmed);
    const url = `${MARKER_BASE}/trademark/${encoded}/status/all/start/0/username/${username}/password/${password}`;
    try {
      const r = await fetch(url);
      const raw = await r.json();
      const first = raw.trademarks?.[0];
      return res.status(200).json({ rawStatus: r.status, rawCount: raw.count, rawError: raw.error || null, rawFirstItem: first, rawKeys: Object.keys(first || {}) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  try {
    const queries = [queryMarker(trimmed, "all", username, password)];
    if (firstWord.length > 2 && firstWord.toLowerCase() !== trimmed.toLowerCase()) {
      queries.push(queryMarker(firstWord, "all", username, password));
    }

    const results = await Promise.allSettled(queries);
    const allItems = results.flatMap(r => r.status === "fulfilled" ? r.value : []);

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

    const activeCount = deduplicated.filter(i => i.isActive).length;
    const totalCount = deduplicated.length;

    return res.status(200).json({ count: totalCount, activeCount, totalCount, items: deduplicated });
  } catch (err) {
    console.error("Trademark search error:", err);
    return res.status(500).json({ error: err.message });
  }
}
