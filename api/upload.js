import { put } from "@vercel/blob";
import { addPhoto } from "./_store.js";
import { hasDb, insertPhoto, readBody } from "./_db.js";
export const config = { api: { bodyParser: false } };
const who = v => (v === "Michi" ? "Michi" : v === "Christoph" ? "Christoph" : "Wir");
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Nur POST" }); return; }
  try {
    const u = new URL(req.url, "http://x");
    const day = (u.searchParams.get("day") || "").replace(/[^0-9-]/g, "").slice(0, 10) || new Date().toISOString().slice(0, 10);
    const name = who(u.searchParams.get("who"));
    const type = req.headers["content-type"] || "image/jpeg";

    // Neue Fotos: in Neon
    if (hasDb) {
      const raw = await readBody(req, 4.4 * 1024 * 1024);
      const body = type.startsWith("application/json") ? JSON.parse(raw.toString() || "{}") : { img: raw.toString("base64"), mime: type };
      const b64 = String(body.img || ""), t64 = body.thumb ? String(body.thumb) : "";
      const mime = String(body.mime || "image/jpeg");
      if (!mime.startsWith("image/") || !/^[A-Za-z0-9+/=]+$/.test(b64) || (t64 && !/^[A-Za-z0-9+/=]+$/.test(t64))) { res.status(400).json({ error: "Nur Bilder" }); return; }
      const p = await insertPhoto({ day, who: name, mime, b64, thumbB64: t64 || null });
      res.status(200).json(p); return;
    }

    // Rückfall, solange keine Datenbank verbunden ist: wie bisher im Blob-Speicher
    const raw = await readBody(req, 4.4 * 1024 * 1024);
    let buf = raw, mime = type;
    if (type.startsWith("application/json")) { const b = JSON.parse(raw.toString() || "{}"); buf = Buffer.from(String(b.img || ""), "base64"); mime = String(b.mime || "image/jpeg"); }
    if (!mime.startsWith("image/") || !buf.length) { res.status(400).json({ error: "Nur Bilder" }); return; }
    const blob = await put(`fotos/${day}/${Date.now()}-${name}.jpg`, buf, { access: "public", contentType: mime, addRandomSuffix: true });
    try { await addPhoto({ url: blob.url, pathname: blob.pathname, uploadedAt: new Date().toISOString(), size: buf.length }); } catch (e) {}
    res.status(200).json({ url: blob.url, pathname: blob.pathname });
  } catch (e) {
    if (e && e.code === 413) { res.status(413).json({ error: "Foto zu groß" }); return; }
    res.status(500).json({ error: "Upload fehlgeschlagen" });
  }
}
