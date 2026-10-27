// Neue Fotos werden immer in Neon gespeichert (nie mehr im Vercel-Blob-Speicher).
import { hasDb, insertPhoto, readBody } from "./_db.js";
export const config = { api: { bodyParser: false } };
const who = v => (v === "Michi" ? "Michi" : v === "Christoph" ? "Christoph" : "Wir");
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Nur POST" }); return; }
  if (!hasDb) { res.status(503).json({ error: "Datenbank nicht verbunden" }); return; }
  try {
    const u = new URL(req.url, "http://x");
    const day = (u.searchParams.get("day") || "").replace(/[^0-9-]/g, "").slice(0, 10) || new Date().toISOString().slice(0, 10);
    const name = who(u.searchParams.get("who"));
    const type = req.headers["content-type"] || "image/jpeg";
    const raw = await readBody(req, 4.4 * 1024 * 1024);
    const body = type.startsWith("application/json") ? JSON.parse(raw.toString() || "{}") : { img: raw.toString("base64"), mime: type };
    const b64 = String(body.img || ""), t64 = body.thumb ? String(body.thumb) : "";
    const mime = String(body.mime || "image/jpeg");
    if (!b64 || !mime.startsWith("image/") || !/^[A-Za-z0-9+/=]+$/.test(b64) || (t64 && !/^[A-Za-z0-9+/=]+$/.test(t64))) { res.status(400).json({ error: "Nur Bilder" }); return; }
    const p = await insertPhoto({ day, who: name, mime, b64, thumbB64: t64 || null });
    res.status(200).json(p);
  } catch (e) {
    if (e && e.code === 413) { res.status(413).json({ error: "Foto zu groß" }); return; }
    res.status(500).json({ error: "Upload fehlgeschlagen" });
  }
}
