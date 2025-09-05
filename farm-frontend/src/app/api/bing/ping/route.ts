import { NextRequest, NextResponse } from 'next/server';

const HOST = 'www.farmcompanion.co.uk';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-internal-token');
  if (token !== process.env.INDEXNOW_INTERNAL_TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const key = process.env.BING_INDEXNOW_KEY!;
  const keyLocation = `https://${HOST}/${key}.txt`;
  const sitemapUrl = `https://${HOST}/sitemap.xml`;

  const payload = {
    host: HOST,
    key,
    keyLocation,
    urlList: [sitemapUrl],
  };

  const r = await fetch('https://www.bing.com/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await r.text();
  return NextResponse.json({ ok: r.ok, status: r.status, body: text, submitted: [sitemapUrl] });
}
