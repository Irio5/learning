// Vercel serverless function — proxy verso Groq + log su Supabase.
// Chiave Groq e service_role key restano solo qui (mai esposte al client).
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { question, moduleId, moduleLabel, sessionId, history } = req.body || {};
  if (!question || typeof question !== "string" || !question.trim()) {
    res.status(400).json({ error: "Manca la domanda" });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GROQ_API_KEY non configurata sul server" });
    return;
  }

  const messages = [
    {
      role: "system",
      content:
        `Sei un tutor che aiuta a capire una lezione interattiva di backend engineering. ` +
        `L'utente sta studiando il modulo "${moduleLabel || moduleId || "generico"}". ` +
        `Rispondi in italiano, in modo chiaro e conciso (max ~150 parole), con esempi concreti quando utile.`,
    },
    ...(Array.isArray(history)
      ? history.slice(-8).map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || "").slice(0, 4000),
        }))
      : []),
    { role: "user", content: question.slice(0, 4000) },
  ];

  let answer;
  try {
    const r = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.4 }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(`Groq API ${r.status}: ${t.slice(0, 300)}`);
    }
    const data = await r.json();
    answer = data?.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error("Risposta vuota da Groq");
  } catch (e) {
    res.status(502).json({ error: e.message || "Errore nel contattare Groq" });
    return;
  }

  // fire-and-forget: il log non deve mai far fallire la risposta all'utente
  logToSupabase({ sessionId, moduleId, moduleLabel, question, answer }).catch((e) =>
    console.error("Log Supabase fallito:", e.message)
  );

  res.status(200).json({ answer });
}

async function logToSupabase({ sessionId, moduleId, moduleLabel, question, answer }) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return; // logging non configurato: non bloccare la chat

  const r = await fetch(`${url}/rest/v1/chat_messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify([
      { session_id: sessionId, module_id: moduleId, module_label: moduleLabel, question, answer },
    ]),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`Supabase ${r.status}: ${t.slice(0, 300)}`);
  }
}
