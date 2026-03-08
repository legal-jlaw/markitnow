// pages/api/trademark-search.js
// ─────────────────────────────────────────────────────────────────────────────
// Hybrid trademark search:
//   1. Supabase DB (fast, bulk data) — primary source when data is loaded
//   2. USPTO live API (real-time) — fallback, also used to supplement DB results
//
// GET /api/trademark-search?mark=strange+water
// GET /api/trademark-search?mark=nike&_debug=1
// GET /api/trademark-search?mark=nike&source=uspto  (force USPTO live API)
// ─────────────────────────────────────────────────────────────────────────────

const { searchTrademarks: dbSearch, isDatabaseReady } = require("../../lib/db");
const { searchLimiter, applyRateLimit } = require("../../lib/rateLimit");

const USPTO_API = "https://tmsearch.uspto.gov/prod-stage-v1-0-0/tmsearch";
const PAGE_SIZE = 50;

// ── In-memory cache ───────────────────────────────────────────────────────────
// Serverless instances share memory within a warm instance, cutting repeat
// calls for popular searches. TTL: 24 hours, max 500 entries.
// Cache sits on top of both Supabase DB and USPTO live API.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const searchCache  = new Map();

function cacheGet(key) {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { searchCache.delete(key); return null; }
  return entry.data;
}

