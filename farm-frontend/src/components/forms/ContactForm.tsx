'use client'
import { useRef, useState } from 'react'
import { z } from 'zod'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'

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
  const [shake, setShake] = useState(false)
  const started = useRef<number>(performance.now())
  const hpRef = useRef<HTMLInputElement>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrors({})
    setServerMsg('')
    setShake(false)

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
      setShake(true)
      setTimeout(() => setShake(false), 600)

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
        setShake(true)
        setTimeout(() => setShake(false), 600)
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
      setShake(true)
      setTimeout(() => setShake(false), 600)
      setServerMsg('Network error. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-serum/30 bg-gradient-to-br from-serum/5 via-serum/10 to-solar/5 p-8 text-center">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,194,178,0.15),transparent_60%)]" />

        {/* Success icon with animation */}
        <div className="relative mb-6 inline-flex">
          <div className="animate-success-pop flex h-20 w-20 items-center justify-center rounded-full bg-serum/20">
            <CheckCircle className="h-10 w-10 text-serum" strokeWidth={1.5} />
          </div>
          {/* Celebration rings */}
          <div className="absolute inset-0 animate-ping rounded-full bg-serum/20" style={{ animationDuration: '1.5s', animationIterationCount: '1' }} />
        </div>

        <h2 className="relative mb-3 font-heading text-2xl font-semibold text-text-heading">
          Message sent
        </h2>
        <p className="relative mb-6 text-text-body">
          Thank you for reaching out. We have received your message and will get back to you soon.
        </p>

        <div className="relative inline-flex items-center gap-2 rounded-full bg-serum/10 px-4 py-2 text-sm text-serum">
          <span className="h-2 w-2 animate-pulse rounded-full bg-serum" />
          Typically responds within 24-48 hours
        </div>
      </div>
    )
  }

  const inputBase = `
    w-full rounded-xl border px-4 py-3.5 text-sm
    bg-background-surface text-text-body
    transition-all duration-200 ease-out
    placeholder:text-text-muted
    hover:border-brand-primary/50 hover:bg-background-canvas
    focus:border-brand-primary focus:bg-background-canvas
    focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:ring-offset-0
  `

  return (
    <form
      className={`space-y-5 ${shake ? 'animate-shake' : ''}`}
      onSubmit={onSubmit}
      noValidate
    >
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

      <div className="group">
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-text-body transition-colors group-focus-within:text-brand-primary">
          Name <span className="text-brand-primary">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className={`${inputBase} ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border-default'}`}
          placeholder="Your name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'err-name' : undefined}
        />
        {errors.name && (
          <p id="err-name" className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {errors.name}
          </p>
        )}
      </div>

      <div className="group">
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-text-body transition-colors group-focus-within:text-brand-primary">
          Email <span className="text-brand-primary">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={`${inputBase} ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border-default'}`}
          placeholder="your.email@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'err-email' : undefined}
        />
        {errors.email && (
          <p id="err-email" className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {errors.email}
          </p>
        )}
      </div>

      <div className="group">
        <label htmlFor="topic" className="mb-2 block text-sm font-medium text-text-body transition-colors group-focus-within:text-brand-primary">
          Topic <span className="text-brand-primary">*</span>
        </label>
        <select
          id="topic"
          name="topic"
          className={`${inputBase} border-border-default cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
        >
          <option value="general">General Inquiry</option>
          <option value="bug">Bug Report</option>
          <option value="data-correction">Data Correction</option>
          <option value="partnership">Partnership</option>
        </select>
      </div>

      <div className="group">
        <label htmlFor="message" className="mb-2 block text-sm font-medium text-text-body transition-colors group-focus-within:text-brand-primary">
          Message <span className="text-brand-primary">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className={`${inputBase} resize-none ${errors.message ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border-default'}`}
          placeholder="Tell us how we can help..."
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'err-message' : undefined}
        />
        {errors.message && (
          <p id="err-message" className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {errors.message}
          </p>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div className="relative flex h-5 w-5 items-center">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            required
            className="h-5 w-5 cursor-pointer rounded border-border-default text-brand-primary transition-colors focus:ring-2 focus:ring-brand-primary/20 focus:ring-offset-0"
            aria-invalid={!!errors.consent}
          />
        </div>
        <label htmlFor="consent" className="text-sm leading-tight text-text-body">
          I have read and agree to the{' '}
          <a
            className="font-medium text-brand-primary underline-offset-2 transition-colors hover:underline"
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            privacy notice
          </a>
          <span className="text-brand-primary"> *</span>
        </label>
      </div>
      {errors.consent && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {errors.consent}
        </p>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-800 dark:text-red-200">{serverMsg}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="group relative w-full overflow-hidden rounded-xl bg-serum px-6 py-4 text-base font-semibold text-black shadow-lg shadow-serum/25 transition-all duration-200 hover:bg-serum/90 hover:shadow-xl hover:shadow-serum/30 focus:outline-none focus:ring-2 focus:ring-serum focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
      >
        {/* Button shine effect */}
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

        <span className="relative flex items-center justify-center gap-2">
          {status === 'submitting' ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending...
            </>
          ) : (
            'Send message'
          )}
        </span>
      </button>
    </form>
  )
}
