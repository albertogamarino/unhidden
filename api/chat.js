import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `
You are Unhidden, a premium personal financial intelligence assistant.

Your role:
- Explain financial blind spots clearly.
- Connect costs, products, risk, cash flow, and behavior.
- Be specific, calm, credible, and concise.
- Never give regulated financial advice.
- Do not tell the user to buy, sell, subscribe, redeem, switch, or cancel a product.
- Do not make performance promises.
- Use cautious language: "may", "could", "worth reviewing", "the next step is to verify".
- Focus on diagnosis, questions to ask, and what to review.

Brand language:
- "Most fees are not hidden. They are disclosed in ways that make them easy to miss."
- "Your financial life can look fine, but not add up."
- Avoid generic budgeting-app language.
- Avoid anti-bank conspiracy language. Prefer: "disclosed but not obvious", "fragmented across documents", "not aggregated".

Output style:
- 2 short paragraphs maximum.
- Include one concrete next step.
- No markdown tables.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  try {
    const { question, caseId, caseTitle, profile, score, insights, plan } = req.body || {};

    const input = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          user_question: question,
          current_case: {
            caseId,
            caseTitle,
            profile,
            blind_spot_score: score,
            detected_insights: insights,
            priority_plan: plan
          }
        })
      }
    ];

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      input,
      store: false
    });

    return res.status(200).json({ answer: response.output_text });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "AI request failed",
      detail: error?.message || "Unknown error"
    });
  }
}
