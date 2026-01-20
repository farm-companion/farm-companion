import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { ensureConnection } from '@/lib/redis'
import AdminPhotoDisplay from '@/components/AdminPhotoDisplay'
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download, 
  Trash2, 
  ArrowLeft,
  Calendar,
  User,
  Filter,
  Search,
  Grid,
  List,
  RefreshCw,
  BarChart3,
  Upload,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  AlertCircle
} from 'lucide-react'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Photo Management - Farm Companion',
  description: 'Review and manage photo submissions with advanced tracking',
}

export default async function AdminPhotosPage() {
  // Require authentication
  await requireAuth()

  // Get pending photos from Redis
  const client = await ensureConnection()
  const pendingIds = await client.lRange('moderation:queue', 0, -1)
  
  console.log('Debug: Pending photo IDs:', pendingIds)
  
  const pending = await Promise.all(pendingIds.map(async (id: string) => {
    try {
      const photoData = await client.hGetAll(`photo:${id}`)
      console.log(`Debug: Photo ${id} data:`, photoData)
      
      if (!photoData || Object.keys(photoData).length === 0) return null
      
      // Convert Redis hash to object
      const photo: Record<string, string> = {}
      for (const [key, value] of Object.entries(photoData)) {
        photo[key] = String(value)
      }
      
      console.log(`Debug: Processed photo ${id}:`, photo)
      return photo
    } catch (error) {
      console.error('Error fetching photo data:', { photoId: id, error })
      return null
    }
  }))

  const validPhotos = pending.filter(Boolean)
  console.log('Debug: Valid photos:', validPhotos.length)

  // Get farm upload statistics and quota information
  const farmStats = await getFarmUploadStats(client)
  const farmQuotas = await getFarmQuotas(client, validPhotos)

  return (
    <div className="min-h-screen bg-background-canvas">
      {/* Admin Header */}
      <header className="bg-background-surface border-b border-border-default/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-heading font-heading font-bold text-text-heading">
                  Photo Management
                </h1>
                <p className="text-caption text-text-muted">
                  Review and manage photo submissions • {validPhotos.length} pending
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <BarChart3 className="w-4 h-4" />
                <span>{farmStats.totalFarms} farms • {farmStats.totalPhotos} total photos</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/photos/approved"
                className="inline-flex items-center gap-2 px-4 py-2 bg-serum text-white rounded-lg hover:bg-serum/90 transition-colors text-body font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                Approved Photos
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 bg-background-surface border border-border-default text-text-body rounded-lg hover:bg-border-default/50 transition-colors text-body font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
              <form action="/api/admin/logout" method="POST">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-body font-medium"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-background-surface border border-border-default/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption font-medium text-text-muted">Pending Review</p>
                <p className="text-heading font-bold text-text-heading">{validPhotos.length}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-background-surface border border-border-default/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption font-medium text-text-muted">Approved Today</p>
                <p className="text-heading font-bold text-text-heading">{farmStats.approvedToday}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-background-surface border border-border-default/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption font-medium text-text-muted">Rejected Today</p>
                <p className="text-heading font-bold text-text-heading">{farmStats.rejectedToday}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-background-surface border border-border-default/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption font-medium text-text-muted">Active Farms</p>
                <p className="text-heading font-bold text-text-heading">{farmStats.activeFarms}</p>
              </div>
              <div className="p-2 bg-serum/10 rounded-lg">
                <Upload className="w-6 h-6 text-serum" />
              </div>
            </div>
          </div>
        </div>

        {/* Quota Warning Banner */}
        {farmQuotas.quotaExceededFarms.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-amber-800 mb-1">Photo Quota Warnings</h3>
                <p className="text-caption text-amber-700 mb-2">
                  The following farms have reached their 5-photo limit. Approving new photos will require replacing existing ones:
                </p>
                <div className="flex flex-wrap gap-2">
                  {farmQuotas.quotaExceededFarms.map((farm) => (
                    <span key={farm.slug} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-small font-medium">
                      {farm.slug} ({farm.currentCount}/5)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls Bar */}
        <div className="bg-background-surface border border-border-default/30 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search photos, farms, or captions..."
                  className="pl-10 pr-4 py-2 border border-border-default rounded-lg bg-background-canvas text-text-body placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-serum focus:border-transparent"
                />
              </div>
              <button className="inline-flex items-center gap-2 px-3 py-2 border border-border-default rounded-lg hover:bg-border-default/50 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 border border-border-default rounded-lg hover:bg-border-default/50 transition-colors">
                <Grid className="w-4 h-4" />
              </button>
              <button className="p-2 border border-border-default rounded-lg hover:bg-border-default/50 transition-colors">
                <List className="w-4 h-4" />
              </button>
              <button className="inline-flex items-center gap-2 px-3 py-2 bg-serum text-white rounded-lg hover:bg-serum/90 transition-colors">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Photo Grid */}
        {!validPhotos.length ? (
          <div className="bg-background-surface border border-border-default/30 rounded-xl p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-heading font-semibold text-text-heading mb-2">All caught up!</h3>
            <p className="text-text-muted mb-6">
              No photos are currently pending review. Check back later for new submissions.
            </p>
            <Link
              href="/admin/photos/approved"
              className="inline-flex items-center gap-2 px-4 py-2 bg-serum text-white rounded-lg hover:bg-serum/90 transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Approved Photos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validPhotos.map((photo) => photo && (() => {
              const farmQuota = farmQuotas.farmQuotas[photo.farmSlug] || { currentCount: 0, maxCount: 5 }
              const isQuotaExceeded = farmQuota.currentCount >= farmQuota.maxCount
              
              return (
                <div key={photo.id} className="bg-background-surface border border-border-default/30 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Photo Header */}
                  <div className="p-4 border-b border-border-default/30">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-text-heading truncate">
                        {photo.farmSlug}
                      </h3>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-small font-medium">
                          Pending
                        </span>
                        {isQuotaExceeded && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-small font-medium">
                            Quota Full
                          </span>
                        )}
                        <button className="p-1 hover:bg-border-default/50 rounded transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-text-muted" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Quota Status */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1 text-small text-text-muted">
                        <Upload className="w-3 h-3" />
                        <span>{farmQuota.currentCount}/{farmQuota.maxCount} photos</span>
                      </div>
                      {isQuotaExceeded && (
                        <div className="flex items-center gap-1 text-small text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          <span>Approval requires replacement</span>
                        </div>
                      )}
                    </div>
                    
                    {photo.caption && (
                      <p className="text-sm text-text-muted italic line-clamp-2">
                        &quot;{photo.caption}&quot;
                      </p>
                    )}
                  </div>

                  {/* Photo Display */}
                  <div className="relative aspect-video">
                    <AdminPhotoDisplay 
                      url={photo.url} 
                      caption={photo.caption}
                      alt={photo.caption || 'Farm photo'}
                      showActions={true}
                    />
                  </div>

                  {/* Photo Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <User className="w-4 h-4" />
                      <span>{photo.authorName || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(Number(photo.createdAt)).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t border-border-default/30">
                      <form action={`/api/admin/photos/approve?id=${photo.id}`} method="POST" className="flex-1">
                        <button 
                          type="submit"
                          className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors text-body font-medium ${
                            isQuotaExceeded 
                              ? 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500' 
                              : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                          }`}
                          title={isQuotaExceeded ? 'Will replace oldest photo' : 'Approve photo'}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {isQuotaExceeded ? 'Replace & Approve' : 'Approve'}
                        </button>
                      </form>
                      
                      <form action={`/api/admin/photos/reject?id=${photo.id}`} method="POST" className="flex-1">
                        <button 
                          type="submit"
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors text-body font-medium"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </form>
                    </div>
                    
                    {/* Secondary Actions */}
                    <div className="flex gap-2">
                      <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-border-default text-text-body rounded-lg hover:bg-border-default/50 transition-colors text-body">
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-border-default text-text-body rounded-lg hover:bg-border-default/50 transition-colors text-body">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-border-default text-text-body rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors text-body">
                        <Trash2 className="w-4 h-4 text-red-500" />
                        Delete
                      </button>
                    </div>

                    {/* Farm Photos Link */}
                    <div className="pt-2 border-t border-border-default/30">
                      <Link
                        href={`/shop/${photo.farmSlug}`}
                        className="inline-flex items-center gap-2 text-small text-serum hover:text-serum/80 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        View farm photos ({farmQuota.currentCount} current)
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })())}
          </div>
        )}
      </main>
    </div>
  )
}

