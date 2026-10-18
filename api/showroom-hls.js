function absUrl(u, base) { try { return new URL(u, base).toString(); } catch { return u; } }
function proxyUrl(u) { return '/api/showroom-hls?url=' + encodeURIComponent(u); }
function rewritePlaylist(text, base) {
  text = text.replace(/URI="([^"]+)"/g, (_, u) => 'URI="' + proxyUrl(absUrl(u, base)) + '"');
  return text.split(/\r?\n/).map(line => { const t = line.trim(); if (!t || t.startsWith('#')) return line; return proxyUrl(absUrl(t, base)); }).join('\n');
}
export default async function handler(req, res) {
  const common = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Range', 'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Type', 'Cache-Control': 'no-store' };
  for (const [k,v] of Object.entries(common)) res.setHeader(k,v);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const target = typeof req.query.url === 'string' ? req.query.url : '';
  if (!target) return res.status(400).send('url is required');
  let parsed; try { parsed = new URL(target); } catch { return res.status(400).send('invalid url'); }
  if (!['https:'].includes(parsed.protocol) || !/(^|\.)showroom-live\.com$|(^|\.)showroom-cdn\.com$|(^|\.)showroom-txlive\.com$|(^|\.)akamaized\.net$|(^|\.)akamaized\.com$/.test(parsed.hostname)) return res.status(403).send('host not allowed');
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*', 'Referer': 'https://www.showroom-live.com/', 'Origin': 'https://www.showroom-live.com' };
    if (req.headers.range) headers.Range = req.headers.range;
    const upstream = await fetch(target, { headers });
    if (!upstream.ok) return res.status(upstream.status).send(await upstream.text());
    const ct = upstream.headers.get('content-type') || '';
    const isPlaylist = /mpegurl|m3u8/i.test(ct) || /\.m3u8(?:$|\?)/i.test(target);
    if (isPlaylist) { res.setHeader('Content-Type', 'application/vnd.apple.mpegurl'); return res.status(200).send(rewritePlaylist(await upstream.text(), target)); }
    if (ct) res.setHeader('Content-Type', ct);
    for (const h of ['content-length','content-range','accept-ranges']) { const v=upstream.headers.get(h); if(v) res.setHeader(h,v); }
    return res.status(200).send(Buffer.from(await upstream.arrayBuffer()));
  } catch (e) { return res.status(502).send(String(e?.message || e)); }
}
