'use client'

import dynamic from 'next/dynamic'
import { ApprovedPhoto } from '@/lib/photos'

// Dynamically import the photo gallery to avoid SSR issues
const FarmPhotoGallery = dynamic(() => import('@/components/FarmPhotoGallery'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
      <span className="text-gray-500">Loading photos...</span>
    </div>
  )
})

interface PhotoGalleryWrapperProps {
  photos: ApprovedPhoto[]
  aspect?: string
  autoPlayMs?: number
}

export default function PhotoGalleryWrapper({ 
  photos, 
  aspect = "16/9", 
  autoPlayMs = 5000 
}: PhotoGalleryWrapperProps) {
  return (
    <FarmPhotoGallery 
      photos={photos} 
      aspect={aspect} 
      autoPlayMs={autoPlayMs} 
    />
  )
}
