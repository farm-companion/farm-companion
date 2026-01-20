'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function AdminDocumentationPage() {
  const [activeSection, setActiveSection] = useState('quick-start')

  useEffect(() => {
    const observerOptions = {
      rootMargin: '-20% 0px -35% 0px',
      threshold: 0
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id')
          if (id) {
            setActiveSection(id)
          }
        }
      })
    }, observerOptions)

    // Observe all sections - with proper null checking
    const sections = document.querySelectorAll('section[id]')
    if (sections.length > 0) {
      sections.forEach((section) => {
        if (section && section instanceof Element) {
          observer.observe(section)
        }
      })
    }

    return () => {
      if (sections.length > 0) {
        sections.forEach((section) => {
          if (section && section instanceof Element) {
            observer.unobserve(section)
          }
        })
      }
      observer.disconnect()
    }
  }, [])

  const navItems = [
    { id: 'quick-start', label: 'Quick Start' },
    { id: 'authentication', label: 'Authentication' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'photo-management', label: 'Photo Management' },
    { id: 'claims-system', label: 'Claims System' },
    { id: 'security', label: 'Security' },
    { id: 'api-reference', label: 'API Reference' },
    { id: 'troubleshooting', label: 'Troubleshooting' },
    { id: 'best-practices', label: 'Best Practices' },
    { id: 'faq', label: 'FAQ' }
  ]

  return (
    <div className="min-h-screen bg-background-surface">
      {/* Hero Section - PuredgeOS 3.0 Compliant */}
      <div className="relative overflow-hidden bg-background-canvas">
        {/* Sophisticated background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-serum/5 via-transparent to-solar/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,194,178,0.03),transparent_50%)]" />
        
        <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-display font-heading font-bold mb-6 text-text-heading">
              Farm Companion Admin Documentation
            </h1>
            <p className="text-heading mb-8 max-w-3xl mx-auto text-text-muted">
              Your complete guide to managing the UK&apos;s premium farm shop platform. 
              From authentication to advanced troubleshooting, everything you need to know.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/admin"
                className="bg-serum text-black px-6 py-3 rounded-lg font-semibold hover:bg-serum/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-serum focus:ring-offset-2"
              >
                Go to Admin Dashboard
              </Link>
              <Link 
                href="#quick-start"
                className="border-2 border-serum text-serum px-6 py-3 rounded-lg font-semibold hover:bg-serum hover:text-black transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-serum focus:ring-offset-2"
              >
                Quick Start Guide
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="sticky top-8 space-y-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Table of Contents</h3>
                <ul className="space-y-2 text-body">
                  {navItems.map((item) => (
                    <li key={item.id}>
                      <a 
                        href={`#${item.id}`} 
                        className={`block py-1 px-2 rounded transition-colors ${
                          activeSection === item.id 
                            ? 'text-serum bg-serum/10 font-medium' 
                            : 'text-gray-600 dark:text-gray-400 hover:text-serum hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Quick Start Section */}
            <section id="quick-start" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-display font-bold text-gray-900 dark:text-white mb-6">
                Quick Start Guide
              </h2>
              
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-body text-gray-600 dark:text-gray-400 mb-6">
                  Get up and running with Farm Companion admin in under 5 minutes.
                </p>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
                  <h3 className="text-heading font-semibold text-green-900 dark:text-green-100 mb-2">
                    Essential Information
                  </h3>
                  <ul className="text-green-800 dark:text-green-200 space-y-1">
                    <li><strong>Admin URL:</strong> <code className="bg-white dark:bg-gray-700 text-green-900 dark:text-green-100 px-2 py-1 rounded border border-green-200 dark:border-green-600">https://www.farmcompanion.co.uk/admin</code></li>
                    <li><strong>Login Email:</strong> <code className="bg-white dark:bg-gray-700 text-green-900 dark:text-green-100 px-2 py-1 rounded border border-green-200 dark:border-green-600">hello@farmcompanion.co.uk</code></li>
                    <li><strong>Session Duration:</strong> 24 hours</li>
                    <li><strong>Support:</strong> Available 24/7 via admin panel</li>
                  </ul>
                </div>

                <h3>Step 1: Access the Admin Panel</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Navigate to <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">https://www.farmcompanion.co.uk/admin</code></li>
                  <li>You&apos;ll be redirected to the login page if not authenticated</li>
                  <li>Enter your admin credentials</li>
                </ol>

                <h3>Step 2: Review Dashboard</h3>
                <p>Upon login, you&apos;ll see the main dashboard with:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Overview statistics (total photos, pending reviews, claims)</li>
                  <li>Recent activity feed</li>
                  <li>Quick action buttons</li>
                  <li>Navigation menu</li>
                </ul>

                <h3>Step 3: Start Managing Content</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Photo Management</h4>
                    <p className="text-blue-800 dark:text-blue-200 text-caption">
                      Review and approve user-submitted photos for farm listings
                    </p>
                    <Link href="/admin/photos" className="text-blue-600 dark:text-blue-400 text-caption hover:underline">
                      Go to Photos →
                    </Link>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Claims Processing</h4>
                    <p className="text-yellow-800 dark:text-yellow-200 text-caption">
                      Handle farm ownership claims and verification requests
                    </p>
                    <Link href="/admin/claims" className="text-yellow-600 dark:text-yellow-400 text-caption hover:underline">
                      Go to Claims →
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Authentication Section */}
            <section id="authentication" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-display font-bold text-gray-900 dark:text-white mb-6">
                Authentication & Security
              </h2>
              
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-body text-gray-600 dark:text-gray-400 mb-6">
                  Secure access to the Farm Companion admin panel with enterprise-grade security.
                </p>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-8">
                  <h3 className="text-heading font-semibold text-red-900 dark:text-red-100 mb-2">
                    ⚠️ Security Notice
                  </h3>
                  <p className="text-red-800 dark:text-red-200">
                    Never share your admin credentials. Use only on secure networks and log out after each session.
                  </p>
                </div>

                <h3>Login Process</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold mb-3">Required Credentials</h4>
                  <div className="space-y-2">
                    <div><strong>Email:</strong> <code className="bg-white dark:bg-gray-600 px-2 py-1 rounded">hello@farmcompanion.co.uk</code></div>
                    <div><strong>Password:</strong> <code className="bg-white dark:bg-gray-600 px-2 py-1 rounded">mifxa2-ziwdyc-vEbkov</code></div>
                  </div>
                </div>

                <h3>Security Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🔒 Session Management</h4>
                    <ul className="text-blue-800 dark:text-blue-200 text-body space-y-1">
                      <li>24-hour session duration</li>
                      <li>Automatic logout on inactivity</li>
                      <li>HTTP-only secure cookies</li>
                      <li>CSRF protection</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">🛡️ Access Control</h4>
                    <ul className="text-green-800 dark:text-green-200 text-body space-y-1">
                      <li>Rate limiting on login attempts</li>
                      <li>Environment variable credentials</li>
                      <li>Secure password hashing</li>
                      <li>Input validation & sanitization</li>
                    </ul>
                  </div>
                </div>

                <h3>Session Management</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold mb-3">Session Details</h4>
                  <ul className="space-y-2">
                    <li><strong>Duration:</strong> 24 hours from last activity</li>
                    <li><strong>Renewal:</strong> Automatic on page interaction</li>
                    <li><strong>Logout:</strong> Manual via logout button or automatic on expiry</li>
                    <li><strong>Security:</strong> Invalidated on password change</li>
                  </ul>
                </div>

                <h3>Troubleshooting Login Issues</h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">Common Problems</h4>
                  <div className="space-y-3">
                    <div>
                      <strong className="text-yellow-900 dark:text-yellow-100">Invalid Credentials</strong>
                      <p className="text-yellow-800 dark:text-yellow-200 text-caption mt-1">
                        Double-check email and password. Ensure no extra spaces.
                      </p>
                    </div>
                    <div>
                      <strong className="text-yellow-900 dark:text-yellow-100">Session Expired</strong>
                      <p className="text-yellow-800 dark:text-yellow-200 text-caption mt-1">
                        Re-login to refresh your session. Sessions expire after 24 hours.
                      </p>
                    </div>
                    <div>
                      <strong className="text-yellow-900 dark:text-yellow-100">Browser Issues</strong>
                      <p className="text-yellow-800 dark:text-yellow-200 text-caption mt-1">
                        Clear cookies and cache, or try incognito/private mode.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Dashboard Section */}
            <section id="dashboard" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-display font-bold text-gray-900 dark:text-white mb-6">
                Admin Dashboard
              </h2>
              
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-body text-gray-600 dark:text-gray-400 mb-6">
                  Your command center for managing all aspects of the Farm Companion platform.
                </p>

                <h3>Dashboard Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                    <div className="text-heading font-bold text-blue-600 dark:text-blue-400">Photos</div>
                    <div className="text-heading font-semibold text-blue-900 dark:text-blue-100">Total Photos</div>
                    <div className="text-caption text-blue-700 dark:text-blue-300">All photos in system</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                    <div className="text-heading font-bold text-yellow-600 dark:text-yellow-400">Reviews</div>
                    <div className="text-heading font-semibold text-yellow-900 dark:text-yellow-100">Pending Reviews</div>
                    <div className="text-caption text-yellow-700 dark:text-yellow-300">Awaiting approval</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                    <div className="text-heading font-bold text-green-600 dark:text-green-400">Claims</div>
                    <div className="text-heading font-semibold text-green-900 dark:text-green-100">Pending Claims</div>
                    <div className="text-caption text-green-700 dark:text-green-300">Ownership requests</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                    <div className="text-heading font-bold text-purple-600 dark:text-purple-400">Activity</div>
                    <div className="text-heading font-semibold text-purple-900 dark:text-purple-100">Recent Activity</div>
                    <div className="text-caption text-purple-700 dark:text-purple-300">Latest actions</div>
                  </div>
                </div>

                <h3>Navigation Menu</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 text-caption font-semibold">D</span>
                      </div>
                      <div>
                        <div className="font-semibold">Dashboard</div>
                        <div className="text-caption text-gray-600 dark:text-gray-400">Main overview and statistics</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 text-caption font-semibold">P</span>
                      </div>
                      <div>
                        <div className="font-semibold">Photos</div>
                        <div className="text-caption text-gray-600 dark:text-gray-400">Photo management and review</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded flex items-center justify-center">
                        <span className="text-yellow-600 dark:text-yellow-400 text-caption font-semibold">C</span>
                      </div>
                      <div>
                        <div className="font-semibold">Claims</div>
                        <div className="text-caption text-gray-600 dark:text-gray-400">Ownership claim processing</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded flex items-center justify-center">
                        <span className="text-purple-600 dark:text-purple-400 text-caption font-semibold">G</span>
                      </div>
                      <div>
                        <div className="font-semibold">Documentation</div>
                        <div className="text-caption text-gray-600 dark:text-gray-400">This comprehensive guide</div>
                      </div>
                    </div>
                  </div>
                </div>

                <h3>Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Review Pending Photos</h4>
                    <p className="text-caption text-gray-600 dark:text-gray-400 mb-3">
                      Quickly access photos awaiting approval
                    </p>
                    <Link href="/admin/photos" className="text-serum hover:text-teal-700 dark:text-teal-400 text-caption">
                      Go to Photos →
                    </Link>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Process Claims</h4>
                    <p className="text-caption text-gray-600 dark:text-gray-400 mb-3">
                      Handle farm ownership verification requests
                    </p>
                    <Link href="/admin/claims" className="text-serum hover:text-teal-700 dark:text-teal-400 text-caption">
                      Go to Claims →
                    </Link>
                  </div>
                </div>

                <h3>Recent Activity Feed</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <p className="text-caption text-gray-600 dark:text-gray-400 mb-4">
                    The dashboard shows your recent actions and system updates:
                  </p>
                  <ul className="space-y-2 text-body">
                    <li>• Photo approvals and rejections</li>
                    <li>• Claim processing decisions</li>
                    <li>• System notifications</li>
                    <li>• User activity summaries</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Photo Management Section */}
            <section id="photo-management" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-display font-bold text-gray-900 dark:text-white mb-6">
                Photo Management System
              </h2>
              
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-body text-gray-600 dark:text-gray-400 mb-6">
                  Comprehensive guide to managing user-submitted photos for farm listings.
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
                                      <h3 className="text-heading font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Photo Review Workflow
                    </h3>
                  <ol className="text-blue-800 dark:text-blue-200 text-body space-y-2">
                    <li><strong>Submission:</strong> Users submit photos via the main site</li>
                    <li><strong>Pending Review:</strong> Photos appear in admin panel under &quot;Pending&quot;</li>
                    <li><strong>Review Process:</strong> Admins evaluate quality, relevance, and appropriateness</li>
                    <li><strong>Decision:</strong> Approve, reject, or request changes</li>
                    <li><strong>Publication:</strong> Approved photos appear on the farm&apos;s page</li>
                  </ol>
                </div>

                <h3>Photo Review Criteria</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">✅ Approval Criteria</h4>
                    <ul className="text-green-800 dark:text-green-200 text-body space-y-2">
                      <li>High quality and clear resolution</li>
                      <li>Relevant to the farm listing</li>
                      <li>Appropriate content for all audiences</li>
                      <li>Accurate representation of the business</li>
                      <li>Proper lighting and composition</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3">❌ Rejection Reasons</h4>
                    <ul className="text-red-800 dark:text-red-200 text-body space-y-2">
                      <li>Blurry or low-quality images</li>
                      <li>Inappropriate or offensive content</li>
                      <li>Copyrighted material without permission</li>
                      <li>Unrelated to the farm business</li>
                      <li>Duplicate or very similar to existing photos</li>
                    </ul>
                  </div>
                </div>

                <h3>Admin Actions</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">✅ Approve</h4>
                      <p className="text-caption text-gray-600 dark:text-gray-400">
                        Accept photo for publication on the farm&apos;s page
                      </p>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">❌ Reject</h4>
                      <p className="text-caption text-gray-600 dark:text-gray-400">
                        Decline photo with specific reason provided
                      </p>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">🔄 Request Changes</h4>
                      <p className="text-caption text-gray-600 dark:text-gray-400">
                        Ask user to modify photo before approval
                      </p>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">🗑️ Delete</h4>
                      <p className="text-caption text-gray-600 dark:text-gray-400">
                        Remove photo permanently (with 4-hour recovery window)
                      </p>
                    </div>
                  </div>
                </div>

                <h3>Deletion System</h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">🕐 Recovery Window</h4>
                  <div className="space-y-3">
                    <div>
                      <strong className="text-yellow-900 dark:text-yellow-100">Soft Delete:</strong>
                      <p className="text-yellow-800 dark:text-yellow-200 text-caption mt-1">
                        Photos are marked as deleted but not immediately removed from the system
                      </p>
                    </div>
                    <div>
                      <strong className="text-yellow-900 dark:text-yellow-100">4-Hour Recovery:</strong>
                      <p className="text-yellow-800 dark:text-yellow-200 text-caption mt-1">
                        Accidental deletions can be recovered within 4 hours
                      </p>
                    </div>
                    <div>
                      <strong className="text-yellow-900 dark:text-yellow-100">Permanent Removal:</strong>
                      <p className="text-yellow-800 dark:text-yellow-200 text-caption mt-1">
                        After 4 hours, photos are permanently deleted from the system
                      </p>
                    </div>
                  </div>
                </div>

                <h3>Email Notifications</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold mb-3">Automated Email System</h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 dark:text-green-400 text-small">✓</span>
                      </div>
                      <div>
                        <strong>Photo Approval:</strong>
                        <p className="text-caption text-gray-600 dark:text-gray-400 mt-1">
                          Users receive confirmation when their photos are approved
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-600 dark:text-red-400 text-small">✗</span>
                      </div>
                      <div>
                        <strong>Photo Rejection:</strong>
                        <p className="text-caption text-gray-600 dark:text-gray-400 mt-1">
                          Users receive feedback when photos are rejected with specific reasons
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-yellow-600 dark:text-yellow-400 text-small">!</span>
                      </div>
                      <div>
                        <strong>Deletion Requests:</strong>
                        <p className="text-caption text-gray-600 dark:text-gray-400 mt-1">
                          Admins are notified when users request photo removal
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-600 dark:text-purple-400 text-small">⏰</span>
                      </div>
                      <div>
                        <strong>Recovery Reminders:</strong>
                        <p className="text-caption text-gray-600 dark:text-gray-400 mt-1">
                          System reminders about photos approaching permanent deletion
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <h3>Best Practices for Photo Review</h3>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">📋 Review Guidelines</h4>
                  <ul className="text-green-800 dark:text-green-200 space-y-2">
                    <li><strong>Timeliness:</strong> Review photos within 24 hours of submission</li>
                    <li><strong>Consistency:</strong> Apply the same standards across all reviews</li>
                    <li><strong>Feedback:</strong> Provide constructive feedback for rejected photos</li>
                    <li><strong>Quality:</strong> Ensure photos meet minimum quality standards</li>
                    <li><strong>Relevance:</strong> Verify photos are relevant to the farm listing</li>
                    <li><strong>Appropriateness:</strong> Check for inappropriate or copyrighted content</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Claims System Section */}
            <section id="claims-system" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-display font-bold text-gray-900 dark:text-white mb-6">
                Claims Management System
              </h2>
              
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-body text-gray-600 dark:text-gray-400 mb-6">
                  Detailed guide on handling farm ownership claims and verification requests.
                </p>

                <h3>Claim Submission Process</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
                                     <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Claim Form</h4>
                  <p className="text-blue-800 dark:text-blue-200 text-caption">
                    Users can submit a claim form on the farm&apos;s page, providing evidence of ownership.
                  </p>
                </div>

                <h3>Claim Review Process</h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
                                     <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">Verification Steps</h4>
                  <ul className="text-yellow-800 dark:text-yellow-200 text-body space-y-2">
                    <li>Admins review the claim form and supporting evidence</li>
                    <li>Verify the user&apos;s identity and ownership</li>
                    <li>Check for duplicate claims</li>
                    <li>Assess the legitimacy of the claim</li>
                  </ul>
                </div>

                <h3>Decision Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">✅ Approved</h4>
                    <p className="text-green-800 dark:text-green-200 text-caption">
                      The user&apos;s claim is verified, and they are granted ownership of the farm.
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3">❌ Rejected</h4>
                    <p className="text-red-800 dark:text-red-200 text-caption">
                      The claim is deemed invalid or fraudulent, and ownership remains with the original farm.
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">🔄 Pending</h4>
                    <p className="text-purple-800 dark:text-purple-200 text-caption">
                      Further investigation or additional evidence is required.
                    </p>
                  </div>
                </div>

                <h3>Admin Actions for Claims</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">✅ Approve</h4>
                      <p className="text-caption text-gray-600 dark:text-gray-400">
                        Grant ownership to the claimer.
                      </p>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">❌ Reject</h4>
                      <p className="text-caption text-gray-600 dark:text-gray-400">
                        Deny the claim and explain the reason.
                      </p>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">🔄 Request Changes</h4>
                      <p className="text-caption text-gray-600 dark:text-gray-400">
                        Ask the claimer to provide more evidence or clarification.
                      </p>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">🗑️ Delete</h4>
                      <p className="text-caption text-gray-600 dark:text-gray-400">
                        Remove a claim permanently if it&apos;s fraudulent or malicious.
                      </p>
                    </div>
                  </div>
                </div>

                <h3>Email Notifications for Claims</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold mb-3">Automated Email System</h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 dark:text-green-400 text-small">✓</span>
                      </div>
                      <div>
                        <strong>Claim Approved:</strong>
                        <p className="text-caption text-gray-600 dark:text-gray-400 mt-1">
                          Claimers receive notification of approval.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-600 dark:text-red-400 text-small">✗</span>
                      </div>
                      <div>
                        <strong>Claim Rejected:</strong>
                        <p className="text-caption text-gray-600 dark:text-gray-400 mt-1">
                          Claimers receive notification of rejection and reason.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-600 dark:text-purple-400 text-small">⏰</span>
                      </div>
                      <div>
                        <strong>Claim Pending:</strong>
                        <p className="text-caption text-gray-600 dark:text-gray-400 mt-1">
                          Claimers receive reminders about pending claims.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <h3>Best Practices for Claims</h3>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">📋 Review Guidelines</h4>
                  <ul className="text-green-800 dark:text-green-200 space-y-2">
                    <li><strong>Timeliness:</strong> Review claims within 24 hours of submission</li>
                    <li><strong>Consistency:</strong> Apply the same standards across all claims</li>
                    <li><strong>Feedback:</strong> Provide clear and constructive feedback</li>
                    <li><strong>Verification:</strong> Thoroughly verify all claims</li>
                    <li><strong>Duplicates:</strong> Check for duplicate claims</li>
                    <li><strong>Legitimacy:</strong> Assess the legitimacy of all claims</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section id="security" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-display font-bold text-gray-900 dark:text-white mb-6">
                Security
              </h2>
              
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-body text-gray-600 dark:text-gray-400 mb-6">
                  Enterprise-grade security measures to protect your admin panel and data.
                </p>

                <h3>Authentication & Session Security</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">🔒 Secure Login</h4>
                  <ul className="text-blue-800 dark:text-blue-200 text-body space-y-2">
                    <li>HTTPS-only for all admin requests</li>
                    <li>Rate limiting on login attempts</li>
                    <li>Session duration: 24 hours</li>
                    <li>Automatic logout on inactivity</li>
                    <li>HTTP-only secure cookies</li>
                    <li>CSRF protection</li>
                  </ul>
                </div>

                <h3>Data Encryption</h3>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">🔐 Sensitive Data</h4>
                  <ul className="text-green-800 dark:text-green-200 text-body space-y-2">
                    <li>All passwords are securely hashed</li>
                    <li>API keys and tokens are encrypted</li>
                    <li>Sensitive user data (e.g., email, phone) is masked</li>
                    <li>Database encryption (where applicable)</li>
                  </ul>
                </div>

                <h3>Access Control & Role-Based Permissions</h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">🛡️ Role-Based Access</h4>
                  <ul className="text-yellow-800 dark:text-yellow-200 text-body space-y-2">
                    <li>Different roles (Admin, Moderator, Viewer)</li>
                    <li>Fine-grained permissions for actions</li>
                    <li>Ability to manage other users</li>
                    <li>Audit logs for all actions</li>
                  </ul>
                </div>

                <h3>Input Validation & Sanitization</h3>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-8">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3">🛠️ Input Security</h4>
                  <ul className="text-red-800 dark:text-red-200 text-body space-y-2">
                    <li>Input validation for all forms</li>
                    <li>Sanitization of user-generated content</li>
                    <li>XSS protection</li>
                    <li>SQL injection prevention</li>
                  </ul>
                </div>

                <h3>Audit Logs & Monitoring</h3>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-8">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">🔍 Monitoring</h4>
                  <ul className="text-purple-800 dark:text-purple-200 text-body space-y-2">
                    <li>Real-time activity monitoring</li>
                    <li>Login attempts and failures</li>
                    <li>API usage and errors</li>
                    <li>Data access and modification</li>
                    <li>Audit trails for all actions</li>
                  </ul>
                </div>

                <h3>Incident Response</h3>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3">🚨 Incident Response</h4>
                  <ul className="text-red-800 dark:text-red-200 text-body space-y-2">
                    <li>24/7 security operations center</li>
                    <li>Immediate alerts for suspicious activity</li>
                    <li>Thorough investigation of incidents</li>
                    <li>Quick remediation of vulnerabilities</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* API Reference Section */}
            <section id="api-reference" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-display font-bold text-gray-900 dark:text-white mb-6">
                API Reference
              </h2>
              
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-body text-gray-600 dark:text-gray-400 mb-6">
                  Comprehensive guide to using our API for automation and integration.
                </p>

                <h3>Authentication</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">🔑 API Keys</h4>
                  <p className="text-blue-800 dark:text-blue-200 text-caption">
                    API keys are used for authentication. They are generated in the admin panel.
                  </p>
                  <div className="mt-4">
                    <strong>Header:</strong> <code className="bg-white dark:bg-gray-600 px-2 py-1 rounded">Authorization: Bearer YOUR_API_KEY</code>
                  </div>
                </div>

                <h3>Endpoints</h3>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
                                     <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">API Endpoints</h4>
                  <ul className="text-green-800 dark:text-green-200 text-body space-y-2">
                  </ul>
                </div>

                <h3>Response Codes</h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">🎯 Status Codes</h4>
                  <ul className="text-yellow-800 dark:text-yellow-200 text-body space-y-2">
                    <li><strong>200 OK</strong> - Request successful</li>
                    <li><strong>201 Created</strong> - Resource created</li>
                    <li><strong>400 Bad Request</strong> - Invalid input</li>
                    <li><strong>401 Unauthorized</strong> - Missing or invalid API key</li>
                    <li><strong>403 Forbidden</strong> - Insufficient permissions</li>
                    <li><strong>404 Not Found</strong> - Resource not found</li>
                    <li><strong>409 Conflict</strong> - Resource already exists</li>
                    <li><strong>500 Internal Server Error</strong> - Server error</li>
                  </ul>
                </div>

                <h3>Error Handling</h3>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3">🚫 Error Responses</h4>
                  <ul className="text-red-800 dark:text-red-200 text-body space-y-2">
                    <li><strong>400 Bad Request:</strong> Invalid input, missing parameters, or malformed JSON.</li>
                    <li><strong>401 Unauthorized:</strong> Missing or invalid API key, session expired, or invalid credentials.</li>
                    <li><strong>403 Forbidden:</strong> Insufficient permissions to perform the action.</li>
                    <li><strong>404 Not Found:</strong> The requested resource does not exist.</li>
                    <li><strong>409 Conflict:</strong> Resource already exists or conflict in state.</li>
                    <li><strong>500 Internal Server Error:</strong> Server-side error, try again later.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Troubleshooting Section */}
            <section id="troubleshooting" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-display font-bold text-gray-900 dark:text-white mb-6">
                Troubleshooting
              </h2>
              
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-body text-gray-600 dark:text-gray-400 mb-6">
                  Common issues and how to resolve them.
                </p>

                <h3>Login Issues</h3>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-8">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3">🔑 Login Problems</h4>
                  <ul className="text-red-800 dark:text-red-200 text-body space-y-2">
                    <li>Double-check your email and password.</li>
                    <li>Ensure no extra spaces in your credentials.</li>
                    <li>Try logging out and logging back in.</li>
                    <li>Clear your browser cookies and cache.</li>
                    <li>Use a different browser or incognito/private mode.</li>
                  </ul>
                </div>

                <h3>Session Expiration</h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">⏰ Session Expired</h4>
                  <ul className="text-yellow-800 dark:text-yellow-200 text-body space-y-2">
                    <li>Re-login to refresh your session.</li>
                    <li>Sessions expire after 24 hours of inactivity.</li>
                    <li>Automatic logout on page interaction.</li>
                    <li>Manual logout via the admin panel.</li>
                  </ul>
                </div>

                <h3>API Key Issues</h3>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-8">
                                     <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3">API Key Problems</h4>
                  <ul className="text-red-800 dark:text-red-200 text-body space-y-2">
                    <li>Check if your API key is correct and active.</li>
                    <li>Ensure it&apos;s included in the Authorization header.</li>
                    <li>Regenerate your API key if you suspect it&apos;s compromised.</li>
                    <li>Check for typos in the header.</li>
                  </ul>
                </div>

                <h3>Photo Upload Problems</h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">📤 Photo Upload Issues</h4>
                  <ul className="text-yellow-800 dark:text-yellow-200 text-body space-y-2">
                    <li>Check file size limits (e.g., 10MB).</li>
                    <li>Ensure correct file types (e.g., JPEG, PNG).</li>
                    <li>Verify image dimensions (e.g., 1024x768).</li>
                    <li>Check for corrupted files.</li>
                    <li>Try uploading again with a different browser.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Best Practices Section */}
            <section id="best-practices" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-display font-bold text-gray-900 dark:text-white mb-6">
                Best Practices
              </h2>
              
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-body text-gray-600 dark:text-gray-400 mb-6">
                  Tips and guidelines to ensure smooth operation and security.
                </p>

                <h3>Regular Updates</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">🔄 Keep Software Updated</h4>
                  <ul className="text-blue-800 dark:text-blue-200 text-body space-y-2">
                    <li>Regularly check for and apply updates to your admin panel.</li>
                    <li>Ensure your browser is up to date.</li>
                    <li>Stay informed about security patches.</li>
                  </ul>
                </div>

                <h3>Secure Passwords</h3>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">🔐 Strong Passwords</h4>
                  <ul className="text-green-800 dark:text-green-200 text-body space-y-2">
                    <li>Use complex passwords (e.g., mix uppercase, lowercase, numbers, symbols).</li>
                    <li>Change your password regularly.</li>
                    <li>Do not share your password with anyone.</li>
                  </ul>
                </div>

                <h3>Two-Factor Authentication</h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">🔐 Two-Factor Authentication</h4>
                  <ul className="text-yellow-800 dark:text-yellow-200 text-body space-y-2">
                    <li>Enable two-factor authentication for your admin account.</li>
                    <li>Use a trusted authenticator app (e.g., Google Authenticator).</li>
                    <li>Always verify the second factor.</li>
                  </ul>
                </div>

                <h3>Regular Backups</h3>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3">📦 Regular Backups</h4>
                  <ul className="text-red-800 dark:text-red-200 text-body space-y-2">
                    <li>Regularly backup your database and files.</li>
                    <li>Store backups securely (e.g., cloud, encrypted drives).</li>
                    <li>Test restores to ensure data integrity.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-display font-bold text-gray-900 dark:text-white mb-6">
                FAQ
              </h2>
              
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-body text-gray-600 dark:text-gray-400 mb-6">
                  Frequently asked questions and their answers.
                </p>

                <h3>General Questions</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
                                     <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">General Questions</h4>
                  <ul className="text-blue-800 dark:text-blue-200 text-body space-y-2">
                    <li><strong>What is Farm Companion?</strong> Farm Companion is the UK&apos;s premium farm shop platform, connecting consumers with local farms.</li>
                    <li><strong>Who can use Farm Companion?</strong> Anyone interested in buying from local farms can use the platform.</li>
                    <li><strong>How do I become a farm on Farm Companion?</strong> Farms can apply to join the platform through our website.</li>
                    <li><strong>How do I manage my farm listing?</strong> You can update your farm&apos;s details, photos, and availability on the platform.</li>
                    <li><strong>How do I process claims?</strong> You can review and approve/reject claims from users on the platform.</li>
                  </ul>
                </div>

                <h3>Admin Panel Questions</h3>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
                                     <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">Admin Panel Questions</h4>
                  <ul className="text-green-800 dark:text-green-200 text-body space-y-2">
                    <li><strong>How do I access the admin panel?</strong> You can access the admin panel by navigating to <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">https://www.farmcompanion.co.uk/admin</code>.</li>
                    <li><strong>What credentials do I need?</strong> You&apos;ll need your admin email and password.</li>
                    <li><strong>How do I change my password?</strong> Go to your profile settings in the admin panel.</li>
                    <li><strong>How do I log out?</strong> Click on your profile picture and select &quot;Logout&quot; from the dropdown menu.</li>
                  </ul>
                </div>

                <h3>Photo Management Questions</h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
                                     <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">Photo Management Questions</h4>
                  <ul className="text-yellow-800 dark:text-yellow-200 text-body space-y-2">
                    <li><strong>How do I upload photos for my farm?</strong> You can upload photos directly on the farm&apos;s page or via the admin panel.</li>
                    <li><strong>What are the photo requirements?</strong> Photos must be high-quality, relevant to your farm, and appropriate for all audiences.</li>
                    <li><strong>How long does it take for photos to appear on my farm page?</strong> Once approved, photos typically appear within 24 hours.</li>
                    <li><strong>What happens if my photo is rejected?</strong> You&apos;ll receive feedback and can request changes or resubmit.</li>
                    <li><strong>Can I delete a photo?</strong> Yes, you can soft delete a photo, which will remove it from the system for 4 hours. After that, it&apos;s permanently deleted.</li>
                  </ul>
                </div>

                <h3>Claims Questions</h3>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                                     <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3">Claims Questions</h4>
                  <ul className="text-red-800 dark:text-red-200 text-body space-y-2">
                    <li><strong>How do I process a claim?</strong> You can review claims on the claims management page and approve or reject them.</li>
                    <li><strong>What evidence do I need to verify a claim?</strong> You&apos;ll need to provide evidence of your farm&apos;s ownership, such as tax documents, bank statements, or official correspondence.</li>
                    <li><strong>What happens if a claim is rejected?</strong> The user will receive a notification explaining the reason and can resubmit with new evidence.</li>
                    <li><strong>Can I delete a claim?</strong> Yes, you can permanently delete a claim if it&apos;s fraudulent or malicious.</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
