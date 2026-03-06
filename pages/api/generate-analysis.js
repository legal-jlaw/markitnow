// pages/api/generate-analysis.js
// Server-side proxy for search page AI analysis
// Keeps API key server-side, never exposed to browser

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { systemPrompt, userPrompt } = req.body;
  if (!userPrompt) return res.status(400).json({ error: "userPrompt required" });

  const anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_KEY;
  if (!anthropicKey) return res.status(500).json({ error: "ANTHROPIC_KEY not configured" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPrompt || "",
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.content?.find(b => b.type === "text")?.text || "{}";
    const result = JSON.parse(text.replace(/```json|```/g, "").trim());

    return res.status(200).json({ result });
  } catch (err) {
    console.error("[generate-analysis] error:", err);
    return res.status(500).json({ error: err.message });
  }
}
