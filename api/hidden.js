import { put, list } from "@vercel/blob";
const KEY = "meta/hidden.json";
async function read() {
  const r = await list({ prefix: KEY, limit: 1 });
  if (!r.blobs.length) return [];
  try { return await (await fetch(r.blobs[0].url + "?t=" + Date.now(), { cache: "no-store" })).json(); } catch (e) { return []; }
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") { res.status(200).json(await read()); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Nur GET/POST" }); return; }
    const chunks = []; for await (const c of req) chunks.push(c);
    const { id, show } = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    if (!/^[a-z0-9-]{1,40}$/.test(id || "")) { res.status(400).json({ error: "Ungültig" }); return; }
    let ids = await read();
    ids = show ? ids.filter(x => x !== id) : [...new Set([...ids, id])];
    await put(KEY, JSON.stringify(ids), { access: "public", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 0 });
    res.status(200).json(ids);
  } catch (e) { res.status(500).json({ error: "Speichern fehlgeschlagen" }); }
}
