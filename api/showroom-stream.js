function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(body)
  }
}

function pickHls(list) {
  if (!Array.isArray(list)) return null;
  const valid = list.filter(x => x && x.url);
  return (
    valid.find(x => x.type === "hls_all") ||
    valid.find(x => /^hls/i.test(String(x.type || ""))) ||
    valid.find(x => /\.m3u8(?:$|\?)/i.test(String(x.url || ""))) ||
    valid[0] ||
    null
  );
}

export default async function handler(req, res) {
  const event = { httpMethod: req.method, queryStringParameters: req.query || {}, headers: req.headers || {} }
  const send = (r) => { for (const [k,v] of Object.entries(r.headers || {})) res.setHeader(k,v); res.status(r.statusCode || 200); if (r.isBase64Encoded) return res.send(Buffer.from(r.body || '', 'base64')); return res.send(r.body || ''); }
  if (event.httpMethod === "OPTIONS") return send(json(204, {}));
  const q = event.queryStringParameters || {}
  let roomId = String(q.room_id || "").trim();

  try {
    // If a room key is supplied instead of a numeric room_id, resolve it from the room page.
    if (!roomId && q.room_key) {
      const key = String(q.room_key).trim();
      const page = await fetch(
        "https://www.showroom-live.com/r/" + encodeURIComponent(key),
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml"
          }
        }
      );
      if (!page.ok) return send(json(502, {error:"SHOWROOM room page HTTP " + page.status}));
      const html = await page.text();
      const m =
        html.match(/["']room_id["']\s*[:=]\s*["']?(\d+)/i) ||
        html.match(/room_id[=\\"]+(\d+)/i);
      if (m) roomId = m[1];
    }

    if (!roomId) return send(json(400, {error:"room_id is required"}));

    const api =
      "https://www.showroom-live.com/api/live/streaming_url?room_id=" +
      encodeURIComponent(roomId) + "&abr_available=1";

    const r = await fetch(api, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
        "Accept": "application/json,text/plain,*/*",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
        "Referer": "https://www.showroom-live.com/",
        "Origin": "https://www.showroom-live.com"
      }
    });

    const raw = await r.text();
    let data = null;
    try { data = JSON.parse(raw); } catch (_) {}

    if (!r.ok) {
      return send(json(502, {error:"SHOWROOM streaming_url API HTTP " + r.status, detail: raw.slice(0,300)}));
    }

    const item = pickHls(data?.streaming_url_list);
    if (!item?.url) {
      return send(json(404, {
        error:"SHOWROOMからHLS(m3u8) URLが返りませんでした",
        room_id: roomId,
        types: Array.isArray(data?.streaming_url_list)
          ? data.streaming_url_list.map(x => x?.type).filter(Boolean)
          : []
      }));
    }

    return send(json(200, {
      url: item.url,
      type: item.type || "hls",
      room_id: roomId
    }));
  } catch (e) {
    return send(json(502, {error:"SHOWROOM m3u8取得失敗: " + String(e?.message || e)}));
  }
}