// Helper function to get farm upload statistics
async function getFarmUploadStats(client: any) {
  try {
    // Get all farm keys
    const farmKeys = await client.keys('farm:*:photos:*')
    
    const stats = {
      totalFarms: 0,
      totalPhotos: 0,
      approvedToday: 0,
      rejectedToday: 0,
      activeFarms: 0
    }
    
    const farmSlugs = new Set()
    
    for (const key of farmKeys) {
      const parts = key.split(':')
      if (parts.length >= 3) {
        const farmSlug = parts[1]
        const photoType = parts[3] // approved, pending, rejected
        
        farmSlugs.add(farmSlug)
        
        if (photoType === 'approved') {
          const count = await client.sCard(key)
          stats.totalPhotos += count
        } else if (photoType === 'pending') {
          const count = await client.sCard(key)
          stats.totalPhotos += count
        }
      }
    }
    
    stats.totalFarms = farmSlugs.size
    stats.activeFarms = farmSlugs.size // For now, all farms with photos are considered active
    
    // Get today's stats from global lists
    try {
      const approvedIds = await client.lRange('photos:approved', 0, -1)
      const rejectedIds = await client.lRange('photos:rejected', 0, -1)
      
      // Count photos approved/rejected today (simplified - in production you'd check timestamps)
      stats.approvedToday = Math.min(approvedIds.length, 5) // Placeholder
      stats.rejectedToday = Math.min(rejectedIds.length, 2) // Placeholder
    } catch (error) {
      console.error('Error getting daily stats:', error)
    }
    
    return stats
  } catch (error) {
    console.error('Error getting farm upload stats:', error)
    return {
      totalFarms: 0,
      totalPhotos: 0,
      approvedToday: 0,
      rejectedToday: 0,
      activeFarms: 0
    }
  }
}

