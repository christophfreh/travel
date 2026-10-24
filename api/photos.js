import { list } from "@vercel/blob";
export default async function handler(req, res) {
  try {
    let cursor, all = [];
    do { const r = await list({ prefix: "fotos/", limit: 1000, cursor }); all = all.concat(r.blobs); cursor = r.hasMore ? r.cursor : undefined; } while (cursor);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(all.map(b => ({ url: b.url, pathname: b.pathname, uploadedAt: b.uploadedAt, size: b.size })));
  } catch (e) { res.status(500).json({ error: "Fotos konnten nicht geladen werden" }); }
}
