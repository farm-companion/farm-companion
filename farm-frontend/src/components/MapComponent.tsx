'use client'

import { useEffect, useRef } from 'react'
import type { FarmShop } from '@/types/farm'
import { hapticFeedback } from '@/lib/haptics'

// Import MapLibre GL JS directly for immediate loading
import maplibregl, { Map } from 'maplibre-gl'

const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://demotiles.maplibre.org/style.json'

interface MapComponentProps {
  farms: FarmShop[] | null
  filteredFarms: FarmShop[]
  userLoc: { lat: number; lng: number } | null
  setUserLoc: (loc: { lat: number; lng: number } | null) => void
  bounds: { west: number; south: number; east: number; north: number } | null
  setBounds: (bounds: { west: number; south: number; east: number; north: number } | null) => void
  selectedFarm: FarmShop | null
  setSelectedFarm: (farm: FarmShop | null) => void
  loadFarmData: () => void
  isLoading: boolean
  error: string | null
  retryCount: number
  isRetrying: boolean
  dataQuality: { total: number; valid: number; invalid: number } | null
}

export default function MapComponent({
  farms,
  filteredFarms,
  userLoc: _userLoc,
  setUserLoc,
  bounds: _bounds,
  setBounds,
  selectedFarm: _selectedFarm,
  setSelectedFarm,
  loadFarmData,
  isLoading: _isLoading,
  error: _error,
  retryCount: _retryCount,
  isRetrying: _isRetrying,
  dataQuality: _dataQuality
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const rafRef = useRef<number | null>(null)
  const roRef = useRef<ResizeObserver | null>(null)
  const farmsRef = useRef<FarmShop[] | null>(null)
  
  // Map configuration
  const sourceId = 'farms-src'
  const clusterLayerId = 'clusters'
  const clusterCountLayerId = 'cluster-count'
  const unclusteredLayerId = 'unclustered-point'

  // Initialize map with performance optimizations
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    // Defer to next frame for proper sizing
    rafRef.current = requestAnimationFrame(() => {
      if (!mapContainer.current || mapRef.current) return

      console.log('🔍 Creating MapLibre map with style URL:', styleUrl)
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: [-2.5, 54.5], // UK center
        zoom: 6, // Closer zoom to see markers
        maxZoom: 18,
        minZoom: 4,
        pitchWithRotate: false,
        dragRotate: false,
        touchZoomRotate: true
      })
      
      // Add error handling for map creation
      map.on('error', (e) => {
        console.error('MapLibre error:', e)
      })
      
      map.on('styledata', () => {
        console.log('Map style loaded successfully')
      })
      
      map.on('sourcedata', (e) => {
        if (e.isSourceLoaded) {
          console.log('Map source loaded:', e.sourceId)
        }
      })
      
      mapRef.current = map

      // Mobile-optimized map controls
      map.addControl(new maplibregl.NavigationControl({ 
        showCompass: true,
        showZoom: true,
        visualizePitch: false
      }), 'top-right')
      
      // Add mobile-specific map configuration
      map.dragRotate.disable() // Disable drag rotation on mobile for better UX
      map.touchZoomRotate.disableRotation() // Disable rotation on touch for better mobile experience
      
      map.addControl(new maplibregl.ScaleControl({ 
        unit: 'metric',
        maxWidth: 80
      }), 'bottom-left')

      // Enhanced geolocation
      const geo = new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserLocation: true,
        fitBoundsOptions: { maxZoom: 13 },
        showAccuracyCircle: true
      })
      map.addControl(geo, 'top-right')
      
      geo.on('geolocate', (e: any) => {
        if (e && e.coords) {
          hapticFeedback.success()
          setUserLoc({ lat: e.coords.latitude, lng: e.coords.longitude })
        }
      })

      // Google-level map layers
      map.on('load', () => {
        console.log('Map loaded successfully, setting up layers...')
        // Ensure source is added only once
        if (!map.getSource(sourceId)) {
          console.log('Adding map source...')
          try {
            const sourceData = { type: 'FeatureCollection' as const, features: [] }
            console.log('Source data structure:', sourceData)
            map.addSource(sourceId, {
              type: 'geojson',
              data: sourceData,
              cluster: true,
              clusterRadius: 60, // Google-style clustering
              clusterMaxZoom: 16
            })
            console.log('✅ Map source added successfully')
          } catch (error) {
            console.error('❌ Failed to add map source:', error)
          }
        } else {
          console.log('⚠️ Map source already exists')
        }

        // Google-style heat visualization
        if (!map.getLayer('cluster-heat')) {
          map.addLayer({
            id: 'cluster-heat',
            type: 'circle',
            source: sourceId,
            filter: ['has', 'point_count'],
            paint: {
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                25, 3,
                35, 10,
                45, 20,
                55
              ],
              'circle-color': [
                'step',
                ['get', 'point_count'],
                'rgba(0, 194, 178, 0.15)', 3,
                'rgba(0, 194, 178, 0.25)', 10,
                'rgba(0, 194, 178, 0.35)', 20,
                'rgba(0, 194, 178, 0.45)'
              ],
              'circle-opacity': 0.8,
              'circle-stroke-width': 0
            }
          })
        }

        // Google-style cluster markers
        if (!map.getLayer(clusterLayerId)) {
          map.addLayer({
            id: clusterLayerId,
            type: 'circle',
            source: sourceId,
            filter: ['has', 'point_count'],
            paint: {
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                16, 3,
                20, 10,
                24, 20,
                28
              ],
              'circle-color': [
                'step',
                ['get', 'point_count'],
                '#00C2B2', 3,
                '#00C2B2', 10,
                '#00C2B2', 20,
                '#D4FF4F'
              ],
              'circle-opacity': 0.95,
              'circle-stroke-width': 3,
              'circle-stroke-color': '#FFFFFF'
            }
          })
        }

        // Google-style cluster labels
        if (!map.getLayer(clusterCountLayerId)) {
          map.addLayer({
            id: clusterCountLayerId,
            type: 'symbol',
            source: sourceId,
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['get', 'point_count_abbreviated'],
              'text-size': 12,
              'text-allow-overlap': true
            },
            paint: {
              'text-color': '#1E1F23',
              'text-halo-color': '#FFFFFF',
              'text-halo-width': 2
            }
          })
        }

        // Google-style individual markers (clean single layer only)
        if (!map.getLayer(unclusteredLayerId)) {
          console.log('Adding unclustered layer...')
          try {
            map.addLayer({
              id: unclusteredLayerId,
              type: 'circle',
              source: sourceId,
              filter: ['!', ['has', 'point_count']],
              paint: {
                'circle-radius': 15, // Larger radius
                'circle-color': '#FF0000', // Bright red for visibility
                'circle-opacity': 1.0, // Full opacity
                'circle-stroke-width': 3, // Thicker stroke
                'circle-stroke-color': '#FFFFFF'
              }
            })
            console.log('✅ unclustered layer added successfully')
            
            // Debug layer visibility
            const layer = map.getLayer(unclusteredLayerId)
            console.log('🗺️ Map: Layer visibility:', layer ? 'Layer exists' : 'Layer not found')
            console.log('🗺️ Map: Layer paint properties:', map.getPaintProperty(unclusteredLayerId, 'circle-color'))
          } catch (error) {
            console.error('❌ Failed to add unclustered layer:', error)
          }
        } else {
          console.log('⚠️ unclustered layer already exists')
        }

        // Add highlight source and layer unconditionally
        if (!map.getSource('highlight-src')) {
          try {
            map.addSource('highlight-src', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] }
            })
            console.log('✅ highlight source added successfully')
          } catch (error) {
            console.error('❌ Failed to add highlight source:', error)
          }
        }
        
        if (!map.getLayer('highlight-layer')) {
          try {
            map.addLayer({
              id: 'highlight-layer',
              type: 'circle',
              source: 'highlight-src',
              paint: {
                'circle-radius': 16,
                'circle-color': '#FF6B35',
                'circle-opacity': 0.9,
                'circle-stroke-width': 3,
                'circle-stroke-color': '#FFFFFF'
              }
            })
            console.log('✅ highlight layer added successfully')
          } catch (error) {
            console.error('❌ Failed to add highlight layer:', error)
          }
        }

        // Map layers are now ready for farm data
      })

      // Google-level interactions
      map.on('click', clusterLayerId, (e: any) => {
        hapticFeedback.buttonPress()
        const features = map.queryRenderedFeatures(e.point, { layers: [clusterLayerId] })
        const clusterId = features[0]?.properties?.cluster_id
        const src = map.getSource(sourceId) as any
        if (!src || clusterId == null) return
        src.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
          if (err) return
          map.easeTo({ 
            center: (features[0].geometry as any).coordinates, 
            zoom,
            duration: 500
          })
        })
      })

      map.on('click', unclusteredLayerId, (e: any) => {
        hapticFeedback.buttonPress()
        const f = e.features && e.features[0]
        if (!f) return
        const p = f.properties as any
        
        // Find the farm data
        const farm = farmsRef.current?.find(farm => farm.id === p.id)
        if (farm) {
          // Apple-style marker selection with enhanced behavior
          setSelectedFarm(farm)
          
          // 1. Smooth map centering with optimal zoom
          map.flyTo({
            center: [farm.location.lng, farm.location.lat],
            zoom: 15, // Optimal zoom for farm context
            duration: 1000, // Smooth 1-second animation
            essential: true
          })
          
          // 2. Visual focus - highlight this marker using separate layer
          const farmFeature = farmsRef.current?.find(f => f.id === farm.id)
          if (farmFeature && map.getSource('highlight-src')) {
            const source = map.getSource('highlight-src') as any
            
            // Create highlight feature
            const highlightFeature = {
              type: 'Feature' as const,
              geometry: {
                type: 'Point' as const,
                coordinates: [farmFeature.location.lng, farmFeature.location.lat]
              },
              properties: {
                id: farmFeature.id
              }
            }
            
            // Set highlight data with animation effect
            source.setData({
              type: 'FeatureCollection',
              features: [highlightFeature]
            })
            
            // Animate highlight with scale effect
            const highlightLayer = map.getLayer('highlight-layer')
            if (highlightLayer) {
              // Start with larger radius for "pop" effect
              map.setPaintProperty('highlight-layer', 'circle-radius', 20)
              
              // Animate back to normal size
              setTimeout(() => {
                map.setPaintProperty('highlight-layer', 'circle-radius', 16)
              }, 150)
            }
            
            // Remove highlight after 2 seconds
            setTimeout(() => {
              if (map.getSource('highlight-src')) {
                const source = map.getSource('highlight-src') as any
                source.setData({
                  type: 'FeatureCollection',
                  features: []
                })
              }
            }, 2000)
          }
        }
      })

      // Enhanced cursor states
      map.on('mouseenter', clusterLayerId, () => { 
        map.getCanvas().style.cursor = 'pointer' 
      })
      map.on('mouseleave', clusterLayerId, () => { 
        map.getCanvas().style.cursor = '' 
      })
      map.on('mouseenter', unclusteredLayerId, () => map.getCanvas().style.cursor = 'pointer')
      map.on('mouseleave', unclusteredLayerId, () => map.getCanvas().style.cursor = '')

      // Track bounds for filtering
      const updateBounds = () => {
        const b = map.getBounds()
        setBounds({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() })
      }
      map.on('load', updateBounds)
      map.on('moveend', updateBounds)

      // Responsive handling
      roRef.current = new ResizeObserver(() => {
        console.log('Container resized, calling map.resize()')
        map.resize()
      })
      roRef.current.observe(mapContainer.current!)

      const handleShow = () => {
        console.log('Page show/visibility change, calling map.resize()')
        map.resize()
      }
      window.addEventListener('pageshow', handleShow)
      document.addEventListener('visibilitychange', handleShow)
      
      // Force initial resize after a short delay
      setTimeout(() => {
        console.log('Forcing initial map resize')
        map.resize()
      }, 100)

      mapRef.current = map

      return () => {
        window.removeEventListener('pageshow', handleShow)
        document.removeEventListener('visibilitychange', handleShow)
      }
    })

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      roRef.current?.disconnect()
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [setUserLoc, setBounds])

  // Update farms ref when farms change
  useEffect(() => {
    farmsRef.current = farms
  }, [farms])

  // Update map markers with validation and performance optimization
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) {
      console.log('Map not ready for update:', { map: !!map, styleLoaded: map?.isStyleLoaded() })
      return
    }
    const src = map.getSource(sourceId) as any
    if (!src) {
      console.warn('Map source not found, retrying...')
      return
    }
    
    console.log('🗺️ Map: Processing farms:', filteredFarms?.length || 0, 'farms')
    console.log('🗺️ Map: First few farms:', filteredFarms?.slice(0, 3))
    console.log('🗺️ Map: Source exists:', !!src)
    console.log('🗺️ Map: Source type:', src.type)
    
    // Apply the same validation to filtered farms
    const validFilteredFarms = (filteredFarms || []).filter((f) => {
      if (!f.location) {
        console.warn('Farm missing location:', f.id, f.name)
        return false
      }
      const { lat, lng } = f.location
      
      // Debug coordinate issues
      if (lat === null || lng === null) {
        console.warn('Farm has null coordinates:', f.id, f.name, { lat, lng })
        return false
      }
      
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        console.warn('Farm has non-number coordinates:', f.id, f.name, { lat, lng, latType: typeof lat, lngType: typeof lng })
        return false
      }
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn('Farm has invalid coordinate range:', f.id, f.name, { lat, lng })
        return false
      }
      
      if (lat === 0 && lng === 0) {
        console.warn('Farm has zero coordinates:', f.id, f.name)
        return false
      }
      
      // UK bounds validation (relaxed for testing)
      const isInUKBounds = lat >= 49.9 && lat <= 60.9 && lng >= -8.6 && lng <= 1.8
      if (!isInUKBounds) {
        console.warn('Farm outside UK bounds:', f.id, f.name, { lat, lng })
        // For now, let's include all farms regardless of UK bounds for testing
        // return false
      }
      
      return true
    })
    
    // Create new features from filtered farms
    console.log('Creating features for farms:', validFilteredFarms.length)
    
    // Add a test marker in London for debugging
    const testFeature = {
      type: 'Feature' as const,
      geometry: { 
        type: 'Point' as const, 
        coordinates: [-0.1276, 51.5074] // London coordinates
      },
      properties: {
        id: 'test-marker',
        name: 'Test Marker (London)',
        slug: 'test-marker',
        county: 'Test',
        postcode: 'TEST',
        address: 'Test Address'
      }
    }
    
    const newFeatures = [
      testFeature, // Add test marker first
      ...validFilteredFarms.map((f) => {
        const feature = {
          type: 'Feature' as const,
          geometry: { 
            type: 'Point' as const, 
            coordinates: [f.location.lng, f.location.lat] 
          },
          properties: {
            id: f.id,
            name: f.name,
            slug: f.slug,
            county: f.location.county || '',
            postcode: f.location.postcode || '',
            address: f.location.address || ''
          }
        }
        console.log('Created feature for farm:', f.name, 'at coordinates:', [f.location.lng, f.location.lat])
        return feature
      })
    ]
    
    // Always update the data - MapLibre will handle optimization internally
    console.log(`Map update: ${validFilteredFarms.length} valid farms out of ${filteredFarms?.length || 0} total`)
    
    const geoJsonData = { type: 'FeatureCollection' as const, features: newFeatures }
    console.log('Setting map data with features:', newFeatures.length)
    console.log('First feature sample:', newFeatures[0])
    
    try {
      console.log('🗺️ Map: About to set data with', newFeatures.length, 'features')
      console.log('🗺️ Map: First feature coordinates:', newFeatures[0]?.geometry?.coordinates)
      src.setData(geoJsonData)
      console.log('✅ Map data updated successfully')
      
      // Verify the data was set
      const currentData = src.serialize()
      console.log('🗺️ Map: Current source data has', currentData.data?.features?.length || 0, 'features')
    } catch (error) {
      console.error('❌ Failed to update map data:', error)
    }
  }, [filteredFarms])

  // Fit map to bounds when they change (e.g., from search results)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded() || !_bounds) {
      return
    }
    
    console.log('🗺️ Map: Fitting to bounds:', _bounds)
    try {
      map.fitBounds([
        [_bounds.west, _bounds.south],
        [_bounds.east, _bounds.north]
      ], {
        padding: 50,
        maxZoom: 14
      })
    } catch (error) {
      console.error('❌ Failed to fit bounds:', error)
    }
  }, [_bounds])

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full bg-blue-100" // Full height of parent
    />
  )
}
