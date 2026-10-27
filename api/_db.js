// Neue Fotos in Neon (Postgres). Aktiv, sobald DATABASE_URL gesetzt ist.
// Bestehende Fotos bleiben im Blob-Speicher und werden zusätzlich angezeigt.
import { neon } from "@neondatabase/serverless";

const URL_ = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
export const hasDb = !!URL_;
let sql = null;
let ready = null;

export function db() {
  if (!sql) sql = neon(URL_);
  if (!ready) ready = sql`CREATE TABLE IF NOT EXISTS photos (
      id         BIGSERIAL PRIMARY KEY,
      day        TEXT NOT NULL,
      who        TEXT NOT NULL,
      mime       TEXT NOT NULL DEFAULT 'image/jpeg',
      data       BYTEA NOT NULL,
      thumb      BYTEA,
      size       INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`.then(() => sql`CREATE INDEX IF NOT EXISTS photos_day_idx ON photos (day, created_at)`).catch(e => { ready = null; throw e; });
  return ready.then(() => sql);
}

// Gleiches Format wie beim Blob-Speicher, damit die Seite beide gleich behandelt
function entry(r) {
  const t = new Date(r.created_at);
  return {
    url: `/api/photo?id=${r.id}`,
    thumb: r.has_thumb ? `/api/photo?id=${r.id}&s=t` : `/api/photo?id=${r.id}`,
    pathname: `fotos/${r.day}/${t.getTime()}-${r.who}.jpg`,
    uploadedAt: t.toISOString(),
    size: r.size,
  };
}

export async function listPhotos() {
  const q = await db();
  const rows = await q`SELECT id, day, who, size, created_at, (thumb IS NOT NULL) AS has_thumb FROM photos ORDER BY created_at`;
  return rows.map(entry);
}

export async function insertPhoto({ day, who, mime, b64, thumbB64 }) {
  const q = await db();
  const size = Math.floor((b64.length * 3) / 4);
  const rows = thumbB64
    ? await q`INSERT INTO photos (day, who, mime, data, thumb, size) VALUES (${day}, ${who}, ${mime}, decode(${b64}, 'base64'), decode(${thumbB64}, 'base64'), ${size})
        RETURNING id, day, who, size, created_at, true AS has_thumb`
    : await q`INSERT INTO photos (day, who, mime, data, size) VALUES (${day}, ${who}, ${mime}, decode(${b64}, 'base64'), ${size})
        RETURNING id, day, who, size, created_at, false AS has_thumb`;
  return entry(rows[0]);
}

export async function getPhoto(id, thumb) {
  const q = await db();
  const rows = thumb
    ? await q`SELECT mime, encode(COALESCE(thumb, data), 'base64') AS b64 FROM photos WHERE id = ${id}`
    : await q`SELECT mime, encode(data, 'base64') AS b64 FROM photos WHERE id = ${id}`;
  return rows[0] || null;
}

export async function deletePhoto(id) {
  const q = await db();
  await q`DELETE FROM photos WHERE id = ${id}`;
}

export async function readBody(req, limit) {
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (limit && size > limit) throw Object.assign(new Error("too big"), { code: 413 }); chunks.push(c); }
  return Buffer.concat(chunks);
}
