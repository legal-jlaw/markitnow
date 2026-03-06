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
  // Drawing codes: 1=Typeset, 2=Design only, 3=Design+Words, 4=Standard Char, 5=Stylized, 6=No drawing
  // Filter out pure design marks (code 2) — no wordmark to conflict with
  const drawingCode = src.drawingCode || 4;
  if (drawingCode === 2) return null;

  const statusLabel = resolveStatus(src);
  const isActive    = statusLabel.startsWith("Live");

  const gsArr  = src.goodsAndServices || [];
  const desc   = gsArr.join("; ");

  const classes = (src.internationalClass || [])
    .map(c => c.replace(/^IC\s*/i, "").trim())
    .join(", ");

  const owner = (src.ownerName || [])[0] || src.ownerFullText?.[0] || "Unknown";

  const markTypeLabel = drawingCode === 4 ? "Standard Character" :
                        drawingCode === 1 ? "Typeset" :
                        drawingCode === 3 ? "Design + Words" :
                        drawingCode === 5 ? "Stylized" : "Wordmark";

  return {
    markName:         src.wordmark || "",
    serialNumber:     String(src.id || ""),
    owner:            owner,
    status:           statusLabel,
    filingDate:       src.filedDate ? src.filedDate.split("T")[0] : "",
    registrationDate: src.registrationDate ? src.registrationDate.split("T")[0] : "",
    classCode:        classes,
    description:      desc,
    markType:         markTypeLabel,
    drawingCode,
    isActive,
  };
}

async function queryUSPTO(esQuery) {
  try {
    const res = await fetch(USPTO_API, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Origin": "https://tmsearch.uspto.gov",
        "Referer": "https://tmsearch.uspto.gov/search/search-results",
      },
      body:    JSON.stringify(esQuery),
    });

    if (!res.ok) {
      console.error(`[USPTO] HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (data.error) {
      console.error(`[USPTO] error: ${data.error}`);
      return [];
    }

    const hits = data.hits?.hits || [];
    return hits.map(h => normalizeItem(h.source || {})).filter(Boolean);
  } catch (err) {
    console.error(`[USPTO] fetch error: ${err.message}`);
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")    return res.status(405).json({ error: "Method not allowed" });

  const { mark } = req.query;
  if (!mark?.trim()) return res.status(400).json({ error: "mark parameter required" });

  const trimmed   = mark.trim();
  const firstWord = trimmed.split(/\s+/)[0];
  const isMultiWord = firstWord.toLowerCase() !== trimmed.toLowerCase();

  if (req.query._debug) {
    try {
      const USPTO_HEADERS = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Origin": "https://tmsearch.uspto.gov",
        "Referer": "https://tmsearch.uspto.gov/search/search-results",
      };
      const r = await fetch(USPTO_API, {
        method:  "POST",
        headers: USPTO_HEADERS,
        body:    JSON.stringify({
          query: { query_string: { query: trimmed, default_field: "wordmark" } },
          from:  0,
          size:  1,
        }),
      });
      const raw = await r.json();
      const first = raw.hits?.hits?.[0]?.source || {};
      return res.status(200).json({
        usptoStatus: r.status,
        totalHits:   raw.hits?.totalValue,
        rawKeys:     Object.keys(first),
        rawFirstItem: first,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  try {
    const queries = [
      queryUSPTO({
        query: { match_phrase: { wordmark: trimmed } },
        from:  0,
        size:  PAGE_SIZE,
      }),
      queryUSPTO({
        query: { query_string: { query: trimmed, default_field: "wordmark" } },
        from:  0,
        size:  PAGE_SIZE,
      }),
    ];

    if (isMultiWord && firstWord.length > 2) {
      queries.push(
        queryUSPTO({
          query: { match_phrase: { wordmark: firstWord } },
          from:  0,
          size:  PAGE_SIZE,
        })
      );
    }

    const results   = await Promise.allSettled(queries);
    const allItems  = results.flatMap(r => r.status === "fulfilled" ? r.value : []);

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

    return res.status(200).json({
      count:      deduplicated.length,
      activeCount,
      totalCount: deduplicated.length,
      items:      deduplicated,
    });

  } catch (err) {
    console.error("Trademark search error:", err);
    return res.status(500).json({ error: err.message });
  }
}
