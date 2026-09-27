// AI tutor. Streams OpenAI-format SSE from Gemini's free tier.
// Secret: GEMINI_API_KEY (free at https://aistudio.google.com/apikey).
// JWT verification is on (default), so only signed-in sessions (guests included) reach this
// code, and every message spends one unit of the caller's hourly quota in Postgres.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

type Msg = { role: "user" | "assistant"; content: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Use POST" });

  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return json(503, { error: "The AI tutor isn't configured on this deployment." });

  let body: { messages?: unknown; context?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }
  if (!Array.isArray(body?.messages)) return json(400, { error: "messages must be an array" });

  // Per-user quota, enforced by the database with the caller's own JWT.
  const quota = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/consume_ai_quota`, {
    method: "POST",
    headers: {
      Authorization: req.headers.get("Authorization") ?? "",
      apikey: req.headers.get("apikey") ?? "",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (quota.status === 429) return json(429, { error: "You've hit the tutor's hourly limit. Try again later." });
  if (!quota.ok) return json(401, { error: "Sign in to use the tutor." });

  // Keep requests small: last 12 turns, 2k chars each.
  const messages = (body.messages as Msg[])
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!messages.length) return json(400, { error: "No messages" });

  const system = [
    "You are the tutor inside SkillVerse, a learning app where skills are stars in a galaxy.",
    "Explain concepts clearly and briefly, use small code examples, and nudge learners to try things themselves.",
    "Never just hand over the answer to a quiz or challenge; give a hint first.",
    typeof body.context === "string" ? `Learner context: ${body.context.slice(0, 500)}` : "",
  ].join(" ");

  const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash",
      messages: [{ role: "system", content: system }, ...messages],
      stream: true,
    }),
  });

  if (upstream.status === 429) return json(429, { error: "The tutor is getting a lot of questions. Try again in a minute." });
  if (!upstream.ok || !upstream.body) {
    console.error("gemini error", upstream.status, await upstream.text());
    return json(502, { error: "The AI tutor is unavailable right now." });
  }

  return new Response(upstream.body, { headers: { ...cors, "Content-Type": "text/event-stream" } });
});
