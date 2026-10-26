// Kleine JSON-Ablage im Blob-Store, ohne list().
// list(), put() und copy() sind "Advanced Operations" (Hobby: 2.000/Monat).
// Ein direkter Abruf über die feste URL zählt nur als Simple Operation.
import { put, list } from "@vercel/blob";

// Gleiche Logik wie im SDK: vercel_blob_rw_<storeId>_<secret>
function urlFor(key) {
  const storeId = (process.env.BLOB_READ_WRITE_TOKEN || "").split("_")[3] || "";
  return storeId ? `https://${storeId}.public.blob.vercel-storage.com/${key}` : null;
}

const known = {};   // key -> URL, solange die Funktion warm ist
const missing = {}; // key -> true, wenn die Datei sicher nicht existiert

// Liefert den Inhalt oder undefined, wenn die Datei (noch) nicht existiert.
export async function readJson(key) {
  if (missing[key]) return undefined;
  const url = known[key] || urlFor(key);
  if (url) {
    const r = await fetch(url + "?t=" + Date.now(), { cache: "no-store" });
    if (r.ok) { known[key] = url; return await r.json(); }
    if (r.status !== 404) throw new Error("Blob " + r.status);
  }
  // Nur als Rückfall, z. B. wenn die Datei noch nie geschrieben wurde
  const l = await list({ prefix: key, limit: 1 });
  const b = l.blobs.find(x => x.pathname === key);
  if (!b) { missing[key] = true; return undefined; }
  known[key] = b.url;
  const r = await fetch(b.url + "?t=" + Date.now(), { cache: "no-store" });
  if (!r.ok) throw new Error("Blob " + r.status);
  return await r.json();
}

export async function writeJson(key, data) {
  const b = await put(key, JSON.stringify(data), { access: "public", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 });
  known[key] = b.url; delete missing[key];
  return data;
}

// ---------- Foto-Index ----------
// Statt bei jedem Abruf alle Fotos zu listen, führen wir meta/photos.json mit.
const PHOTOS = "meta/photos.json";

async function scanPhotos() {
  let cursor, all = [];
  do { const r = await list({ prefix: "fotos/", limit: 1000, cursor }); all = all.concat(r.blobs); cursor = r.hasMore ? r.cursor : undefined; } while (cursor);
  return all.map(b => ({ url: b.url, pathname: b.pathname, uploadedAt: new Date(b.uploadedAt).toISOString(), size: b.size }));
}

export async function getPhotos() {
  const idx = await readJson(PHOTOS);
  if (Array.isArray(idx)) return idx;
  // Einmalig: Index aus dem bestehenden Bestand aufbauen
  return writeJson(PHOTOS, await scanPhotos());
}

export async function addPhoto(entry) {
  const idx = await readJson(PHOTOS);
  const all = Array.isArray(idx) ? idx.filter(p => p.url !== entry.url).concat(entry) : await scanPhotos();
  return writeJson(PHOTOS, all);
}

export async function removePhoto(url) {
  const idx = await readJson(PHOTOS);
  const all = Array.isArray(idx) ? idx.filter(p => p.url !== url) : await scanPhotos();
  return writeJson(PHOTOS, all);
}
