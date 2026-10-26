import { readJson, writeJson } from "./_store.js";
const KEY = "meta/achievements.json";
async function read() { return (await readJson(KEY)) ?? {}; }
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") { res.status(200).json(await read()); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Nur GET/POST" }); return; }
    const chunks = []; for await (const c of req) chunks.push(c);
    const { id, by, undo } = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    if (!/^[a-z0-9-]{1,40}$/.test(id || "")) { res.status(400).json({ error: "Ungültig" }); return; }
    if (!undo && !["Christoph", "Michi"].includes(by)) { res.status(400).json({ error: "Wer?" }); return; }
    const all = await read();
    if (undo) delete all[id]; else if (!all[id]) all[id] = { by, ts: Date.now() };
    await writeJson(KEY, all);
    res.status(200).json(all);
  } catch (e) { res.status(500).json({ error: "Speichern fehlgeschlagen" }); }
}
