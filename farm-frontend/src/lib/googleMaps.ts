import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

let promise: Promise<typeof google> | null = null

export async function loadGoogle(): Promise<typeof google> {
  if (!promise) {
    // Set options first (only needs to be called once)
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      v: 'weekly',
      libraries: [
        'places',    // For places API features
        'marker'     // Required for AdvancedMarkerElement
      ]
    })
    
    // Import required libraries - this loads the Maps API
    promise = Promise.all([
      importLibrary('core'),
      importLibrary('maps'),
      importLibrary('places'),
      importLibrary('marker')
    ]).then(() => {
      // Return the global google namespace
      return globalThis.google as typeof google
    })
  }
  return promise
}
