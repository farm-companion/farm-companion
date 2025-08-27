// Farm Photos API - Streaming Proxy Route
// PuredgeOS 3.0 Compliant Photo Management

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BASE = process.env.PHOTOS_API_BASE!;
if (!BASE) {
  throw new Error('PHOTOS_API_BASE env var is missing');
}

// hop-by-hop headers that must not be forwarded
const HOP = [
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
  'host', 'content-length', 'accept-encoding'
];

function cleanHeaders(src: Headers) {
  const h = new Headers(src);
  for (const k of HOP) h.delete(k);
  return h;
}

async function proxy(req: Request) {
  const url = new URL(req.url);
  const method = req.method.toUpperCase();
  const upstream = `${BASE}/api/photos${url.search || ''}`;

  const init: RequestInit = {
    method,
    headers: cleanHeaders(req.headers)
  };

  // Only forward a body for methods that can have one.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    // ✅ Stream the original body through untouched (keeps multipart boundary).
    init.body = req.body as any;
    // ✅ Required by Node/undici when sending a (web) ReadableStream body.
    (init as any).duplex = 'half';
  }

  const res = await fetch(upstream, init);

  // Strip CORS headers (same-origin proxy means not needed)
  const out = new Headers(res.headers);
  out.delete('access-control-allow-origin');
  out.delete('access-control-allow-credentials');

  return new Response(res.body, { status: res.status, headers: out });
}

// Map all verbs to the same handler
export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE };
export async function OPTIONS() { return new Response(null, { status: 204 }); }
