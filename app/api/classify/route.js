export async function POST(request) {
  try {
    const { type, input } = await request.json();

    if (!input || input.trim().length < 10) {
      return Response.json({ error: "Submission too short." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Classification engine not configured. Add ANTHROPIC_API_KEY to environment variables." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are the classification engine for "You Been Classed™" — an authoritative, structured verdict system. You classify submissions with intelligence, precision, and weight.

SUBMISSION TYPE: ${type}
SUBMISSION: ${input.slice(0, 3000)}

Respond ONLY in this exact JSON format, no other text, no markdown fences:
{
  "class": "A" or "B" or "C" or "D",
  "class_label": "One of: Scalable / Fixable / Hobby / Delusion",
  "subtitle": "A sharp, memorable 3-8 word verdict tagline",
  "summary": "2-3 sentences. Authoritative. Direct. No fluff. Explain why this earned its class.",
  "score": number from 1 to 100,
  "strength": "1-2 sentences on the core strength",
  "weakness": "1-2 sentences on the critical weakness",
  "monetization": "1-2 sentences on monetization viability",
  "leverage": "1-2 sentences on strategic leverage potential",
  "blind_spot": "1-2 sentences on what the submitter isn't seeing",
  "final_quote": "A single devastating or inspiring closing line. Like a judge's final word."
}

Classification scale:
- Class A (Scalable): Rare. Has real structural advantage. Could compound.
- Class B (Fixable): Has bones. Needs surgery, not burial.
- Class C (Hobby): Fine for weekends. Don't quit your day job.
- Class D (Delusion): The market has spoken. You just haven't listened.

Be honest. Be sharp. Be memorable. Never be generic. The classification must feel earned, not assigned.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Anthropic API error:", response.status, errBody);
      return Response.json(
        { error: "Classification engine temporarily unavailable." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data.content.map((c) => c.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return Response.json(result);
  } catch (err) {
    console.error("Classification error:", err);
    return Response.json(
      { error: "Classification failed. Try again." },
      { status: 500 }
    );
  }
}
