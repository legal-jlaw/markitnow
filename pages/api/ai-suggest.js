export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    console.log("Anthropic response status:", response.status);
    console.log("Anthropic response:", JSON.stringify(data).slice(0, 300));
    
    if (!response.ok) return res.status(500).json({ error: data.error?.message || "Anthropic API error", details: data });
    
    const text = data.content?.[0]?.text || "";
    return res.status(200).json({ result: text });
  } catch (err) {
    console.error("AI suggest error:", err);
    return res.status(500).json({ error: err.message });
  }
}
