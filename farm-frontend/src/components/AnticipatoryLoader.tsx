'use client'

import { useEffect, useRef, useState } from 'react'
import type { FarmShop } from '@/types/farm'

interface AnticipatoryLoaderProps {
  farms: FarmShop[] | null
  userLoc: { lat: number; lng: number } | null
  onPreloadData: (data: any) => void
}

export default function AnticipatoryLoader({ 
  farms, 
  userLoc, 
  onPreloadData 
}: AnticipatoryLoaderProps) {
  const [preloadedData, setPreloadedData] = useState<any>({})
  const mousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const lastInteraction = useRef<number>(Date.now())
  const interactionTimeout = useRef<NodeJS.Timeout | undefined>(undefined)

  // Track mouse movement for anticipatory loading
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY }
      lastInteraction.current = Date.now()
      
      // Clear existing timeout
      if (interactionTimeout.current) {
        clearTimeout(interactionTimeout.current)
      }
      
      // Set new timeout for anticipatory loading
      interactionTimeout.current = setTimeout(() => {
        performAnticipatoryLoading()
      }, 100) // 100ms delay before anticipatory loading
    }

    const handleScroll = () => {
      lastInteraction.current = Date.now()
      performAnticipatoryLoading()
    }

    const handleTouchStart = () => {
      lastInteraction.current = Date.now()
      performAnticipatoryLoading()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('touchstart', handleTouchStart)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('touchstart', handleTouchStart)
      if (interactionTimeout.current) {
        clearTimeout(interactionTimeout.current)
      }
    }
  }, [farms, userLoc])

  const performAnticipatoryLoading = () => {
    if (!farms || !userLoc) return

    // Predict user intent based on mouse position and recent interactions
    const timeSinceLastInteraction = Date.now() - lastInteraction.current
    
    // If user is actively interacting, preload nearby farms
    if (timeSinceLastInteraction < 2000) {
      const nearbyFarms = farms.filter(farm => {
        if (!farm.location?.lat || !farm.location?.lng) return false
        
        const distance = calculateDistance(
          userLoc.lat, userLoc.lng,
          farm.location.lat, farm.location.lng
        )
        return distance <= 25 // 25km radius for anticipatory loading
      })

      // Preload farm details and images
      const preloadPromises = nearbyFarms.slice(0, 10).map(async (farm) => {
        // Preload farm images if they exist
        if (farm.images && farm.images.length > 0) {
          const imagePromises = farm.images.slice(0, 2).map((imageUrl: string) => {
            return new Promise((resolve) => {
              const img = new Image()
              img.onload = () => resolve(imageUrl)
              img.onerror = () => resolve(null)
              img.src = imageUrl
            })
          })
          await Promise.all(imagePromises)
        }
        
        return farm
      })

      Promise.all(preloadPromises).then((preloadedFarms) => {
        const newPreloadedData = {
          nearbyFarms: preloadedFarms,
          timestamp: Date.now()
        }
        setPreloadedData(newPreloadedData)
        onPreloadData(newPreloadedData)
      })
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // This component doesn't render anything visible
  return null
}
