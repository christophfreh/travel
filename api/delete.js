import { del } from "@vercel/blob";
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Nur POST" }); return; }
  try {
    const chunks = []; for await (const c of req) chunks.push(c);
    const { url } = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    const u = new URL(url);
    if (!u.hostname.endsWith(".blob.vercel-storage.com") || !u.pathname.startsWith("/fotos/")) { res.status(400).json({ error: "Ungültig" }); return; }
    await del(url);
    res.status(200).json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Löschen fehlgeschlagen" }); }
}
