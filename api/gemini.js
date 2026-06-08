export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }
  const { password, system_instruction, contents, generationConfig } = req.body || {};
  const GAME_PASSWORD = process.env.GAME_PASSWORD;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GAME_PASSWORD || password !== GAME_PASSWORD) {
    return res.status(401).json({ error: "INVALID_PASSWORD", message: "\u904a\u6232\u5bc6\u78bc\u932f\u8aa4" });
  }
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "MISSING_GEMINI_API_KEY", message: "\u4f3a\u670d\u5668\u5c1a\u672a\u8a2d\u5b9a Gemini API Key" });
  }
  const models = ["gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-2.5-flash"];
  const retryStatuses = new Set([404, 429, 500, 502, 503, 504]);
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({ system_instruction, contents, generationConfig })
      });
      if (retryStatuses.has(resp.status)) continue;
      const data = await resp.json();
      return res.status(resp.status).json(data);
    } catch (err) { continue; }
  }
  return res.status(503).json({ error: "GEMINI_BUSY", message: "Gemini \u76ee\u524d\u5fd9\u7eff\uff0c\u8acb\u7a0d\u5f8c\u518d\u8a66" });
}
