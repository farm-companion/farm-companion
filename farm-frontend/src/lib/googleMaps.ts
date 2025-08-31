import { Loader } from '@googlemaps/js-api-loader'

let promise: Promise<typeof google> | null = null

export function loadGoogle() {
  if (!promise) {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places', 'marker']
    })
    promise = loader.load()
  }
  return promise
}
