export async function POST(request) {
  try {
    let payload;
    try { payload = await request.json(); }
    catch { return Response.json({ error: "Send a valid JSON request." }, { status: 400 }); }
    const prompt = payload?.prompt;

    if (typeof prompt !== 'string' || prompt.trim().length < 3) {
      return Response.json({ error: "Give us something to work with." }, { status: 400 });
    }

    if (prompt.length > 1000) {
      return Response.json({ error: "Keep the roast under 1,000 characters." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "AI sharpening is not connected yet. You can still post your own roast." }, { status: 503 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      signal: AbortSignal.timeout(15000),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 150,
        messages: [
          {
            role: "user",
            content: `You are a professional roast writer for "The Class Board" — a competitive social roasting game. Your job is to take a roast and make it sharper, funnier, and more devastating in under 30 words.

Rules:
- Keep it punchy and under 30 words
- Make every word earn its place
- No profanity, keep it PG-13
- Should sting without being mean-spirited
- Witty > mean-spirited
- Return ONLY the roast text, no quotes, no explanation

Input roast to sharpen:
"${prompt.trim()}"

Return ONLY the sharpened roast (no quotes, no explanation).`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return Response.json({ error: "Roast engine temporarily down. Try again." }, { status: 502 });
    }

    const data = await response.json();
    const roast = data.content?.[0]?.text?.trim() || "";

    return Response.json({ roast });
  } catch (err) {
    console.error("Roast error:", err);
    return Response.json({ error: "Failed to generate roast." }, { status: 500 });
  }
}
