// pages/api/analysis-agent.js
// AGENT 1: Analysis Agent - uses shared analysisCore lib

export const config = {
  maxDuration: 60,
};

import { runAnalysis } from "../../lib/analysisCore";
const { aiLimiter, applyRateLimit } = require("../../lib/rateLimit");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Rate limit: 10 AI analysis calls per minute per IP
  // Skip rate limit for internal calls (from webhook)
  const isInternal = req.headers["x-internal-call"] === process.env.STRIPE_WEBHOOK_SECRET;
  if (!isInternal && applyRateLimit(req, res, aiLimiter)) return;

  const { mark, goodsServices, classCode, useType, prefetchedConflicts } = req.body;
  if (!mark?.trim()) return res.status(400).json({ error: "mark is required" });

  try {
    const conflictCount = prefetchedConflicts?.length || 0;
    console.log(`[Agent1] Running analysis for "${mark}" | prefetched conflicts: ${conflictCount}`);
    const report = await runAnalysis(mark, goodsServices, classCode, useType, prefetchedConflicts);
    console.log(`[Agent1] Complete - Risk: ${report.scoring.overallRisk} | Conflicts: ${report.retrieval.totalFound}`);
    return res.status(200).json(report);
  } catch (err) {
    console.error("[Agent1] Fatal error:", err);
    return res.status(500).json({ error: err.message });
  }
}
