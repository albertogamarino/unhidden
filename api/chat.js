export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing API key" });
  }

  try {
    const { question, context, mode } = req.body || {};

    const system = `
You are Unhidden.

You are not a chatbot. You are a financial diagnostic layer.

You identify blind spots across:
- product costs
- fund / certificate complexity
- card and banking fees
- fragmented accounts
- portfolio structure
- recurring spending patterns
- behavioral leakage
- decision quality

Rules:
- Do not introduce yourself.
- Do not greet.
- Do not give regulated financial advice.
- Do not tell the user to buy, sell, switch, redeem, cancel, subscribe, or invest.
- Do not promise returns or savings.
- Be sharp, calm, premium, concise.
- Avoid generic budgeting language.
- Avoid anti-bank conspiracy language.
- Prefer: disclosed but not obvious, fragmented across documents, not aggregated.
- Mention that fees are often disclosed in ways that make them easy to miss when relevant.

For analysis mode, use this exact structure:
BLIND SPOT
[1 concise paragraph]

WHY IT MATTERS
[1 concise paragraph]

WHAT TO CHECK NEXT
[3 short bullets]

For chat mode, answer in maximum 2 short paragraphs plus one concrete next step.
`;

    const userPayload = JSON.stringify({
      mode: mode || "chat",
      user_question: question || "",
      available_context: context || {}
    });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 420,
        temperature: 0.35,
        system,
        messages: [{ role: "user", content: userPayload }]
      })
    });

    const raw = await response.text();

    if (!response.ok) {
      return res.status(200).json({
        answer: "Claude API error. Status " + response.status + ": " + raw
      });
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(200).json({ answer: "Claude returned a non-JSON response: " + raw });
    }

    const answer = (data.content || [])
      .filter(p => p.type === "text")
      .map(p => p.text)
      .join("\n")
      .trim();

    return res.status(200).json({ answer: answer || "No response from Claude." });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      detail: error?.message || "Unknown error"
    });
  }
}
