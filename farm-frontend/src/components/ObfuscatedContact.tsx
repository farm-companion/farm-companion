'use client'

import { useMemo, useState } from 'react'
import { Mail, Phone } from 'lucide-react'

// PRODUCT.md sets the floor at 48px interactive targets, which the previous
// `px-4 py-2` control missed at 32px.
//
// The size is an explicit pixel value, not `text-caption`. The project runs
// Tailwind v4 (`@import "tailwindcss"`), and `tailwind.config.js` is a v3
// config with no `@config` directive loading it, so its semantic type scale
// never reaches the build. `text-caption` rendered this phone number at
// 10.5px. A number someone reads off a screen outdoors is not a caption.
const CONTROL =
  'inline-flex items-center justify-center gap-2 min-h-[48px] px-4 ' +
  'rounded-[2px] border border-border bg-surface text-[16px] font-medium ' +
  'text-ink hover:bg-surface-2 transition-colors duration-200'

function maskEmail(email: string) {
  const [user, domain] = email.split('@')
  if (!user || !domain) return 'hidden'
  const u = user.length <= 2 ? user[0] + '…' : user.slice(0, 2) + '…'
  const d = domain.replace(/\./g, ' [dot] ')
  return `${u} [at] ${d}`
}

function maskPhone(phone: string) {
  // Keep last 3 digits visible
  const digits = phone.replace(/\D/g, '')
  if (digits.length <= 3) return '•••'
  return '•••• ••• •' + digits.slice(-3)
}

export function ObfuscatedEmail({ email, className = CONTROL }: { email?: string; className?: string }) {
  const [revealed, setRevealed] = useState(false)
  const masked = useMemo(() => (email ? maskEmail(email) : ''), [email])

  if (!email) return null
  return revealed ? (
    <a className={className} href={`mailto:${email}`}>
      <Mail className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span className="truncate">{email}</span>
    </a>
  ) : (
    <button type="button" className={className} onClick={() => setRevealed(true)} aria-label="Reveal email address">
      <Mail className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span className="truncate">{masked}</span>
    </button>
  )
}

export function ObfuscatedPhone({ phone, className = CONTROL }: { phone?: string; className?: string }) {
  const [revealed, setRevealed] = useState(false)
  const masked = useMemo(() => (phone ? maskPhone(phone) : ''), [phone])

  if (!phone) return null
  return revealed ? (
    <a className={className} href={`tel:${phone}`}>
      <Phone className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      {phone}
    </a>
  ) : (
    <button type="button" className={className} onClick={() => setRevealed(true)} aria-label="Reveal phone number">
      <Phone className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      {masked}
    </button>
  )
}
