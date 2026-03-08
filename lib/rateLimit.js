// lib/rateLimit.js — In-memory rate limiter for API endpoints
// ─────────────────────────────────────────────────────────────────────────────
// Uses a sliding window counter per IP. Works on Vercel serverless (within
// a single warm instance). For multi-instance rate limiting at scale,
// replace with Vercel KV or Upstash Redis.
//
// Usage:
//   import { rateLimit } from "../../lib/rateLimit";
//   const limiter = rateLimit({ interval: 60_000, limit: 20 });
//
//   export default async function handler(req, res) {
//     const { limited, remaining } = limiter.check(req);
//     if (limited) return res.status(429).json({ error: "Too many requests" });
//     // ... handler logic
//   }
// ─────────────────────────────────────────────────────────────────────────────

const limiters = new Map();

function getClientIp(req) {
  // Vercel / Cloudflare set these headers
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function rateLimit({ interval = 60_000, limit = 30, uniqueTokenPerInterval = 5000 } = {}) {
  const tokenCache = new Map();

  // Clean up old entries every interval
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of tokenCache) {
      if (now - entry.windowStart > interval * 2) {
        tokenCache.delete(key);
      }
    }
    // Hard cap on entries to prevent memory leaks
    if (tokenCache.size > uniqueTokenPerInterval) {
      const keys = [...tokenCache.keys()];
      for (let i = 0; i < keys.length - uniqueTokenPerInterval; i++) {
        tokenCache.delete(keys[i]);
      }
    }
  }, interval);

  // Don't block process exit
  if (cleanup.unref) cleanup.unref();

  return {
    check(req) {
      const ip = getClientIp(req);
      const now = Date.now();

      let entry = tokenCache.get(ip);
      if (!entry || now - entry.windowStart > interval) {
        entry = { count: 0, windowStart: now };
        tokenCache.set(ip, entry);
      }

      entry.count++;
      const remaining = Math.max(0, limit - entry.count);
      const limited = entry.count > limit;

      return {
        limited,
        remaining,
        limit,
        ip,
        retryAfter: limited ? Math.ceil((entry.windowStart + interval - now) / 1000) : 0,
      };
    },
  };
}

// Pre-configured limiters for different endpoint types
const searchLimiter = rateLimit({ interval: 60_000, limit: 30 });    // 30 searches/min
const aiLimiter = rateLimit({ interval: 60_000, limit: 10 });        // 10 AI calls/min
const chatLimiter = rateLimit({ interval: 60_000, limit: 20 });      // 20 chat msgs/min

function applyRateLimit(req, res, limiter) {
  const { limited, remaining, limit, retryAfter } = limiter.check(req);
  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", remaining);
  if (limited) {
    res.setHeader("Retry-After", retryAfter);
    res.status(429).json({
      error: "Too many requests. Please try again later.",
      retryAfter,
    });
    return true; // blocked
  }
  return false; // allowed
}

module.exports = {
  rateLimit,
  searchLimiter,
  aiLimiter,
  chatLimiter,
  applyRateLimit,
};
