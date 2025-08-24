import { z } from 'zod'

export const uploadSchema = z.object({
  produceSlug: z.string().min(1),
  month: z.number().min(1).max(12),
  imagesCount: z.number().min(1).max(10)
})
