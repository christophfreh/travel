import { getPhotos } from "./_store.js";
import { hasDb, listPhotos } from "./_db.js";
// Bestehende Fotos aus dem Blob-Speicher plus neue aus Neon
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const [blob, neon] = await Promise.allSettled([getPhotos(), hasDb ? listPhotos() : Promise.resolve([])]);
  if (blob.status === "rejected" && neon.status === "rejected") { res.status(500).json({ error: "Fotos konnten nicht geladen werden" }); return; }
  const all = [...(blob.status === "fulfilled" ? blob.value : []), ...(neon.status === "fulfilled" ? neon.value : [])];
  res.status(200).json(all);
}
