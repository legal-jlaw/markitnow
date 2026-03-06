// pages/api/trademark-search.js
// ─────────────────────────────────────────────────────────────────────────────
// USPTO trademark search via USPTO's own internal OpenSearch API
// The same endpoint that powers tmsearch.uspto.gov
// FREE - no API key, no quota, no third-party dependency
//
// POST https://tmsearch.uspto.gov/prod-stage-v1-0-0/tmsearch
// OpenSearch query_string syntax
//
// GET /api/trademark-search?mark=strange+water
// GET /api/trademark-search?mark=nike&_debug=1
// ─────────────────────────────────────────────────────────────────────────────

const USPTO_API = "https://tmsearch.uspto.gov/prod-stage-v1-0-0/tmsearch";
const PAGE_SIZE = 50;

// ── In-memory cache ───────────────────────────────────────────────────────────
// Serverless instances share memory within a warm instance, cutting repeat
// USPTO calls for popular searches. TTL: 24 hours, max 500 entries.
//
// ARCHITECTURE NOTE: When Flavia's Supabase bulk pipeline is ready, replace
// the queryUSPTO() calls below with Supabase queries. Keep this cache on top
// of that too. USPTO live API becomes fallback for marks filed in last 7 days.
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const mark = req.query.mark?.trim();
  if (!mark) return res.status(400).json({ error: "mark param required" });

  const trimmed    = mark;
  const firstWord  = trimmed.split(/\s+/)[0];
  const isMultiWord = firstWord.toLowerCase() !== trimmed.toLowerCase();
  const cacheKey   = trimmed.toLowerCase();

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
      cachedAt:    new Date().toISOString(),
    };

    // ── Cache miss — store result ──────────────────────────────────────────────
    cacheSet(cacheKey, payload);
    res.setHeader("X-Cache", "MISS");

    return res.status(200).json(payload);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
