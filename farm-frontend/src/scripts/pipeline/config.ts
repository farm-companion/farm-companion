// Endpoints, rate limits, and feature flags for the pipeline.
export const PIPELINE_CONFIG = {
  overpass: {
    endpoint: process.env.OVERPASS_ENDPOINT ?? 'https://overpass-api.de/api/interpreter',
    minDelayMs: 3000, // be polite to public instances
  },
  fsa: {
    endpoint: 'https://api.ratings.food.gov.uk',
    apiVersion: '2',
    pageSize: 1000,
  },
  postcodes: {
    endpoint: 'https://api.postcodes.io',
    bulkSize: 100,
  },
  google: {
    hoursSeamEnabled: process.env.GOOGLE_HOURS_SEAM === 'true', // default OFF
  },
  artifactDir: process.env.PIPELINE_ARTIFACT_DIR ?? '.pipeline',
} as const
