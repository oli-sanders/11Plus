// Shape Logic 11+ progress store.
// One KV record per progress link id:  p:<id>  ->  { v: 1, updated, sessions: [...] }
//
//   GET  /progress/:id   -> the record (or an empty one)
//   POST /progress/:id   -> body { session }, appends it (idempotent on session.id), returns the record

const ID_RE = /^[A-Za-z0-9-]{8,64}$/;
const TYPES = new Set(['odd', 'similar', 'series', 'analogy', 'codes', 'matrix']);
const MAX_SESSIONS = 1000;
const MAX_BODY = 32 * 1024;

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    const m = url.pathname.match(/^\/progress\/([^/]+)\/?$/);
    if (!m) return json({ error: 'Not found' }, 404, cors);

    const id = decodeURIComponent(m[1]);
    if (!ID_RE.test(id)) return json({ error: 'Invalid progress id' }, 400, cors);
    const key = `p:${id}`;

    if (request.method === 'GET') {
      const rec = (await env.PROGRESS.get(key, 'json')) || emptyRecord();
      return json(rec, 200, { ...cors, 'Cache-Control': 'no-store' });
    }

    if (request.method === 'POST') {
      const text = await request.text();
      if (text.length > MAX_BODY) return json({ error: 'Body too large' }, 413, cors);
      let body;
      try { body = JSON.parse(text); } catch { return json({ error: 'Body must be JSON' }, 400, cors); }
      const session = cleanSession(body && body.session);
      if (!session) return json({ error: 'Invalid session' }, 400, cors);

      const rec = (await env.PROGRESS.get(key, 'json')) || emptyRecord();
      if (!rec.sessions.some((s) => s.id === session.id)) {
        rec.sessions.push(session);
        rec.sessions.sort((a, b) => a.t - b.t);
        if (rec.sessions.length > MAX_SESSIONS) rec.sessions = rec.sessions.slice(-MAX_SESSIONS);
        rec.updated = Date.now();
        await env.PROGRESS.put(key, JSON.stringify(rec));
      }
      return json(rec, 200, cors);
    }

    return json({ error: 'Method not allowed' }, 405, cors);
  },
};

function emptyRecord() {
  return { v: 1, updated: 0, sessions: [] };
}

// Accept only the shape the app writes; drop anything else.
function cleanSession(s) {
  if (!s || typeof s !== 'object') return null;
  if (typeof s.id !== 'string' || !ID_RE.test(s.id)) return null;
  const t = Number(s.t);
  if (!Number.isFinite(t) || t < 1.6e12 || t > Date.now() + 864e5) return null;
  if (!Array.isArray(s.q) || s.q.length === 0 || s.q.length > 60) return null;
  const q = [];
  for (const x of s.q) {
    if (!Array.isArray(x) || !TYPES.has(x[0])) return null;
    const secs = Number(x[3]);
    q.push([x[0], x[1] ? 1 : 0, x[2] ? 1 : 0, Number.isFinite(secs) ? Math.min(3600, Math.max(0, Math.round(secs * 10) / 10)) : 0]);
  }
  return {
    id: s.id,
    t,
    mode: s.mode === 'test' ? 'test' : 'practice',
    hard: s.hard ? 1 : 0,
    dur: Math.min(864e5, Math.max(0, Number(s.dur) || 0)),
    q,
  };
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const h = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}
