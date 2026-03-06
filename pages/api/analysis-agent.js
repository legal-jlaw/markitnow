// pages/api/analysis-agent.js
// AGENT 1: Analysis Agent - uses shared analysisCore lib

import { runAnalysis } from "../../lib/analysisCore";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { mark, goodsServices, classCode, useType } = req.body;
  if (!mark?.trim()) return res.status(400).json({ error: "mark is required" });

  try {
    console.log(`[Agent1] Running analysis for "${mark}"`);
    const report = await runAnalysis(mark, goodsServices, classCode, useType);
    console.log(`[Agent1] Complete - Risk: ${report.scoring.overallRisk} | Conflicts: ${report.retrieval.totalFound}`);
    return res.status(200).json(report);
  } catch (err) {
    console.error("[Agent1] Fatal error:", err);
    return res.status(500).json({ error: err.message });
  }
}
