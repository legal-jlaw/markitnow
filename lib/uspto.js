// lib/uspto.js
// Client-side helper that calls our Next.js API proxy
// No API keys in the browser — all auth happens server-side

export async function searchTrademarks(mark, status = "active") {
  const res = await fetch(
    `/api/trademark-search?mark=${encodeURIComponent(mark)}&status=${status}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Search failed: ${res.status}`);
  }
  return res.json(); // { count, items: [...] }
}

export async function checkAvailability(mark) {
  const res = await fetch(
    `/api/trademark-search?mark=${encodeURIComponent(mark)}&status=active`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return {
    available: data.count === 0,
    conflictCount: data.count || 0,
    topConflicts: (data.items || []).slice(0, 5),
  };
}
