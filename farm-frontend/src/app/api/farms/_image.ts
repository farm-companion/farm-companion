/**
 * Pure mapping from a Prisma Image row to the client-facing image payload.
 *
 * Surfaces provenance (`uploadedBy`) and CC BY attribution so the client can
 * apply the imagery law in src/lib/farm-hero-image.ts (owner photo vs CC). CC
 * metadata keys (attribution, sourceUrl, license) are omitted when null/empty
 * so owner photos stay clean and the payload is backward-compatible.
 */

export interface SourceImage {
  url: string
  altText?: string | null
  uploadedBy?: string | null
  attribution?: string | null
  sourceUrl?: string | null
  license?: string | null
}

export interface ClientImage {
  url: string
  alt: string
  uploadedBy?: string
  attribution?: string
  sourceUrl?: string
  license?: string
}

export function toClientImage(img: SourceImage, fallbackAlt: string): ClientImage {
  const result: ClientImage = {
    url: img.url,
    alt: img.altText || fallbackAlt,
  }
  if (img.uploadedBy) result.uploadedBy = img.uploadedBy
  if (img.attribution) result.attribution = img.attribution
  if (img.sourceUrl) result.sourceUrl = img.sourceUrl
  if (img.license) result.license = img.license
  return result
}

export function mapFarmImages(images: SourceImage[], fallbackAlt: string): ClientImage[] {
  return images.map((img) => toClientImage(img, fallbackAlt))
}
