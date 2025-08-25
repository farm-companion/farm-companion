'use client'

import { useMemo, useState } from 'react'

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

export function ObfuscatedEmail({ email }: { email?: string }) {
  const [revealed, setRevealed] = useState(false)
  const masked = useMemo(() => (email ? maskEmail(email) : ''), [email])

  if (!email) return null
  return revealed ? (
    <a
      className="rounded border px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1E1F23]"
      href={`mailto:${email}`}
    >
      ✉️ {email}
    </a>
  ) : (
    <button
      type="button"
      className="rounded border px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1E1F23]"
      onClick={() => setRevealed(true)}
      aria-label="Reveal email"
    >
      ✉️ {masked}
    </button>
  )
}

export function ObfuscatedPhone({ phone }: { phone?: string }) {
  const [revealed, setRevealed] = useState(false)
  const masked = useMemo(() => (phone ? maskPhone(phone) : ''), [phone])

  if (!phone) return null
  return revealed ? (
    <a
      className="rounded border px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1E1F23]"
      href={`tel:${phone}`}
    >
      📞 {phone}
    </a>
  ) : (
    <button
      type="button"
      className="rounded border px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1E1F23]"
      onClick={() => setRevealed(true)}
      aria-label="Reveal phone"
    >
      📞 {masked}
    </button>
  )
}
