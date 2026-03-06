// pages/api/trademark-search.js
// ─────────────────────────────────────────────────────────────────────────────
// USPTO trademark search — uses local Postgres database when available,
// falls back to RapidAPI proxy if the database isn't populated yet.
//
// GET /api/trademark-search?mark=strange+water
// GET /api/trademark-search?mark=strange+water&status=active
// GET /api/trademark-search?mark=strange+water&class=025
// GET /api/trademark-search?mark=strange+water&limit=50&offset=0
// ─────────────────────────────────────────────────────────────────────────────

import { searchTrademarks, countTrademarks, isDatabaseReady } from "../../lib/db";

// ── RapidAPI fallback (kept for when DB is empty) ──────────────────────────

const RAPIDAPI_HOST = "uspto-trademark.p.rapidapi.com";

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

async function searchViaRapidAPI(mark, apiKey) {
  const trimmed = mark.trim();
  const firstWord = trimmed.split(/\s+/)[0];

  const queries = [
    queryRapidAPI(trimmed, "all", apiKey),
    queryRapidAPI(trimmed, "active", apiKey),
  ];
  if (firstWord.length > 2 && firstWord.toLowerCase() !== trimmed.toLowerCase()) {
    queries.push(queryRapidAPI(firstWord, "active", apiKey));
  }

  const results = await Promise.allSettled(queries);
  const allItems = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

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

  const activeCount = deduplicated.filter((i) => i.isActive).length;
  return {
    count: deduplicated.length,
    activeCount,
    totalCount: deduplicated.length,
    items: deduplicated,
    source: "rapidapi",
  };
}

// ── Database search (primary when populated) ───────────────────────────────

async function searchViaDatabase(mark, { status = "all", classCode = null, limit = 200, offset = 0 } = {}) {
  const [rows, counts] = await Promise.all([
    searchTrademarks(mark, { status, classCode, limit, offset }),
    countTrademarks(mark, { status, classCode }),
  ]);

  const items = rows.map((r) => ({
    markName: r.mark_identification || "",
    serialNumber: r.serial_number || "",
    owner: r.owner_name || "Unknown",
    status: r.status_label || "",
    filingDate: r.filing_date ? r.filing_date.toISOString().slice(0, 10) : "",
    registrationDate: r.registration_date ? r.registration_date.toISOString().slice(0, 10) : "",
    classCode: r.class_codes || "",
    description: r.description || "",
    isActive: r.is_active || false,
    similarityScore: r.similarity_score || 0,
  }));

  return {
    count: items.length,
    activeCount: counts.activeCount,
    totalCount: counts.total,
    items,
    source: "database",
  };
}

// ── Handler ────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { mark, status = "all", class: classCode, limit = "200", offset = "0" } = req.query;
  if (!mark?.trim()) return res.status(400).json({ error: "mark parameter required" });

  try {
    // Try database first
    const dbReady = await isDatabaseReady();

    if (dbReady) {
      const result = await searchViaDatabase(mark.trim(), {
        status,
        classCode: classCode || null,
        limit: Math.min(parseInt(limit) || 200, 1000),
        offset: parseInt(offset) || 0,
      });
      return res.status(200).json(result);
    }

    // Fallback to RapidAPI
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "No search backend available. Set DATABASE_URL or RAPIDAPI_KEY in .env.local",
      });
    }

    const result = await searchViaRapidAPI(mark.trim(), apiKey);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Trademark search error:", err);
    return res.status(500).json({ error: err.message });
  }
}
