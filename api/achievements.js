import { put, list } from "@vercel/blob";
const KEY = "meta/achievements.json";
async function read() {
  const r = await list({ prefix: KEY, limit: 1 });
  if (!r.blobs.length) return {};
  try { return await (await fetch(r.blobs[0].url + "?t=" + Date.now(), { cache: "no-store" })).json(); } catch (e) { return {}; }
}
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
    await put(KEY, JSON.stringify(all), { access: "public", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 0 });
    res.status(200).json(all);
  } catch (e) { res.status(500).json({ error: "Speichern fehlgeschlagen" }); }
}
