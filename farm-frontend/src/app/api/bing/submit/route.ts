import { NextRequest, NextResponse } from 'next/server';

const HOST = 'www.farmcompanion.co.uk';

function isAllowedUrl(url: string) {
  try {
    const u = new URL(url);
    return u.host === HOST && (u.protocol === 'https:' || u.protocol === 'http:');
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-internal-token');
  if (token !== process.env.INDEXNOW_INTERNAL_TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { url, urls } = await req.json().catch(() => ({} as any));
  const urlList: string[] =
    Array.isArray(urls) ? urls.filter(isAllowedUrl) :
    typeof url === 'string' && isAllowedUrl(url) ? [url] : [];

  if (urlList.length === 0) {
    return NextResponse.json({ ok: false, error: 'no valid urls for host' }, { status: 400 });
  }

  const key = process.env.BING_INDEXNOW_KEY!;
  const keyLocation = `https://${HOST}/${key}.txt`;

  const payload = {
    host: HOST,
    key,
    keyLocation,
    urlList,
  };

  const r = await fetch('https://www.bing.com/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await r.text();
  const ok = r.ok;
  return NextResponse.json({ ok, status: r.status, body: text, submitted: urlList });
}
