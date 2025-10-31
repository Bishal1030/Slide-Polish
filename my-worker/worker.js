export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors })
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...cors },
      })
    }

    try {
      const { text, tone } = await request.json()
      if (!text || !tone) {
        return new Response(JSON.stringify({ error: "Missing text or tone" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...cors },
        })
      }

      const toneDescriptions = {
        precise: "concise and precise, removing any fluff or unnecessary words",
        professional: "professional and formal, suitable for business communication",
        executive: "executive-level summary with high-level insights only",
        friendly: "friendly and approachable, using a conversational tone",
      }

      const prompt = `You are a professional slide content editor. Your task is to rewrite the following text in a ${toneDescriptions[tone]} manner.

Original text: "${text}"

Generate exactly 3 different rewrite options. Each option should:
- Be distinct from the others
- Maintain the core message and meaning
- Be suitable for slide presentations
- Be concise (1-2 sentences max)

Return ONLY valid JSON with no markdown, no code blocks, and no extra text:
{
  "rewrites": [
    {"text": "rewrite option 1"},
    {"text": "rewrite option 2"},
    {"text": "rewrite option 3"}
  ]
}`

      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 600,
        }),
      })

      if (!aiRes.ok) {
        const err = await aiRes.json().catch(() => ({}))
        const msg = err?.error?.message || "OpenAI API error"
        return new Response(JSON.stringify({ error: msg }), {
          status: aiRes.status,
          headers: { "Content-Type": "application/json", ...cors },
        })
      }

      const data = await aiRes.json()
      const content = data?.choices?.[0]?.message?.content || ""
      const match = content.match(/\{[\s\S]*\}/)
      if (!match) {
        return new Response(JSON.stringify({ error: "Invalid response format from API" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...cors },
        })
      }
      const parsed = JSON.parse(match[0])
      return new Response(JSON.stringify({ rewrites: parsed.rewrites || [] }), {
        headers: { "Content-Type": "application/json", ...cors },
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...cors },
      })
    }
  },
}


