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
      <div className="rounded-lg border p-6 bg-green-50 border-green-200">
        <h2 className="text-body font-semibold text-green-900 mb-2">Thanks—message sent!</h2>
        <p className="text-green-800 text-caption mb-4">
          We&apos;ll reply to <span className="font-mono">your email</span> soon. You&apos;ll also receive an acknowledgement.
        </p>
        <div className="text-small text-green-700">
          We typically respond within 24-48 hours during business days.
        </div>
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
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
        <label htmlFor="name" className="block text-caption font-medium text-text-body mb-2">
          Name *
        </label>
        <input 
          id="name" 
          name="name" 
          type="text"
          required
          className={`w-full rounded-lg border px-4 py-3 text-caption bg-background-surface text-text-body
                     focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
                     placeholder-text-muted ${
                       errors.name ? 'border-red-500' : 'border-border-default'
                     }`}
          placeholder="Your name"
          aria-invalid={!!errors.name} 
          aria-describedby={errors.name ? 'err-name' : undefined}
        />
        {errors.name && (
          <p id="err-name" className="mt-1 text-caption text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-caption font-medium text-text-body mb-2">
          Email *
        </label>
        <input 
          id="email" 
          name="email" 
          type="email" 
          required
          className={`w-full rounded-lg border px-4 py-3 text-caption bg-background-surface text-text-body
                     focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
                     placeholder-text-muted ${
                       errors.email ? 'border-red-500' : 'border-border-default'
                     }`}
          placeholder="your.email@example.com"
          aria-invalid={!!errors.email} 
          aria-describedby={errors.email ? 'err-email' : undefined}
        />
        {errors.email && (
          <p id="err-email" className="mt-1 text-caption text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="topic" className="block text-caption font-medium text-text-body mb-2">
          Topic *
        </label>
        <select 
          id="topic" 
          name="topic" 
          className="w-full rounded-lg border border-border-default px-4 py-3 text-caption bg-background-surface text-text-body
                     focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
        >
          <option value="general">General</option>
          <option value="bug">Bug Report</option>
          <option value="data-correction">Data Correction</option>
          <option value="partnership">Partnership</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-caption font-medium text-text-body mb-2">
          Message *
        </label>
        <textarea 
          id="message" 
          name="message" 
          rows={6}
          required
          className={`w-full rounded-lg border px-4 py-3 text-caption bg-background-surface text-text-body
                     focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
                     placeholder-text-muted ${
                       errors.message ? 'border-red-500' : 'border-border-default'
                     }`}
          placeholder="Tell us more..."
          aria-invalid={!!errors.message} 
          aria-describedby={errors.message ? 'err-message' : undefined}
        />
        {errors.message && (
          <p id="err-message" className="mt-1 text-caption text-red-600">{errors.message}</p>
        )}
      </div>

      <div className="flex items-start gap-2">
        <input 
          id="consent" 
          name="consent" 
          type="checkbox" 
          required
          className="mt-1 rounded border-border-default text-brand-primary focus:ring-brand-primary"
          aria-invalid={!!errors.consent}
        />
        <label htmlFor="consent" className="text-caption text-text-body">
          I&apos;ve read the{' '}
          <a 
            className="underline text-brand-primary hover:text-brand-primary/80" 
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
        <p className="text-caption text-red-600">{errors.consent}</p>
      )}

      {status === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-caption text-red-800">{serverMsg}</p>
        </div>
      )}

      <button 
        type="submit"
        disabled={status === 'submitting'}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
