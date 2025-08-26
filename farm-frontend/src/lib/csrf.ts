import { SITE_URL } from '@/lib/site'

export function checkCsrf(req: Request) {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const allowed = new URL(SITE_URL).origin
  
  return (origin && origin === allowed) || (referer && referer.startsWith(allowed))
}
