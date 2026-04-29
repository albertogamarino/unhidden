export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      endpoint: "/api/chat",
      method: "GET",
      apiKeyDetected: Boolean(apiKey),
      message: apiKey
        ? "API key is detected by Vercel. Use POST from demo.html to test Claude."
        : "API key is NOT detected. Check Vercel Environment Variables and redeploy."
    });
  }

  if (req.method !== "POST") {
    return res.status(200).json({
      answer: "API endpoint reached, but this method is not supported. Use POST from the demo chat."
    });
  }

  if (!apiKey) {
    return res.status(200).json({
      answer: "Debug: Vercel is NOT reading ANTHROPIC_API_KEY or CLAUDE_API_KEY. Check Environment Variables, make sure it is added to Production, then redeploy."
    });
  }

  try {
    const body = req.body || {};
    const question = body.question || "Give me one concise Unhidden-style financial insight.";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-3-haiku-20240307",
        max_tokens: 220,
        temperature: 0.3,
        system: "You are Unhidden, a concise financial diagnostic assistant. Do not give regulated financial advice. Explain blind spots calmly and clearly.",
        messages: [
          {
            role: "user",
            content: question
          }
        ]
      })
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(200).json({
        answer:
          "Debug: Claude API was reached but returned an error. " +
          "Status " + response.status + ". Details: " + text
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return res.status(200).json({
        answer: "Debug: Claude responded, but JSON parsing failed. Raw response: " + text
      });
    }

    const answer =
      data?.content?.[0]?.text ||
      "Debug: Claude responded but no text was found in content[0]. Raw response: " + JSON.stringify(data);

    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(200).json({
      answer: "Debug: server error inside /api/chat. " + (error?.message || "Unknown error")
    });
  }
}
