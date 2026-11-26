import { readJson, writeJson } from "./_store.js";
// Lauf-Log: gelaufene Runden während der Reise
const KEY = "meta/runs.json";
async function read() { return (await readJson(KEY)) ?? []; }
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") { res.status(200).json(await read()); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Nur GET/POST" }); return; }
    const chunks = []; for await (const c of req) chunks.push(c);
    const b = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    let all = await read();
    if (b.del) { all = all.filter(r => r.id !== b.del); await writeJson(KEY, all); res.status(200).json(all); return; }
    if (!/^2026-11-(2[1-9]|30)$/.test(b.day || "")) { res.status(400).json({ error: "Tag?" }); return; }
    if (!["Christoph", "Michi"].includes(b.by)) { res.status(400).json({ error: "Wer?" }); return; }
    const km = Math.round(Math.min(60, Math.max(0, +b.km || 0)) * 10) / 10;
    if (!km) { res.status(400).json({ error: "km?" }); return; }
    const min = Math.round(Math.min(600, Math.max(0, +b.min || 0)));
    const note = String(b.note || "").replace(/\s+/g, " ").trim().slice(0, 100);
    all.push({ id: Date.now().toString(36), day: b.day, by: b.by, km, min, note, ts: Date.now() });
    await writeJson(KEY, all);
    res.status(200).json(all);
  } catch (e) { res.status(500).json({ error: "Speichern fehlgeschlagen" }); }
}
