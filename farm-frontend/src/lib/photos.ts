// Photo types and stubs — Redis photo store removed in Phase 0 strip.
// No photos exist in the legacy store; gallery renders only when photos present.

export type ApprovedPhoto = {
  id: string
  farmSlug: string
  url: string
  caption?: string
  authorName?: string
  createdAt?: number
  approvedAt?: number
  status: 'approved'
}

/** Legacy Redis photo store removed. Always returns empty array. */
export async function getValidApprovedPhotosBySlug(_slug: string): Promise<ApprovedPhoto[]> {
  return []
}

/** Legacy Redis photo store removed. Always returns empty array. */
export async function getApprovedPhotosBySlug(_slug: string): Promise<ApprovedPhoto[]> {
  return []
}

/** Legacy Redis photo store removed. Always returns null. */
export async function getPhotoById(_id: string): Promise<ApprovedPhoto | null> {
  return null
}

/** Legacy Redis photo store removed. Always returns empty array. */
export async function getPendingPhotos(): Promise<never[]> {
  return []
}
