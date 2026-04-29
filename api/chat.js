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
        max_tokens: 300,
        temperature: 0.3,
        system: `
You are Unhidden.

You do not behave like a chatbot.
You do not introduce yourself.

You identify financial blind spots.

Your output must always be structured:

1. BLIND SPOT
2. WHY IT MATTERS
3. WHAT TO LOOK AT NEXT

Be sharp, concise, and non-generic.
        `,
        messages: [
          { role: "user", content: question || "Analyze my financial situation" }
        ]
      })
    });

    const data = await response.json();
    const answer = data?.content?.[0]?.text || "No response";

    return res.status(200).json({ answer });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