// Helper function to get farm quotas and current photo counts
async function getFarmQuotas(client: any, pendingPhotos: any[]) {
  try {
    const farmQuotas: Record<string, { currentCount: number; maxCount: number }> = {}
    const quotaExceededFarms: Array<{ slug: string; currentCount: number }> = []
    
    // Get unique farm slugs from pending photos
    const farmSlugs = [...new Set(pendingPhotos.map(photo => photo.farmSlug))]
    
    for (const farmSlug of farmSlugs) {
      try {
        // Get current approved photo count for this farm
        const approvedCount = await client.sCard(`farm:${farmSlug}:photos:approved`)
        const currentCount = approvedCount || 0
        const maxCount = 5 // Hard limit per farm
        
        farmQuotas[farmSlug] = {
          currentCount,
          maxCount
        }
        
        // Check if quota is exceeded
        if (currentCount >= maxCount) {
          quotaExceededFarms.push({
            slug: farmSlug,
            currentCount
          })
        }
      } catch (error) {
        console.error(`Error getting quota for farm ${farmSlug}:`, error)
        farmQuotas[farmSlug] = { currentCount: 0, maxCount: 5 }
      }
    }
    
    return {
      farmQuotas,
      quotaExceededFarms
    }
  } catch (error) {
    console.error('Error getting farm quotas:', error)
    return {
      farmQuotas: {},
      quotaExceededFarms: []
    }
  }
}
