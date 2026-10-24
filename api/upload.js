import { put } from "@vercel/blob";
export const config = { api: { bodyParser: false } };
const who = v => (v === "Michi" ? "Michi" : v === "Christoph" ? "Christoph" : "Wir");
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Nur POST" }); return; }
  try {
    const chunks = []; let size = 0;
    for await (const c of req) { size += c.length; if (size > 4.4 * 1024 * 1024) { res.status(413).json({ error: "Foto zu groß" }); return; } chunks.push(c); }
    const buf = Buffer.concat(chunks);
    const type = req.headers["content-type"] || "image/jpeg";
    if (!type.startsWith("image/")) { res.status(400).json({ error: "Nur Bilder" }); return; }
    const u = new URL(req.url, "http://x");
    const day = (u.searchParams.get("day") || "").replace(/[^0-9-]/g, "").slice(0, 10) || new Date().toISOString().slice(0, 10);
    const name = who(u.searchParams.get("who"));
    const blob = await put(`fotos/${day}/${Date.now()}-${name}.jpg`, buf, { access: "public", contentType: type, addRandomSuffix: true });
    res.status(200).json({ url: blob.url, pathname: blob.pathname });
  } catch (e) { res.status(500).json({ error: "Upload fehlgeschlagen" }); }
}
