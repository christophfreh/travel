import { del } from "@vercel/blob";
import { removePhoto } from "./_store.js";
import { hasDb, deletePhoto, readBody } from "./_db.js";
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Nur POST" }); return; }
  try {
    const { url } = JSON.parse((await readBody(req, 64 * 1024)).toString() || "{}");
    const u = new URL(url, "https://x.local");
    // Neue Fotos in Neon: /api/photo?id=123
    if (u.pathname === "/api/photo") {
      const id = u.searchParams.get("id") || "";
      if (!hasDb || !/^\d{1,18}$/.test(id)) { res.status(400).json({ error: "Ungültig" }); return; }
      await deletePhoto(id);
      res.status(200).json({ ok: true }); return;
    }
    // Bestehende Fotos im Blob-Speicher
    if (!u.hostname.endsWith(".blob.vercel-storage.com") || !u.pathname.startsWith("/fotos/")) { res.status(400).json({ error: "Ungültig" }); return; }
    await del(url);
    try { await removePhoto(url); } catch (e) {}
    res.status(200).json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Löschen fehlgeschlagen" }); }
}
