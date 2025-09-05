'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import { Leaf, Clock, Phone, FileText, CheckCircle, AlertCircle, Loader2, Download, Eye, Camera, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import PhotoSubmissionForm from '@/components/PhotoSubmissionForm'
import FarmImageUpload from '@/components/FarmImageUpload'
import Image from 'next/image'
import Link from 'next/link'

type Hours = { day: 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun'; open?: string; close?: string }
type FarmForm = {
  name: string
  address: string
  county: string
  postcode: string
  lat?: string
  lng?: string
  website?: string
  email?: string
  phone?: string
  offerings?: string
  story?: string
}

const DAYS: Hours['day'][] = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function AddFarmPage() {
  // Kill-switch check
  const isFormEnabled = process.env.NEXT_PUBLIC_ADD_FORM_ENABLED === 'true'
  
  const [form, setForm] = useState<FarmForm>({ name: '', address: '', county: '', postcode: '' })
  const [hours, setHours] = useState<Hours[]>(DAYS.map(d => ({ day: d })))
  const [touched, setTouched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [farmImages, setFarmImages] = useState<File[]>([])
  
  // Hydration-safe flags/values
  const [draftId, setDraftId] = useState<string | null>(null)
  const [updatedAtClient, setUpdatedAtClient] = useState<string | null>(null)
  
  // Anti-spam
  const [hp, setHp] = useState('')                  // honeypot input (should stay empty)
  const startedAtRef = useRef<number | null>(null)  // when the user opened the page

  const slug = useMemo(() => slugify(form.name), [form.name])

  useEffect(() => {
    setDraftId(genId())
    setUpdatedAtClient(new Date().toISOString())
    // record start time (used to block instant bot submissions)
    if (typeof performance !== 'undefined') startedAtRef.current = performance.now()
  }, [])

  const json = useMemo(() => {
    // Use stable placeholders during SSR/first client render.
    const id = draftId ?? 'farm_pending0000'
    const lat = toNum(form.lat)
    const lng = toNum(form.lng)
    const offerings = csvToArray(form.offerings)
    const now = updatedAtClient ?? '1970-01-01T00:00:00.000Z'

    const hoursClean = hours
      .filter(h => (h.open && h.close))
      .map(h => ({ day: h.day, open: h.open!, close: h.close! }))

    const obj = {
      id,
      name: form.name.trim(),
      slug,
      location: {
        lat: isFiniteNum(lat) ? lat : 54.5,      // UK fallback centre
        lng: isFiniteNum(lng) ? lng : -2.5,
        address: form.address.trim(),
        county: form.county.trim(),
        postcode: form.postcode.trim()
      },
      contact: {
        website: urlish(form.website),
        email: emailish(form.email),
        phone: form.phone?.trim() || undefined
      },
      hours: hoursClean,
      offerings,
      story: (form.story || '').trim() || undefined,
      images: farmImages.map((file, index) => ({
        id: `farm_${Date.now()}_${index}`,
        name: file.name,
        size: file.size,
        type: file.type
      })),
      verified: false,
      verification: { method: 'owner_claim', timestamp: now },
      seasonal: [],
      updatedAt: now
    }

    // Remove undefineds for cleanliness
    return JSON.parse(JSON.stringify(obj))
  }, [form, hours, slug, draftId, updatedAtClient, farmImages])

  const valid = useMemo(() => {
    // simple requireds; full validation will happen server-side
    return Boolean(form.name && form.address && form.county && form.postcode)
  }, [form])

  const hasValidEmail = useMemo(() => {
    return !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  }, [form.email])

  const hasValidWebsite = useMemo(() => {
    return !form.website || /^https?:\/\/.+/.test(form.website)
  }, [form.website])

  // Early return for disabled form - must be after all hooks
  if (!isFormEnabled) {
    return (
      <main className="bg-background-canvas min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-text-heading mb-4">
            Form Temporarily Unavailable
          </h1>
          <p className="text-text-body mb-6">
            The farm submission form is currently being updated. Please check back later or contact us directly.
          </p>
          <Link href="/">
            <Button variant="primary">
              Return Home
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  function onChange<K extends keyof FarmForm>(key: K) {
    return (e: ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  function onHoursChange(day: Hours['day'], key: 'open'|'close') {
    return (e: ChangeEvent<HTMLInputElement>) =>
      setHours(prev => prev.map(h => h.day === day ? { ...h, [key]: e.target.value } : h))
  }

  async function handleSubmit() {
    setTouched(true)
    setSubmitStatus('idle')
    setSubmitMessage('')

    // Client-side validation with auto-focus
    if (!valid) {
      setSubmitMessage('Please complete all required fields marked *')
      // Auto-focus first invalid field
      if (!form.name) {
        document.getElementById('farm-name')?.focus()
      } else if (!form.address) {
        document.getElementById('farm-address')?.focus()
      } else if (!form.county) {
        document.getElementById('farm-county')?.focus()
      } else if (!form.postcode) {
        document.getElementById('farm-postcode')?.focus()
      }
      return
    }

    if (!hasValidEmail) {
      setSubmitMessage('Please enter a valid email address')
      return
    }

    if (!hasValidWebsite) {
      setSubmitMessage('Website must start with http:// or https://')
      return
    }

    // Anti-spam checks
    if (hp.trim() !== '') {
      setSubmitMessage('Submission blocked.')
      return
    }

    const now = typeof performance !== 'undefined' ? performance.now() : 0
    const elapsed = startedAtRef.current ? now - startedAtRef.current : 0
    if (elapsed < 2000) {
      setSubmitMessage('Please take a few seconds to fill in the form before submitting.')
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare submission data for new API
      const submissionData = {
        name: form.name.trim(),
        address: form.address.trim(),
        city: '', // Add city field to form if needed
        county: form.county.trim(),
        postcode: form.postcode.trim(),
        contactEmail: form.email?.trim() || '',
        website: form.website?.trim() || '',
        phone: form.phone?.trim() || '',
        lat: form.lat?.trim() || '',
        lng: form.lng?.trim() || '',
        offerings: form.offerings?.trim() || '',
        story: form.story?.trim() || '',
        hours: hours.filter(h => h.open && h.close).map(h => ({
          day: h.day,
          open: h.open!,
          close: h.close!
        })),
        _hp: hp, // honeypot
        ttf: Math.round(elapsed) // time to fill
      }
      
      const response = await fetch('/api/farms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setSubmitMessage(result.message || 'Farm shop submitted successfully!')
        
        // Show success message instead of redirecting
        setTimeout(() => {
          // Optionally redirect to success page or reset form
          window.location.href = '/submission-success'
        }, 3000)
      } else {
        setSubmitStatus('error')
        if (response.status === 429) {
          setSubmitMessage('Too many submissions. Please wait before submitting again.')
        } else if (response.status === 422) {
          setSubmitMessage('Please check your form data and try again.')
        } else {
          setSubmitMessage(result.error || 'Submission failed. Please try again.')
        }
      }
    } catch (error) {
      setSubmitStatus('error')
      setSubmitMessage('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDownload() {
    setTouched(true)
    setSubmitMessage('')

    // Anti-spam checks
    if (hp.trim() !== '') {
      setSubmitMessage('Download blocked.')
      return
    }

    const now = typeof performance !== 'undefined' ? performance.now() : 0
    const elapsed = startedAtRef.current ? now - startedAtRef.current : 0
    if (elapsed < 5000) {
      setSubmitMessage('Please take a few seconds to fill in the form before downloading.')
      return
    }

    if (!valid) {
      setSubmitMessage('Please complete all required fields before downloading.')
      return
    }

    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${slug || 'farm-shop'}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <main className="bg-background-canvas">
      {/* Enhanced Hero Section - PuredgeOS 3.0 Premium */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background-surface via-background-canvas to-background-surface">
        {/* Sophisticated animated background patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,194,178,0.04),transparent_50%)] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(212,255,79,0.03),transparent_50%)] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,31,35,0.02),transparent_70%)]" />
        
        {/* Floating accent elements */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-serum rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-32 right-20 w-1 h-1 bg-solar rounded-full opacity-40 animate-ping" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-serum rounded-full opacity-50 animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Hero Image Header */}
        <div data-header-invert className="relative w-full h-[80vh] min-h-[700px] max-h-[900px] overflow-hidden">
          <Image
            src="/add.jpg"
            alt="Beautiful farm landscape - Add your farm shop to our directory"
            fill
            className="object-cover object-center"
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={85}
          />
          {/* Professional Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
          {/* Subtle texture overlay for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]" />
          
          {/* Hero Content Overlay */}
          <div className="relative h-full flex items-center justify-center">
            <div className="text-center max-w-4xl mx-auto px-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
                <Leaf className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight text-white drop-shadow-lg">
                Add Your Farm
                <span className="block text-serum drop-shadow-lg">Shop</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-4 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
                Help customers find you, learn your story, and visit with confidence.
              </p>
              <p className="text-lg text-white/80 mb-8 leading-relaxed drop-shadow-md max-w-3xl mx-auto">
                Share the essentials—hours, offerings, and contact details—and we&apos;ll review and add you to our trusted UK-wide map.
              </p>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-8">
          {/* Additional Content Below Hero */}
          <div className="text-center mb-8">
            {/* You can add additional content here if needed */}
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section id="why-add" className="bg-gradient-to-b from-background-surface to-background-canvas py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-text-heading mb-4 flex items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-serum" />
              Why Add Your Farm Shop?
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto mb-12">
              Every farm has a story. By sharing yours, you invite customers to discover 
              the people, produce, and passion behind your work.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-background-surface to-background-canvas border border-border-default/30 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-serum/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Leaf className="w-8 h-8 text-serum" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-text-heading mb-3">Reach New Customers</h3>
              <p className="text-text-muted leading-relaxed">Appear in search results and on our interactive UK-wide map designed for farmers and food lovers.</p>
            </div>
            
            <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-background-surface to-background-canvas border border-border-default/30 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-serum/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Leaf className="w-8 h-8 text-serum" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-text-heading mb-3">Tell Your Story</h3>
              <p className="text-text-muted leading-relaxed">Share what makes your farm special and highlight your offerings in one trusted place.</p>
            </div>
          </div>
        </div>
      </section>

      <div id="add-form" className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Success/Error Messages */}
        {submitStatus === 'success' && (
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Submission Successful!</h3>
                <p className="text-green-700">{submitMessage}</p>
                <p className="text-green-600 text-sm mt-2">
                  We&apos;ll review your submission and email you if you provided an email address.
                </p>
                <div className="mt-4 flex gap-3">
                  <Link href="/map">
                    <Button variant="primary" size="sm">
                      View Map
                    </Button>
                  </Link>
                  <Button 
                    onClick={() => {
                      setSubmitStatus('idle')
                      setForm({ name: '', address: '', county: '', postcode: '' })
                      setHours(DAYS.map(d => ({ day: d })))
                      setTouched(false)
                      setFarmImages([])
                    }} 
                    variant="secondary" 
                    size="sm"
                  >
                    Submit Another
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Submission Failed</h3>
                <p className="text-red-700">{submitMessage}</p>
              </div>
            </div>
          </div>
        )}

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Main Form */}
        <div className="lg:col-span-2">
          {/* Honeypot (hidden from real users & assistive tech) */}
          <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
            <label>
              If you are human, leave this field empty
              <input
                tabIndex={-1}
                autoComplete="off"
                className="border px-2 py-1"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
              />
            </label>
          </div>

          {/* Basic Information */}
          <section className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-8 border border-border-default/30 shadow-2xl">
            <h2 className="text-xl font-heading font-semibold text-text-heading mb-6 flex items-center gap-3">
              <span className="w-2 h-2 bg-serum rounded-full"></span>
              <span>Basic Information</span>
            </h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="farm-name" className="block text-sm font-medium text-text-heading mb-2">
                  Farm shop name *
                </label>
                <input 
                  id="farm-name"
                  name="name"
                  className={`w-full rounded-lg border px-4 py-3 bg-background-canvas text-text-body focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-colors ${
                    touched && !form.name ? 'border-red-500' : 'border-border-default'
                  }`}
                  value={form.name} 
                  onChange={onChange('name')}
                  placeholder="e.g. Green Valley Farm Shop"
                  aria-invalid={touched && !form.name}
                  aria-describedby={touched && !form.name ? 'name-error' : undefined}
                />
                {touched && !form.name && (
                  <p id="name-error" className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Name is required</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="farm-address" className="block text-sm font-medium text-text-heading mb-2">
                  Address *
                </label>
                <input 
                  id="farm-address"
                  name="address"
                  className={`w-full rounded-lg border px-4 py-3 bg-background-canvas text-text-body focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-colors ${
                    touched && !form.address ? 'border-red-500' : 'border-border-default'
                  }`}
                  value={form.address} 
                  onChange={onChange('address')}
                  placeholder="e.g. 123 Farm Lane"
                  aria-invalid={touched && !form.address}
                  aria-describedby={touched && !form.address ? 'address-error' : undefined}
                />
                {touched && !form.address && (
                  <p id="address-error" className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Address is required</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="farm-county" className="block text-sm font-medium text-text-heading mb-2">
                    County *
                  </label>
                  <input 
                    id="farm-county"
                    name="county"
                    className={`w-full rounded-lg border px-4 py-3 bg-background-canvas text-text-body focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-colors ${
                      touched && !form.county ? 'border-red-500' : 'border-border-default'
                    }`}
                    value={form.county} 
                    onChange={onChange('county')}
                    placeholder="e.g. Devon"
                    aria-invalid={touched && !form.county}
                    aria-describedby={touched && !form.county ? 'county-error' : undefined}
                  />
                  {touched && !form.county && (
                    <p id="county-error" className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>County is required</span>
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="farm-postcode" className="block text-sm font-medium text-text-heading mb-2">
                    Postcode *
                  </label>
                  <input 
                    id="farm-postcode"
                    name="postcode"
                    className={`w-full rounded-lg border px-4 py-3 bg-background-canvas text-text-body focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-colors ${
                      touched && !form.postcode ? 'border-red-500' : 'border-border-default'
                    }`}
                    value={form.postcode} 
                    onChange={onChange('postcode')}
                    placeholder="e.g. EX1 1AA"
                    aria-invalid={touched && !form.postcode}
                    aria-describedby={touched && !form.postcode ? 'postcode-error' : undefined}
                  />
                  {touched && !form.postcode && (
                    <p id="postcode-error" className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>Postcode is required</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-heading mb-2">
                    Slug (auto-generated)
                  </label>
                  <input 
                    className="w-full rounded-lg border border-border-default px-4 py-3 bg-background-surface text-text-muted cursor-not-allowed" 
                    value={slug} 
                    readOnly 
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information */}
                  <section className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-8 border border-border-default/30 shadow-2xl mt-8">
          <h2 className="text-xl font-heading font-semibold text-text-heading mb-6 flex items-center gap-3">
            <span className="w-2 h-2 bg-serum rounded-full"></span>
            <span>Contact Information</span>
          </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-heading mb-2">
                  Website
                </label>
                <input 
                  className="w-full rounded-lg border border-border-default px-4 py-3 bg-background-canvas text-text-body focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-colors" 
                  value={form.website || ''} 
                  onChange={onChange('website')}
                  placeholder="https://..."
                />
                {touched && !hasValidWebsite && (
                  <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Website must start with http:// or https://</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-heading mb-2">
                  Email
                </label>
                <input 
                  className="w-full rounded-lg border border-border-default px-4 py-3 bg-background-canvas text-text-body focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-colors" 
                  value={form.email || ''} 
                  onChange={onChange('email')}
                  placeholder="hello@example.org"
                  type="email"
                />
                {touched && !hasValidEmail && (
                  <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Please enter a valid email address</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-heading mb-2">
                  Phone
                </label>
                <input 
                  className="w-full rounded-lg border border-border-default px-4 py-3 bg-background-canvas text-text-body focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-colors" 
                  value={form.phone || ''} 
                  onChange={onChange('phone')}
                  placeholder="+44 ..."
                />
              </div>
            </div>
          </section>

          {/* Additional Details */}
          <section className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-8 border border-border-default/30 shadow-2xl">
            <h2 className="text-xl font-heading font-semibold text-text-heading mb-6 flex items-center gap-3">
              <span className="w-2 h-2 bg-serum rounded-full"></span>
              <span>Additional Details</span>
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-heading mb-2">
                    Latitude (optional)
                  </label>
                  <input 
                    className="w-full rounded-lg border border-border-default px-4 py-3 bg-background-canvas text-text-body focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-colors" 
                    value={form.lat || ''} 
                    onChange={onChange('lat')}
                    placeholder="e.g. 51.507"
                    type="number"
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-heading mb-2">
                    Longitude (optional)
                  </label>
                  <input 
                    className="w-full rounded-lg border border-border-default px-4 py-3 bg-background-canvas text-text-body focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-colors" 
                    value={form.lng || ''} 
                    onChange={onChange('lng')}
                    placeholder="-0.127"
                    type="number"
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-heading mb-2">
                    Offerings (comma-separated)
                  </label>
                  <input 
                    className="w-full rounded-lg border border-border-default px-4 py-3 bg-background-canvas text-text-body focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-colors" 
                    value={form.offerings || ''} 
                    onChange={onChange('offerings')}
                    placeholder="Apples, Cheese, Eggs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-heading mb-2">
                  Farm story (optional)
                </label>
                <textarea 
                  className="w-full rounded-lg border border-border-default px-4 py-3 bg-background-canvas text-text-body focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-colors min-h-[100px] resize-vertical" 
                  value={form.story || ''} 
                  onChange={onChange('story')}
                  placeholder="Tell us about your farm, your story, what makes you special..."
                />
              </div>
            </div>
          </section>

          {/* Opening Hours */}
          <section className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-8 border border-border-default/30 shadow-2xl mt-8">
            <h2 className="text-xl font-heading font-semibold text-text-heading mb-6 flex items-center gap-3">
              <span className="w-2 h-2 bg-serum rounded-full"></span>
              <span>Opening Hours (24h format, optional)</span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hours.map(h => (
                <div key={h.day} className="flex items-center space-x-3 p-3 bg-background-canvas rounded-lg">
                  <span className="w-12 text-sm font-medium text-text-heading">{h.day}</span>
                  <input 
                    className="w-20 rounded border border-border-default px-2 py-1 text-sm bg-background-canvas text-text-body focus:outline-none focus:ring-1 focus:ring-serum" 
                    placeholder="09:00" 
                    value={h.open || ''} 
                    onChange={onHoursChange(h.day, 'open')}
                  />
                  <span className="text-sm text-text-muted">–</span>
                  <input 
                    className="w-20 rounded border border-border-default px-2 py-1 text-sm bg-background-canvas text-text-body focus:outline-none focus:ring-1 focus:ring-serum" 
                    placeholder="17:00" 
                    value={h.close || ''} 
                    onChange={onHoursChange(h.day, 'close')}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Farm Images */}
          <section className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-8 border border-border-default/30 shadow-2xl mt-8">
            <h2 className="text-xl font-heading font-semibold text-text-heading mb-6 flex items-center gap-3">
              <span className="w-2 h-2 bg-serum rounded-full"></span>
              <span>Farm Images (Optional)</span>
            </h2>
            
            <FarmImageUpload
              farmSlug={slug}
              onImagesChange={setFarmImages}
              maxImages={4}
            />
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 mt-8">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !valid}
              className="flex-1 group bg-gradient-to-r from-serum to-teal-500 text-black px-10 py-5 rounded-2xl font-bold text-lg hover:from-teal-500 hover:to-serum transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1"
              variant="primary"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Submit Farm Shop
                </>
              )}
            </Button>
            
            <Button
              onClick={handleDownload}
              disabled={!valid}
              variant="secondary"
              size="lg"
              className="group border-2 border-serum text-serum dark:text-serum px-10 py-5 rounded-2xl font-bold text-lg hover:bg-serum hover:text-black dark:hover:bg-serum dark:hover:text-black transition-all duration-300 backdrop-blur-sm bg-background-surface/30 hover:shadow-xl transform hover:scale-105 hover:-translate-y-1"
            >
              <Download className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Download JSON
            </Button>
          </div>

          {submitMessage && submitStatus === 'idle' && (
            <p className="text-sm text-red-600 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{submitMessage}</span>
            </p>
          )}
        </div>

        {/* Sidebar - Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 lg:top-24 max-h-[calc(100vh-3rem)] lg:max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="bg-gradient-to-br from-background-surface to-background-canvas rounded-3xl p-8 border border-border-default/30 shadow-2xl">
              <h3 className="text-lg font-heading font-semibold text-text-heading mb-4 flex items-center gap-3">
                <span className="w-2 h-2 bg-serum rounded-full"></span>
                <span>Preview</span>
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-background-canvas rounded-lg border border-border-default">
                  <h4 className="font-semibold text-text-heading mb-2">
                    {form.name || 'Farm Shop Name'}
                  </h4>
                  <p className="text-sm text-text-muted mb-2">
                    {form.address || 'Address'} • {form.county || 'County'}
                  </p>
                  <p className="text-sm text-text-muted">
                    {form.postcode || 'Postcode'}
                  </p>
                </div>

                {form.offerings && (
                  <div className="p-4 bg-background-canvas rounded-lg border border-border-default">
                    <h5 className="font-medium text-text-heading mb-2">Offerings</h5>
                    <div className="flex flex-wrap gap-1">
                      {csvToArray(form.offerings).map((offering, i) => (
                        <span key={i} className="px-2 py-1 bg-serum/10 text-serum text-xs rounded-full">
                          {offering}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <details className="rounded-lg border border-border-default overflow-hidden">
                  <summary className="cursor-pointer p-4 bg-background-canvas font-medium text-text-heading hover:bg-background-surface transition-colors">
                    JSON Preview
                  </summary>
                  <pre className="p-4 text-xs leading-relaxed overflow-auto max-h-64 bg-background-surface">
                    {JSON.stringify(json, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Submission Section */}
      {form.name && (
        <section className="mt-12 border-t border-border-default pt-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-text-heading font-heading mb-4">
              Add Photos (Optional)
            </h2>
            <p className="text-text-body max-w-2xl mx-auto">
              Help showcase your farm shop by adding photos. These will be reviewed before being added to your listing.
            </p>
          </div>
          <PhotoSubmissionForm 
            farmSlug={slug}
            farmName={form.name}
            onSuccess={() => {
              console.log('Photo submitted successfully for new farm shop')
            }}
          />
        </section>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center">
        <p className="text-sm text-text-muted">
          By submitting, you confirm the details are accurate and you have permission to share them.
        </p>
      </footer>
      </div>
    </main>
  )
}

/* -------- helpers (inline so it's beginner-friendly) -------- */

function genId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random()*chars.length)]
  return 'farm_' + s
}

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/(^-|-$)/g,'')
}

function toNum(s?: string) {
  if (!s) return NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

function isFiniteNum(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}

function csvToArray(s?: string) {
  if (!s) return []
  return s.split(',').map(x => x.trim()).filter(Boolean)
}

function urlish(s?: string) {
  if (!s) return undefined
  const v = s.trim()
  if (!v) return undefined
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}

function emailish(s?: string) {
  if (!s) return undefined
  const v = s.trim()
  if (!v) return undefined
  return /.+@.+\..+/.test(v) ? v : undefined
}
