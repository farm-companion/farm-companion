import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import redis, { ensureConnection } from '@/lib/redis'
import AdminPhotoDisplay from '@/components/AdminPhotoDisplay'
import { 
  CheckCircle, 
  Eye, 
  Download, 
  Trash2, 
  ArrowLeft,
  Calendar,
  User
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Approved Photos - Farm Companion Admin',
  description: 'View and manage approved photo submissions',
}

export default async function ApprovedPhotosPage() {
  const user = await requireAuth()
  const client = await ensureConnection()
  
  // Get all approved photo IDs
  let approvedIds: string[] = []
  try {
    // photos:approved is a List, not a Set
    try {
      approvedIds = await client.lRange('photos:approved', 0, -1)
    } catch (error) {
      // If it's a WRONGTYPE error, try as a Set
      if (error instanceof Error && error.message.includes('WRONGTYPE')) {
        approvedIds = await client.sMembers('photos:approved')
      } else {
        throw error
      }
    }
  } catch (error) {
    console.error('Error fetching approved photos:', error)
  }
  
  const approvedPhotos = await Promise.all(approvedIds.map(async (id) => {
    try {
      const photoData = await client.hGetAll(`photo:${id}`)
      if (!photoData || Object.keys(photoData).length === 0) return null
      
      const photo: Record<string, string> = {}
      for (const [key, value] of Object.entries(photoData)) {
        photo[key] = String(value)
      }
      
      return photo
    } catch (error) {
      console.error('Error fetching approved photo data:', { photoId: id, error })
      return null
    }
  }))

  const validPhotos = approvedPhotos.filter(Boolean)

  return (
    <div className="min-h-screen bg-background-canvas">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-50 to-background-surface shadow-lg border-b border-border-default">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/admin/photos"
                  className="p-2 bg-background-surface rounded-lg hover:bg-background-canvas transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-text-muted" />
                </Link>
                <h1 className="text-3xl font-heading font-bold text-text-heading">
                  Approved Photos
                </h1>
              </div>
              <p className="text-text-muted text-lg">
                {validPhotos.length} photos have been approved and are live on farm pages
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-6">
        {!validPhotos.length ? (
          <div className="bg-background-surface rounded-2xl p-12 text-center border border-border-default/30">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-text-heading mb-2">No approved photos yet</h3>
            <p className="text-text-muted">
              Approved photos will appear here once you start reviewing submissions.
            </p>
            <Link
              href="/admin/photos"
              className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-serum text-white rounded-xl hover:bg-serum/90 transition-colors"
            >
              Review Pending Photos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validPhotos.map((photo) => photo && (
              <div key={photo.id} className="bg-background-surface rounded-2xl border border-border-default/30 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Photo */}
                <div className="relative aspect-video">
                  <AdminPhotoDisplay 
                    url={photo.url} 
                    caption={photo.caption}
                    alt={photo.caption || 'Approved farm photo'}
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Approved
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6">
                  <h3 className="font-semibold text-text-heading mb-2">
                    {photo.farmSlug}
                  </h3>
                  
                  {photo.caption && (
                    <p className="text-text-muted text-sm mb-4 italic">
                      &quot;{photo.caption}&quot;
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-text-muted">
                      <User className="w-4 h-4" />
                      <span>{photo.authorName || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(Number(photo.createdAt)).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border-default/30">
                    <Link
                      href={`/shop/${photo.farmSlug}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-serum text-white rounded-lg hover:bg-serum/90 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Live
                    </Link>
                    <button className="p-2 bg-background-canvas hover:bg-border-default rounded transition-colors">
                      <Download className="w-4 h-4 text-text-muted" />
                    </button>
                    <button className="p-2 bg-background-canvas hover:bg-red-100 rounded transition-colors">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
