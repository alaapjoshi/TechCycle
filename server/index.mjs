import http from 'node:http';
import { pathToFileURL } from 'node:url';

const localOrigin = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

// Local development only: never expose this unauthenticated service to a network.
export function createServer({ apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || 'gpt-4.1-mini', fetchImpl = fetch } = {}) {
  return http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    const send = (status, body) => { res.writeHead(status); res.end(JSON.stringify(body)); };
    if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(req.headers.host || '')) return send(403, { error: 'Local host required.' });
    // Block hostile web pages even when requests omit Origin (for example fetch no-cors).
    if ((req.headers['sec-fetch-site'] === 'cross-site' && !origin) || (origin && !localOrigin.test(origin))) {
      return send(403, { error: 'Only a local development app may use this server.' });
    }
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    if (req.method === 'GET' && req.url === '/health') return send(200, { ok: true, configured: Boolean(apiKey) });
    if (req.method !== 'POST' || req.url !== '/estimate') return send(404, { error: 'Not found.' });
    if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { error: 'Send application/json.' });
    if (!apiKey) return send(503, { error: 'Run npm run setup and add a private OpenAI API key.' });
    let data;
    try {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (Buffer.byteLength(raw) > 20000) return send(413, { error: 'Request is too large.' });
      }
      data = JSON.parse(raw);
    } catch { return send(400, { error: 'Invalid JSON.' }); }
    if (typeof data?.description !== 'string' || !data.description.trim() || data.description.length > 4000) {
      return send(400, { error: 'Describe the device or part using 1 to 4000 characters.' });
    }
    const content = `Estimate approximate resale price ranges in USD for this device or part by condition. Explain uncertainty briefly. These are model estimates, not live marketplace data or a formal appraisal. Item: ${data.description.trim()}`;
    try {
      const upstream = await fetchImpl('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, input: content }),
        signal: AbortSignal.timeout(60000),
      });
      if (!upstream.ok) return send(502, { error: 'The AI provider rejected the request. Check your server key, billing and OPENAI_MODEL.' });
      const response = await upstream.json();
      const text = response.output?.flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('\n');
      if (typeof text !== 'string' || !text.trim()) return send(502, { error: 'The AI provider returned no text.' });
      return send(200, { text: text.trim() });
    } catch { return send(502, { error: 'The AI provider could not be reached. Try again later.' }); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createServer().listen(3012, '127.0.0.1', () => console.log('TechCycle AI server: http://127.0.0.1:3012 (local development only)'));
}
