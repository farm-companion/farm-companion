'use client'
import { useRef, useState } from 'react'
import { z } from 'zod'

const Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name must be less than 80 characters'),
  email: z.string().email('Please enter a valid email address'),
  topic: z.enum(['general','bug','data-correction','partnership']).default('general'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be less than 2000 characters'),
  consent: z.boolean().refine(v => v, 'Please confirm you\'ve read our privacy notice.'),
  _hp: z.string().max(0, 'Honeypot field must be empty').optional().or(z.literal('')),
  ttf: z.number().int().nonnegative('Time to fill must be a positive number'),
})

export default function ContactForm() {
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [status, setStatus] = useState<'idle'|'submitting'|'success'|'error'>('idle')
  const [serverMsg, setServerMsg] = useState<string>('')
  const started = useRef<number>(performance.now())
  const hpRef = useRef<HTMLInputElement>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrors({})
    setServerMsg('')

    const fd = new FormData(e.currentTarget)
    const payload = {
      name: String(fd.get('name') || ''),
      email: String(fd.get('email') || ''),
      topic: String(fd.get('topic') || 'general'),
      message: String(fd.get('message') || ''),
      consent: fd.get('consent') === 'on',
      _hp: hpRef.current?.value ?? '',
      ttf: Math.round(performance.now() - started.current)
    }

    const parsed = Schema.safeParse(payload)
    if (!parsed.success) {
      const zerr: Record<string,string> = {}
      const fieldErrors = parsed.error.flatten().fieldErrors
      for (const k in fieldErrors) {
        const msg = fieldErrors[k as keyof typeof fieldErrors]?.[0]
        if (msg) zerr[k] = msg
      }
      setErrors(zerr)
      setStatus('idle')

      // Focus first invalid field
      const first = document.querySelector('[aria-invalid="true"]') as HTMLElement | null
      first?.focus()
      return
    }

    try {
      const res = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      })
      const json = await res.json().catch(()=>({}))

      if (!res.ok) {
        setStatus('error')
        if (res.status === 429) {
          setServerMsg('Too many messages. Please try again later.')
        } else if (res.status === 422) {
          setServerMsg('Please check your form data and try again.')
        } else {
          setServerMsg(json?.error || 'Something went wrong. Please try again.')
        }
      } else {
        setStatus('success')
      }
    } catch {
      setStatus('error')
      setServerMsg('Network error. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="py-8 border-t border-border">
        <h2 className="font-serif text-2xl font-normal text-foreground mb-4">Message sent</h2>
        <p className="text-lg leading-[1.9] text-foreground mb-2">
          Thank you. We will reply to your email soon.
        </p>
        <p className="text-foreground-muted text-sm">
          We typically respond within 24 to 48 hours during business days.
        </p>
      </div>
    )
  }

  const inputBase = `w-full border-0 border-b bg-transparent px-0 py-3 text-lg text-foreground
    focus:border-foreground focus:outline-none focus:ring-0
    placeholder:text-foreground-muted/50`

  return (
    <form className="space-y-6 pt-4 border-t border-border" onSubmit={onSubmit} noValidate>
      {/* Honeypot (hidden) */}
      <input
        ref={hpRef}
        type="text"
        name="_hp"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div>
        <label htmlFor="name" className="block text-xs tracking-[0.2em] uppercase text-foreground-muted mb-3">
          Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className={`${inputBase} ${
            errors.name ? 'border-red-500' : 'border-border'
          }`}
          placeholder="Your name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'err-name' : undefined}
        />
        {errors.name && (
          <p id="err-name" className="mt-2 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-xs tracking-[0.2em] uppercase text-foreground-muted mb-3">
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={`${inputBase} ${
            errors.email ? 'border-red-500' : 'border-border'
          }`}
          placeholder="your.email@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'err-email' : undefined}
        />
        {errors.email && (
          <p id="err-email" className="mt-2 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="topic" className="block text-xs tracking-[0.2em] uppercase text-foreground-muted mb-3">
          Topic *
        </label>
        <select
          id="topic"
          name="topic"
          className={`${inputBase} border-border cursor-pointer`}
        >
          <option value="general">General</option>
          <option value="bug">Bug Report</option>
          <option value="data-correction">Data Correction</option>
          <option value="partnership">Partnership</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-xs tracking-[0.2em] uppercase text-foreground-muted mb-3">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          className={`${inputBase} border rounded-none px-0 ${
            errors.message ? 'border-red-500' : 'border-border'
          }`}
          placeholder="Tell us more..."
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'err-message' : undefined}
        />
        {errors.message && (
          <p id="err-message" className="mt-2 text-sm text-red-600">{errors.message}</p>
        )}
      </div>

      <div className="flex items-start gap-3">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          required
          className="mt-1.5 rounded-none border-border text-foreground focus:ring-foreground"
          aria-invalid={!!errors.consent}
        />
        <label htmlFor="consent" className="text-sm text-foreground leading-relaxed">
          I have read the{' '}
          <a
            className="border-b border-foreground hover:opacity-70 transition-opacity"
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            privacy notice
          </a>
          . *
        </label>
      </div>
      {errors.consent && (
        <p className="text-sm text-red-600">{errors.consent}</p>
      )}

      {status === 'error' && (
        <div className="py-4 border-t border-border">
          <p className="text-sm text-red-600">{serverMsg}</p>
        </div>
      )}

      <div className="pt-4">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="text-xs tracking-[0.15em] uppercase text-foreground border-b border-foreground pb-1 hover:opacity-70 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </form>
  )
}
