import { getPhotos } from "./_store.js";
export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(await getPhotos());
  } catch (e) { res.status(500).json({ error: "Fotos konnten nicht geladen werden" }); }
}
