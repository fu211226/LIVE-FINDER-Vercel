export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  try {
    const upstream = await fetch('https://www.showroom-live.com/api/time_table/time_tables', { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json,*/*', 'Referer': 'https://www.showroom-live.com/' } });
    const body = await upstream.text();
    res.status(upstream.status).setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8').send(body);
  } catch (e) { res.status(502).json({ error: 'SHOWROOM番組表の取得に失敗しました', detail: String(e?.message || e) }); }
}
