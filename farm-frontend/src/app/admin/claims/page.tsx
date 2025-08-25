import Link from 'next/link'
import fs from 'fs/promises'
import path from 'path'

export default async function AdminClaimsPage() {
  // In production, check if user is authenticated and has admin access
  // For now, we'll just show the page

  const claims = await loadClaims()

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Claims Management</h1>
        <p className="mt-2 text-gray-700 dark:text-[#E4E2DD]/80">
          Review and manage farm shop claims
        </p>
      </header>

      {claims.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No claims yet</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            When farm owners submit claims, they&apos;ll appear here for review.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {claims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex justify-between items-center">
        <Link href="/admin" className="btn-secondary">
          ← Back to Admin
        </Link>
        <Link href="/admin/photos" className="btn-secondary">
          Photo Submissions →
        </Link>
      </div>
    </main>
  )
}

async function loadClaims() {
  try {
    const claimsDir = path.join(process.cwd(), 'data', 'claims')
    
    // Check if directory exists
    try {
      await fs.access(claimsDir)
    } catch {
      // Directory doesn't exist, return empty array
      return []
    }
    
    const files = await fs.readdir(claimsDir)
    
    const claims = []
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = await fs.readFile(path.join(claimsDir, file), 'utf-8')
          claims.push(JSON.parse(content))
        } catch (fileError) {
          console.error(`Error reading claim file ${file}:`, fileError)
          // Continue with other files
        }
      }
    }
    
    // Sort by submission date (newest first)
    return claims.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
  } catch (error) {
    console.error('Error loading claims:', error)
    return []
  }
}

function ClaimCard({ claim }: { claim: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
    }
  }

  const getClaimTypeLabel = (type: string) => {
    switch (type) {
      case 'ownership': return 'Ownership Claim'
      case 'management': return 'Management Claim'
      case 'correction': return 'Information Correction'
      case 'removal': return 'Listing Removal'
      default: return type
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {claim.shopName}
            </h3>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(claim.status)}`}>
              {claim.status}
            </span>
          </div>
          
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Claim Type:</strong> {getClaimTypeLabel(claim.claimType)}</p>
            <p><strong>Claimant:</strong> {claim.claimantName} ({claim.claimantEmail})</p>
            <p><strong>Role:</strong> {claim.claimantRole || 'Not specified'}</p>
            <p><strong>Submitted:</strong> {new Date(claim.submittedAt).toLocaleDateString('en-GB')}</p>
            <p><strong>Shop Address:</strong> {claim.shopAddress}</p>
          </div>

          {claim.corrections && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Corrections Requested:</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{claim.corrections}</p>
            </div>
          )}

          {claim.additionalInfo && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Additional Information:</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{claim.additionalInfo}</p>
            </div>
          )}

          <div className="mt-3">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Verification:</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Method: {claim.verificationMethod} | Details: {claim.verificationDetails || 'None provided'}
            </p>
          </div>
        </div>

        <div className="ml-6 flex flex-col space-y-2">
          <Link
            href={claim.shopUrl}
            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            View Shop
          </Link>
          
          {claim.status === 'pending' && (
            <div className="flex space-x-2">
              <button className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700">
                Approve
              </button>
              <button className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700">
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Claim ID: {claim.id}
        </div>
      </div>
    </div>
  )
}
