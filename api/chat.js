export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Missing Claude API key",
      detail: "Set ANTHROPIC_API_KEY or CLAUDE_API_KEY in Vercel Environment Variables."
    });
  }

  try {
    const { question, caseId, caseTitle, profile, score, insights, plan } = req.body || {};

    const system = `You are Unhidden, a premium personal financial intelligence assistant.
Explain financial blind spots clearly. Connect costs, products, risk, cash flow, and behavior.
Never give regulated financial advice. Do not tell the user to buy, sell, subscribe, redeem, switch, or cancel a product.
Use cautious language: may, could, worth reviewing, the next step is to verify.
Be specific, calm, credible, concise. Maximum 2 short paragraphs.
Brand language: Most fees are not hidden. They are disclosed in ways that make them easy to miss.
Avoid anti-bank conspiracy language. Prefer: disclosed but not obvious, fragmented across documents, not aggregated.`;

    const userContent = JSON.stringify({
      user_question: question,
      current_case: { caseId, caseTitle, profile, blind_spot_score: score, detected_insights: insights, priority_plan: plan }
    });

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest",
        max_tokens: 350,
        temperature: 0.4,
        system,
        messages: [{ role: "user", content: userContent }]
      })
    });

    if (!anthropicRes.ok) {
      const detail = await anthropicRes.text();
      return res.status(anthropicRes.status).json({ error: "Claude request failed", detail });
    }

    const data = await anthropicRes.json();
    const answer = (data.content || []).filter(p => p.type === "text").map(p => p.text).join("\n").trim();
    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({ error: "AI request failed", detail: error?.message || "Unknown error" });
  }
}
