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
        model: "claude-3-haiku-20240307",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: question || "Give me a financial insight"
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