function cacheSet(key, data) {
  if (searchCache.size >= 500) {
    searchCache.delete(searchCache.keys().next().value);
  }
  searchCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function resolveStatus(src) {
  const alive = src.alive;
  const desc  = (src.statusDescription || "").toLowerCase();
  if (alive) {
    if (src.registrationDate) return "Live/Registered";
    return "Live/Pending";
  } else {
    if (desc.includes("cancel"))  return "Dead/Cancelled";
    if (desc.includes("expir"))   return "Dead/Expired";
    return "Dead/Abandoned";
  }
}

function normalizeItem(src) {
  const drawingCode = src.drawingCode || 4;
  if (drawingCode === 2) return null;

  const markTypeLabel = drawingCode === 4 ? "Standard Character" :
                        drawingCode === 1 ? "Typeset" :
                        drawingCode === 3 ? "Design + Words" :
                        drawingCode === 5 ? "Stylized" : "Wordmark";

  const status = resolveStatus(src);
  const gs     = Array.isArray(src.goodsAndServices)
    ? src.goodsAndServices.join("; ")
    : (src.goodsAndServices || "");
  const classes = Array.isArray(src.internationalClass)
    ? src.internationalClass.map(c => c.replace(/^IC\s*/i, "")).join(", ")
    : (src.internationalClass || "");
  const owner = (Array.isArray(src.ownerName) ? src.ownerName[0] : src.ownerName)
             || (Array.isArray(src.ownerFullText) ? src.ownerFullText[0] : src.ownerFullText)
             || "Unknown";

  return {
    markName:         src.wordmark || "",
    serialNumber:     src.id || "",
    owner,
    status,
    filingDate:       (src.filedDate || "").split("T")[0],
    registrationDate: (src.registrationDate || "").split("T")[0],
    classCode:        classes,
    description:      gs,
    isActive:         status.toLowerCase().startsWith("live"),
    markType:         markTypeLabel,
    drawingCode,
  };
}

const USPTO_HEADERS = {
  "Content-Type": "application/json",
  "Accept":       "application/json",
  "User-Agent":   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Origin":       "https://tmsearch.uspto.gov",
  "Referer":      "https://tmsearch.uspto.gov/search/search-results",
};

async function queryUSPTO(esQuery) {
  const res  = await fetch(USPTO_API, { method: "POST", headers: USPTO_HEADERS, body: JSON.stringify(esQuery) });
  const data = await res.json();
  const hits = data?.hits?.hits || [];
  return hits.map(h => normalizeItem(h.source || {})).filter(Boolean);
}

// Sound-alike variant generator (USPTO TMEP § 1207.01(b)(i))
function phoneticVariants(word) {
  const w = word.toLowerCase();
  const variants = new Set();
  const rules = [
    [/ph/g, "f"],    [/f/g, "ph"],
    [/ck/g, "k"],    [/k/g, "ck"],
    [/qu/g, "kw"],   [/kw/g, "qu"],
    [/x/g, "ks"],    [/ks/g, "x"],
    [/z/g, "s"],     [/s/g, "z"],
    [/ight/g, "ite"],[/ite/g, "ight"],
    [/oo/g, "u"],    [/u/g, "oo"],
    [/ie/g, "y"],    [/y/g, "ie"],
    [/ea/g, "ee"],   [/ee/g, "ea"],
    [/tion/g, "shun"],
    [/c(?=[ei])/g, "s"],
    [/c(?=[^ei])/g, "k"],
  ];
  for (const [pattern, replacement] of rules) {
    const v = w.replace(pattern, replacement);
    if (v !== w && v.length > 2) variants.add(v);
  }
  const words = w.split(/\s+/);
  if (words.length > 1) {
    for (const wd of words) {
      for (const [pattern, replacement] of rules) {
        const v = wd.replace(pattern, replacement);
        if (v !== wd && v.length > 2) variants.add(v);
      }
    }
  }
  return [...variants].slice(0, 4);
}

// Normalize a Supabase DB row (from search_trademarks_ranked) to match USPTO API shape
function normalizeDbRow(row) {
  const statusLabel = (row.status_label || "").toLowerCase();
  const status = row.is_active
    ? (row.registration_date ? "Live/Registered" : "Live/Pending")
    : statusLabel.includes("cancel") ? "Dead/Cancelled"
    : statusLabel.includes("expir") ? "Dead/Expired"
    : "Dead/Abandoned";

  return {
    markName:         row.mark_identification || "",
    serialNumber:     row.serial_number || "",
    owner:            row.owner_name || "Unknown",
    status,
    filingDate:       row.filing_date ? String(row.filing_date).split("T")[0] : "",
    registrationDate: row.registration_date ? String(row.registration_date).split("T")[0] : "",
    classCode:        row.class_codes || "",
    description:      row.description || "",
    isActive:         !!row.is_active,
    markType:         "Standard Character",
    drawingCode:      4,
    source:           "db",
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Rate limit: 30 searches per minute per IP
  if (applyRateLimit(req, res, searchLimiter)) return;

  const mark = req.query.mark?.trim();
  if (!mark) return res.status(400).json({ error: "mark param required" });

  const trimmed    = mark;
  const firstWord  = trimmed.split(/\s+/)[0];
  const isMultiWord = firstWord.toLowerCase() !== trimmed.toLowerCase();
  const cacheKey   = trimmed.toLowerCase();
  const forceUSPTO = req.query.source === "uspto";

  // ── Debug mode ──────────────────────────────────────────────────────────────
  if (req.query._debug) {
    try {
      const raw = await fetch(USPTO_API, {
        method: "POST", headers: USPTO_HEADERS,
        body: JSON.stringify({ query: { match_phrase: { wordmark: trimmed } }, from: 0, size: 1 }),
      });
      const data = await raw.json();
      return res.status(200).json({ raw: data?.hits?.hits?.[0]?.source || null });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── Cache hit ───────────────────────────────────────────────────────────────
  const cached = cacheGet(cacheKey);
  if (cached) {
    res.setHeader("X-Cache", "HIT");
    return res.status(200).json(cached);
  }

  // ── Try Supabase DB first (if data is loaded and not forcing USPTO) ────────
  if (!forceUSPTO) {
    try {
      const dbReady = await isDatabaseReady();
      if (dbReady) {
        const dbRows = await dbSearch(trimmed, { status: "all", limit: 200 });
        if (dbRows && dbRows.length > 0) {
          const items = dbRows.map(normalizeDbRow).filter(Boolean);
          items.sort((a, b) => {
            if (a.isActive && !b.isActive) return -1;
            if (!a.isActive && b.isActive) return  1;
            return (b.filingDate || "").localeCompare(a.filingDate || "");
          });

          const activeCount = items.filter(i => i.isActive).length;
          const payload = {
            mark:        trimmed,
            totalFound:  items.length,
            activeCount,
            items,
            source:      "database",
            cachedAt:    new Date().toISOString(),
          };

          cacheSet(cacheKey, payload);
          res.setHeader("X-Cache", "MISS");
          res.setHeader("X-Source", "supabase");
          return res.status(200).json(payload);
        }
      }
    } catch (dbErr) {
      // DB failed — fall through to USPTO live API
      console.warn("DB search failed, falling back to USPTO:", dbErr.message);
    }
  }

  // ── Fallback: USPTO live API ───────────────────────────────────────────────
  const phonetics = phoneticVariants(trimmed);

  try {
    const queries = [
      // 1. Exact phrase
      queryUSPTO({ query: { match_phrase: { wordmark: trimmed } }, from: 0, size: PAGE_SIZE }),
      // 2. Token-level query_string
      queryUSPTO({ query: { query_string: { query: trimmed, default_field: "wordmark" } }, from: 0, size: PAGE_SIZE }),
      // 3. Wildcard prefix (catches "MAYAN WARRIOR GALAXYER")
      queryUSPTO({ query: { query_string: { query: `${trimmed}*`, default_field: "wordmark" } }, from: 0, size: 25 }),
      // 4. Fuzzy edit-distance (catches PHAZE, stylized variants)
      queryUSPTO({ query: { match: { wordmark: { query: trimmed, fuzziness: "AUTO", prefix_length: 1 } } }, from: 0, size: 25 }),
    ];

    if (isMultiWord && firstWord.length > 2) {
      queries.push(queryUSPTO({ query: { match_phrase: { wordmark: firstWord } }, from: 0, size: 25 }));
      queries.push(queryUSPTO({ query: { match: { wordmark: { query: firstWord, fuzziness: "AUTO", prefix_length: 1 } } }, from: 0, size: 15 }));
    }

    // 5. Phonetic sound-alike variants (NITE→NIGHT, KOOL→COOL, etc.)
    for (const variant of phonetics) {
      queries.push(queryUSPTO({ query: { match: { wordmark: { query: variant, fuzziness: "1", prefix_length: 1 } } }, from: 0, size: 15 }));
    }

    const results  = await Promise.allSettled(queries);
    const allItems = results.flatMap(r => r.status === "fulfilled" ? r.value : []);

    const seen = new Map();
    for (const item of allItems) {
      const key = item.serialNumber || `${item.markName}__${item.owner}`;
      if (!seen.has(key)) seen.set(key, item);
    }

    const deduplicated = [...seen.values()];
    deduplicated.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return  1;
      return (b.filingDate || "").localeCompare(a.filingDate || "");
    });

    const activeCount = deduplicated.filter(i => i.isActive).length;

    const payload = {
      mark:        trimmed,
      totalFound:  deduplicated.length,
      activeCount,
      items:       deduplicated,
      source:      "uspto_live",
      cachedAt:    new Date().toISOString(),
    };

    cacheSet(cacheKey, payload);
    res.setHeader("X-Cache", "MISS");
    res.setHeader("X-Source", "uspto");

    return res.status(200).json(payload);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
