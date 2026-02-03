import { CheckCircle } from 'lucide-react'
import { Download } from 'lucide-react'
import { Clock } from 'lucide-react'
import { Mail } from 'lucide-react'
import { Phone } from 'lucide-react'
import { MapPin } from 'lucide-react'
import { Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface SubmissionSuccessPageProps {
  searchParams: Promise<{
    farmId?: string
    farmName?: string
    farmAddress?: string
    farmCounty?: string
    imagesCount?: string
    contactEmail?: string
    contactPhone?: string
  }>
}

export default async function SubmissionSuccessPage({ searchParams }: SubmissionSuccessPageProps) {
  const params = await searchParams
  const {
    farmId = 'farm_123456789',
    farmName = 'Sample Farm Shop',
    farmAddress = '123 Farm Lane',
    farmCounty = 'Devon',
    imagesCount = '0',
    contactEmail,
    contactPhone
  } = params

  const handleDownloadPDF = () => {
    // Create a simple text-based "PDF" for now
    const content = `
Farm Shop Submission Confirmation

Farm ID: ${farmId}
Farm Name: ${farmName}
Address: ${farmAddress}
County: ${farmCounty}
Images Submitted: ${imagesCount}
Contact Email: ${contactEmail || 'Not provided'}
Contact Phone: ${contactPhone || 'Not provided'}

Submission Date: ${new Date().toLocaleDateString()}
Status: Pending Review

Thank you for submitting your farm shop to Farm Companion.
We will review your submission within 2-3 business days.
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `farm-submission-${farmId}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-heading mb-4">
            Submission Successful!
          </h1>
          <p className="text-body text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
            Thank you for submitting your farm shop to Farm Companion. 
            We&apos;ve received your information and will review it within 2-3 business days.
          </p>
        </div>

        {/* Submission Details */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 space-y-6">
            {/* Farm Details Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <h2 className="text-heading font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span>Farm Details</span>
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-caption font-medium text-slate-600 dark:text-slate-400 mb-1">Farm ID</label>
                    <p className="text-caption font-mono text-slate-900 dark:text-white bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 px-3 py-2 rounded border">
                      {farmId}
                    </p>
                  </div>
                  <div>
                    <label className="block text-caption font-medium text-slate-600 dark:text-slate-400 mb-1">Farm Name</label>
                    <p className="text-caption text-slate-900 dark:text-white">{farmName}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-caption font-medium text-slate-600 dark:text-slate-400 mb-1">Address</label>
                  <p className="text-caption text-slate-900 dark:text-white">{farmAddress}</p>
                </div>
                
                <div>
                  <label className="block text-caption font-medium text-slate-600 dark:text-slate-400 mb-1">County</label>
                  <p className="text-caption text-slate-900 dark:text-white">{farmCounty}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {(contactEmail || contactPhone) && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                <h2 className="text-heading font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span>Contact Information</span>
                </h2>
                
                <div className="space-y-3">
                  {contactEmail && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-caption text-slate-900 dark:text-white">{contactEmail}</span>
                    </div>
                  )}
                  {contactPhone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-caption text-slate-900 dark:text-white">{contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Images Submitted */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <h2 className="text-heading font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span>Images Submitted</span>
              </h2>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-caption font-medium text-slate-900 dark:text-white">
                    {imagesCount} image{imagesCount !== '1' ? 's' : ''} uploaded
                  </p>
                  <p className="text-small text-slate-600 dark:text-slate-400">
                    Images will be reviewed for quality and appropriateness
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Next Steps */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Next Steps */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                <h3 className="text-body font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span>What Happens Next?</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-small font-bold text-primary-600 dark:text-primary-400">1</span>
                    </div>
                    <div>
                      <p className="text-caption font-medium text-slate-900 dark:text-white">Review Process</p>
                      <p className="text-small text-slate-600 dark:text-slate-400">We&apos;ll review your submission within 2-3 business days</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-small font-bold text-primary-600 dark:text-primary-400">2</span>
                    </div>
                    <div>
                      <p className="text-caption font-medium text-slate-900 dark:text-white">Quality Check</p>
                      <p className="text-small text-slate-600 dark:text-slate-400">Verify information accuracy and image quality</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-small font-bold text-primary-600 dark:text-primary-400">3</span>
                    </div>
                    <div>
                      <p className="text-caption font-medium text-slate-900 dark:text-white">Go Live</p>
                      <p className="text-small text-slate-600 dark:text-slate-400">Your farm will appear on our map and directory</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                <h3 className="text-body font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleDownloadPDF}
                    variant="secondary"
                    size="sm"
                    className="w-full group"
                  >
                    <Download className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Download Submission
                  </Button>
                  
                  <Link href="/map">
                    <Button variant="secondary" size="sm" className="w-full">
                      View Farm Map
                    </Button>
                  </Link>
                  
                  <Link href="/contact">
                    <Button variant="secondary" size="sm" className="w-full">
                      Contact Support
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Status Tracking */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                <h3 className="text-body font-semibold text-slate-900 dark:text-white mb-4">Track Your Submission</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-caption text-slate-900 dark:text-white">Status</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-small rounded-full font-medium">
                      Pending Review
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-caption text-slate-900 dark:text-white">Submitted</span>
                    <span className="text-caption text-slate-600 dark:text-slate-400">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-caption text-slate-900 dark:text-white">Expected Review</span>
                    <span className="text-caption text-slate-600 dark:text-slate-400">
                      {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button variant="primary" size="lg">
                Return to Homepage
              </Button>
            </Link>
            
            <Link href="/map">
              <Button variant="secondary" size="lg">
                Explore Farm Map
              </Button>
            </Link>
          </div>
          
          <p className="text-caption text-slate-600 dark:text-slate-400">
            Need help? Contact us at{' '}
            <a href="mailto:hello@farmcompanion.co.uk" className="text-primary-600 dark:text-primary-400 hover:underline">
              hello@farmcompanion.co.uk
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
