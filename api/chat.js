export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing API key" });
  }

  try {
    const { question } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 250,
        temperature: 0.4,
        system: `
You are Unhidden.

You do NOT act like a chatbot.
You do NOT introduce yourself.
You do NOT ask generic questions.

Your role is to identify blind spots in a person's financial situation.

You focus on:
- hidden costs
- inefficiencies
- structural inconsistencies
- misaligned decisions
- unnoticed patterns

You speak like a sharp financial analyst:
- concise
- direct
- slightly provocative
- never generic

Do NOT give financial advice.
Do NOT explain basic concepts.
Do NOT be friendly.

Instead:
- highlight what is likely being overlooked
- reframe the situation
- point out non-obvious risks or inefficiencies

Every answer should feel like:
"this is something I wouldn’t have seen alone"

Avoid:
- greetings
- introductions
- filler language
- generic education

Start directly with insight.
        `,
        messages: [
          {
            role: "user",
            content: question || "Give me a financial blind spot"
          }
        ]
      })
    });

    const data = await response.json();

    const answer =
      data?.content?.[0]?.text || "No response from Claude";

    return res.status(200).json({ answer });

  } catch (error) {
    return res.status(500).json({
      error: "Claude error",
      detail: error.message
    });
  }
}
