import { readJson, writeJson } from "./_store.js";
// "Bestes vom Tag": pro Reisetag ein Satz von Christoph und einer von Michi
const KEY = "meta/best.json";
async function read() { return (await readJson(KEY)) ?? {}; }
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") { res.status(200).json(await read()); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Nur GET/POST" }); return; }
    const chunks = []; for await (const c of req) chunks.push(c);
    const { day, by, text } = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    if (!/^2026-11-(2[1-9])$/.test(day || "")) { res.status(400).json({ error: "Tag?" }); return; }
    if (!["Christoph", "Michi"].includes(by)) { res.status(400).json({ error: "Wer?" }); return; }
    const t = String(text || "").replace(/\s+/g, " ").trim().slice(0, 140);
    const all = await read();
    all[day] = all[day] || {};
    if (t) all[day][by] = { t, ts: Date.now() }; else delete all[day][by];
    await writeJson(KEY, all);
    res.status(200).json(all);
  } catch (e) { res.status(500).json({ error: "Speichern fehlgeschlagen" }); }
}
