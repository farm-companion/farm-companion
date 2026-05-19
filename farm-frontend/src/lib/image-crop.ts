/**
 * Image post-processing — watermark-safe crop.
 *
 * FLUX models (dev + schnell) persistently hallucinate faint publisher
 * marks / signatures along the bottom edge of poster-style outputs, even
 * with aggressive negative prompting (verified Slice 1.1.2k-β). The fix
 * is structural: generate at a slightly taller dimension, then crop the
 * bottom strip before saving.
 *
 * Runware/FLUX accepts dimensions in multiples of 64. Helpers below
 * compute the generation dimensions for a desired final target and
 * crop the resulting buffer to that target.
 *
 * Slice: 1.1.2k-γ
 */
import sharp from 'sharp'

/**
 * Default safety-strip in pixels. One FLUX block (64 px); empirically
 * sufficient to clear corner publisher marks at 1024 px tall outputs.
 */
export const WATERMARK_CROP_PX = 64

/**
 * Round `n` up to the nearest multiple of `mod` (default 64 — the
 * FLUX block size).
 */
export function ceilToMultiple(n: number, mod: number = 64): number {
  return Math.ceil(n / mod) * mod
}

/**
 * For a desired final `targetHeight`, compute the generation height
 * Runware should produce so a fixed bottom strip can be removed.
 *
 * Example: target 1024 + 64 crop → gen 1088 (= 17 × 64).
 */
export function generationHeightFor(
  targetHeight: number,
  cropPx: number = WATERMARK_CROP_PX
): number {
  return ceilToMultiple(targetHeight + cropPx, 64)
}

/**
 * Crop a fixed strip from the bottom of an image buffer, returning a
 * new buffer with the same width and the requested final height.
 *
 * Throws if the input buffer is shorter than `finalHeight` or if sharp
 * fails to decode the input.
 */
export async function cropBottomStrip(
  inputBuffer: Buffer,
  finalHeight: number,
  format: 'webp' | 'png' | 'jpeg' = 'webp'
): Promise<Buffer> {
  const image = sharp(inputBuffer)
  const meta = await image.metadata()
  if (!meta.width || !meta.height) {
    throw new Error('cropBottomStrip: could not read input dimensions')
  }
  if (meta.height < finalHeight) {
    throw new Error(
      `cropBottomStrip: input height ${meta.height}px is shorter than requested final height ${finalHeight}px`
    )
  }

  const pipeline = image.extract({
    left: 0,
    top: 0,
    width: meta.width,
    height: finalHeight,
  })

  switch (format) {
    case 'webp':
      return pipeline.webp({ quality: 90 }).toBuffer()
    case 'png':
      return pipeline.png().toBuffer()
    case 'jpeg':
      return pipeline.jpeg({ quality: 90 }).toBuffer()
  }
}
