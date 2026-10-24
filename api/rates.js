export default async function handler(req, res) {
  const src = [
    async () => { const d = await (await fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=KRW,JPY")).json(); return { KRW: d.rates.KRW, JPY: d.rates.JPY, date: d.date, source: "EZB" }; },
    async () => { const d = await (await fetch("https://open.er-api.com/v6/latest/EUR")).json(); return { KRW: d.rates.KRW, JPY: d.rates.JPY, date: d.time_last_update_utc, source: "ExchangeRate-API" }; },
  ];
  for (const f of src) {
    try { const r = await f(); if (r.KRW > 0 && r.JPY > 0) { res.setHeader("Cache-Control", "s-maxage=10800, stale-while-revalidate=86400"); res.status(200).json(r); return; } } catch (e) {}
  }
  res.status(502).json({ error: "Kurs nicht erreichbar" });
}
