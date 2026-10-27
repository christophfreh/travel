import { hasDb, getPhoto } from "./_db.js";
export default async function handler(req, res) {
  if (!hasDb) { res.status(404).end(); return; }
  try {
    const u = new URL(req.url, "http://x");
    const id = u.searchParams.get("id") || "";
    if (!/^\d{1,18}$/.test(id)) { res.status(400).end(); return; }
    const p = await getPhoto(id, u.searchParams.get("s") === "t");
    if (!p) { res.status(404).end(); return; }
    const buf = Buffer.from(p.b64, "base64");
    res.setHeader("Content-Type", p.mime || "image/jpeg");
    res.setHeader("Content-Length", String(buf.length));
    // Fotos ändern sich nie: im Browser dauerhaft cachen, nicht im öffentlichen CDN
    res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
    res.status(200).end(buf);
  } catch (e) { res.status(500).end(); }
}
