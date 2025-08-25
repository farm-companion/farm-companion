'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import { Leaf, Clock, Phone, FileText, CheckCircle, AlertCircle, Loader2, Download, Eye, Camera } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import PhotoSubmissionForm from '@/components/PhotoSubmissionForm'
import FarmImageUpload from '@/components/FarmImageUpload'

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

  function onChange<K extends keyof FarmForm>(key: K) {
    return (e: ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  function onHoursChange(day: Hours['day'], key: 'open'|'close') {
    return (e: ChangeEvent<HTMLInputElement>) =>
      setHours(prev => prev.map(h => h.day === day ? { ...h, [key]: e.target.value } : h))
  }

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
  }, [form, hours, slug, draftId, updatedAtClient])

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

  async function handleSubmit() {
    setTouched(true)
    setSubmitStatus('idle')
    setSubmitMessage('')

    // Validation checks
    if (!valid) {
      setSubmitMessage('Please complete all required fields marked *')
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
    if (elapsed < 5000) {
      setSubmitMessage('Please take a few seconds to fill in the form before submitting.')
      return
    }

    setIsSubmitting(true)

    try {
      // Upload images first if any are selected
      const uploadedImageUrls: string[] = []
      
      if (farmImages.length > 0) {
        for (const image of farmImages) {
          try {
            const formData = new FormData()
            formData.append('file', image)
            formData.append('produceSlug', slug)
            formData.append('month', '1') // Default month for farm images
            formData.append('imagesCount', '1')
            
            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            })
            
            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json()
              uploadedImageUrls.push(uploadResult.url)
            }
          } catch (uploadError) {
            console.error('Image upload failed:', uploadError)
            // Continue with submission even if image upload fails
          }
        }
      }
      
      // Update JSON with uploaded image URLs
      const submissionData = {
        ...json,
        images: uploadedImageUrls.map((url, index) => ({
          id: `farm-image-${index}`,
          name: farmImages[index]?.name || `image-${index}`,
          size: farmImages[index]?.size || 0,
          type: farmImages[index]?.type || 'image/jpeg',
          url
        }))
      }
      
      const response = await fetch('/api/farms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      const result = await response.json()

      if (response.ok) {
        // Redirect to success page with submission details
        const successUrl = new URL('/submission-success', window.location.origin)
        successUrl.searchParams.set('farmId', result.farmId)
        successUrl.searchParams.set('farmName', form.name)
        successUrl.searchParams.set('farmAddress', form.address)
        successUrl.searchParams.set('farmCounty', form.county)
        successUrl.searchParams.set('imagesCount', farmImages.length.toString())
        if (form.email) successUrl.searchParams.set('contactEmail', form.email)
        if (form.phone) successUrl.searchParams.set('contactPhone', form.phone)
        
        window.location.href = successUrl.toString()
      } else {
        setSubmitStatus('error')
        setSubmitMessage(result.error || 'Submission failed. Please try again.')
      }
    } catch {
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
    <main className="mx-auto max-w-4xl px-6 py-12 bg-background-canvas">
      {/* Hero Section */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-serum/10 rounded-full mb-6">
          <Leaf className="w-8 h-8 text-serum" />
        </div>
        <h1 className="text-4xl font-bold text-text-heading font-heading mb-4">
          Add a Farm Shop
        </h1>
        <p className="text-lg text-text-body max-w-2xl mx-auto">
          Help us grow our directory of real food, real people, and real places. 
          Fill in the essentials and we&apos;ll review and add your farm shop to our map.
        </p>
      </header>

      {/* Success/Error Messages */}
      {submitStatus === 'success' && (
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Submission Successful!</h3>
              <p className="text-green-700">{submitMessage}</p>
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-8">
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
          <section className="bg-background-surface rounded-xl p-6 border border-border-default">
            <h2 className="text-xl font-semibold text-text-heading mb-6 flex items-center space-x-2">
              <Leaf className="w-5 h-5 text-serum" />
              <span>Basic Information</span>
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-heading mb-2">
                  Farm shop name *
                </label>
                <input 
                  className="w-full rounded-lg border border-border-default px-4 py-3 bg-background-canvas text-text-body focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-colors" 
                  value={form.name} 
                  onChange={onChange('name')}
                  placeholder="e.g. Green Valley Farm Shop"
                />
                {touched && !form.name && (
                  <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Name is required</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-heading mb-2">
                  Address *
                </label>
                <input 
                  className="w-full rounded-lg border border-border-default px-4 py-3 bg-background-canvas text-text-body focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-colors" 
                  value={form.address} 
                  onChange={onChange('address')}
                  placeholder="e.g. 123 Farm Lane"
                />
                {touched && !form.address && (
                  <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Address is required</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-heading mb-2">
                    County *
                  </label>
                  <input 
                    className="w-full rounded-lg border border-border-default px-4 py-3 bg-background-canvas text-text-body focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-colors" 
                    value={form.county} 
                    onChange={onChange('county')}
                    placeholder="e.g. Devon"
                  />
                  {touched && !form.county && (
                    <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>County is required</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-heading mb-2">
                    Postcode *
                  </label>
                  <input 
                    className="w-full rounded-lg border border-border-default px-4 py-3 bg-background-canvas text-text-body focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-colors" 
                    value={form.postcode} 
                    onChange={onChange('postcode')}
                    placeholder="e.g. EX1 1AA"
                  />
                  {touched && !form.postcode && (
                    <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
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
          <section className="bg-background-surface rounded-xl p-6 border border-border-default">
            <h2 className="text-xl font-semibold text-text-heading mb-6 flex items-center space-x-2">
              <Phone className="w-5 h-5 text-serum" />
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
          <section className="bg-background-surface rounded-xl p-6 border border-border-default">
            <h2 className="text-xl font-semibold text-text-heading mb-6 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-serum" />
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
          <section className="bg-background-surface rounded-xl p-6 border border-border-default">
            <h2 className="text-xl font-semibold text-text-heading mb-6 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-serum" />
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
          <section className="bg-background-surface rounded-xl p-6 border border-border-default">
            <h2 className="text-xl font-semibold text-text-heading mb-6 flex items-center space-x-2">
              <Camera className="w-5 h-5 text-serum" />
              <span>Farm Images (Optional)</span>
            </h2>
            
            <FarmImageUpload
              farmSlug={slug}
              farmName={form.name}
              onImagesChange={setFarmImages}
              maxImages={4}
            />
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !valid}
              className="flex-1 group"
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
              className="group"
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
          <div className="sticky top-8">
            <div className="bg-background-surface rounded-xl p-6 border border-border-default">
              <h3 className="text-lg font-semibold text-text-heading mb-4 flex items-center space-x-2">
                <Eye className="w-5 h-5 text-serum" />
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
                  <summary className="cursor-pointer p-4 bg-background-canvas font-medium text-text-heading">
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
