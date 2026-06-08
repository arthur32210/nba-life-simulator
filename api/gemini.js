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
    return res.status(500).json({ error: "MISSING_GEMINI_API_KEY", message: "Vercel \u5c1a\u672a\u8a2d\u5b9a GEMINI_API_KEY" });
  }
  const models = ["gemini-2.0-flash-lite", "gemini-2.0-flash", "gemini-2.5-flash"];
  const retryStatuses = new Set([429, 500, 502, 503, 504]);
  const authErrStatuses = new Set([400, 401, 403]);
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({ system_instruction, contents, generationConfig })
      });
      if (retryStatuses.has(resp.status)) continue;
      if (authErrStatuses.has(resp.status)) {
        let detail = "";
        try { const d = await resp.json(); detail = d.error?.message || JSON.stringify(d); } catch (_) {}
        return res.status(resp.status).json({
          error: "GEMINI_AUTH_ERROR",
          message: "Gemini API Key \u7121\u6548\u6216\u672a\u555f\u7528\u4ed8\u8cbb\uff0c\u8acb\u6aa2\u67e5 Vercel \u7684 GEMINI_API_KEY\u3002\u539f\u59cb\u932f\u8aa4\uff1a" + detail
        });
      }
      const data = await resp.json();
      return res.status(resp.status).json(data);
    } catch (err) { continue; }
  }
  return res.status(503).json({ error: "GEMINI_BUSY", message: "Gemini \u76ee\u524d\u5fd9\u7eff\uff0c\u8acb\u7a0d\u5f8c\u518d\u8a66" });
}
