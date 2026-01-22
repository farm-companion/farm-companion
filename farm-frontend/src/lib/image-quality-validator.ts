import sharp from 'sharp'

/**
 * Image Quality Validator
 *
 * Validates generated images meet quality standards:
 * - Resolution requirements (min 1600x900)
 * - File size limits (max 2MB)
 * - Sharpness detection (blur detection)
 * - Brightness/contrast checks
 */

export interface QualityStandards {
  minWidth: number
  minHeight: number
  maxFileSize: number
  minSharpness: number
  minBrightness: number
  maxBrightness: number
}

export interface QualityResult {
  passed: boolean
  errors: string[]
  warnings: string[]
  metrics: {
    width: number
    height: number
    fileSize: number
    sharpness?: number
    brightness?: number
  }
  confidence: number
}

export const DEFAULT_QUALITY_STANDARDS: QualityStandards = {
  minWidth: 1600,
  minHeight: 900,
  maxFileSize: 2 * 1024 * 1024, // 2MB
  minSharpness: 0.7,
  minBrightness: 0.3,
  maxBrightness: 0.9
}

export class ImageQualityValidator {
  private standards: QualityStandards

  constructor(standards: QualityStandards = DEFAULT_QUALITY_STANDARDS) {
    this.standards = standards
  }

  /**
   * Validate image buffer against quality standards
   */
  async validateImage(imageBuffer: Buffer): Promise<QualityResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata()
      const fileSize = imageBuffer.length

      const width = metadata.width || 0
      const height = metadata.height || 0

      // Check resolution
      if (width < this.standards.minWidth) {
        errors.push(`Width ${width}px below minimum ${this.standards.minWidth}px`)
      }
      if (height < this.standards.minHeight) {
        errors.push(`Height ${height}px below minimum ${this.standards.minHeight}px`)
      }

      // Check file size
      if (fileSize > this.standards.maxFileSize) {
        errors.push(`File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds ${(this.standards.maxFileSize / 1024 / 1024).toFixed(2)}MB`)
      }

      // Check format
      if (!['jpeg', 'jpg', 'png', 'webp'].includes(metadata.format || '')) {
        errors.push(`Unsupported format: ${metadata.format}`)
      }

      // Calculate sharpness (Laplacian variance method)
      let sharpness: number | undefined
      try {
        sharpness = await this.calculateSharpness(imageBuffer)
        if (sharpness < this.standards.minSharpness) {
          warnings.push(`Image may be blurry (sharpness: ${sharpness.toFixed(2)})`)
        }
      } catch (e) {
        console.warn('Could not calculate sharpness:', e)
      }

      // Calculate brightness
      let brightness: number | undefined
      try {
        brightness = await this.calculateBrightness(imageBuffer)
        if (brightness < this.standards.minBrightness) {
          warnings.push(`Image may be too dark (brightness: ${brightness.toFixed(2)})`)
        } else if (brightness > this.standards.maxBrightness) {
          warnings.push(`Image may be too bright (brightness: ${brightness.toFixed(2)})`)
        }
      } catch (e) {
        console.warn('Could not calculate brightness:', e)
      }

      // Calculate confidence score
      let confidence = 100
      confidence -= errors.length * 25 // Major issues
      confidence -= warnings.length * 10 // Minor issues
      confidence = Math.max(0, Math.min(100, confidence))

      return {
        passed: errors.length === 0,
        errors,
        warnings,
        metrics: {
          width,
          height,
          fileSize,
          sharpness,
          brightness
        },
        confidence
      }

    } catch (error) {
      return {
        passed: false,
        errors: [`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        metrics: {
          width: 0,
          height: 0,
          fileSize: imageBuffer.length
        },
        confidence: 0
      }
    }
  }

  /**
   * Calculate image sharpness using Laplacian variance
   * Higher values = sharper image
   */
  private async calculateSharpness(imageBuffer: Buffer): Promise<number> {
    // Convert to grayscale and resize for faster processing
    const { data, info } = await sharp(imageBuffer)
      .resize(800, 600, { fit: 'inside' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true })

    // Apply Laplacian kernel (edge detection)
    // Higher variance = sharper edges = sharper image
    const width = info.width
    const height = info.height

    let sum = 0
    let count = 0

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x

        // Laplacian kernel
        const laplacian =
          -1 * data[idx - width - 1] + -1 * data[idx - width] + -1 * data[idx - width + 1] +
          -1 * data[idx - 1] + 8 * data[idx] + -1 * data[idx + 1] +
          -1 * data[idx + width - 1] + -1 * data[idx + width] + -1 * data[idx + width + 1]

        sum += laplacian * laplacian
        count++
      }
    }

    const variance = sum / count
    // Normalize to 0-1 scale (typical range is 0-10000)
    return Math.min(variance / 10000, 1)
  }

  /**
   * Calculate average brightness (0-1 scale)
   */
  private async calculateBrightness(imageBuffer: Buffer): Promise<number> {
    const { data } = await sharp(imageBuffer)
      .resize(400, 300, { fit: 'inside' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true })

    // Calculate average pixel value
    const sum = data.reduce((acc, val) => acc + val, 0)
    const avg = sum / data.length

    // Normalize to 0-1 scale
    return avg / 255
  }

  /**
   * Batch validate multiple images
   */
  async validateBatch(imageBuffers: Buffer[]): Promise<QualityResult[]> {
    const results = await Promise.all(
      imageBuffers.map(buffer => this.validateImage(buffer))
    )
    return results
  }

  /**
   * Get validation summary for batch
   */
  getBatchSummary(results: QualityResult[]): {
    passed: number
    failed: number
    passRate: number
    avgConfidence: number
  } {
    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length
    const passRate = results.length > 0 ? (passed / results.length) * 100 : 0
    const avgConfidence = results.length > 0
      ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
      : 0

    return {
      passed,
      failed,
      passRate,
      avgConfidence
    }
  }
}

// Export singleton instance
export const imageQualityValidator = new ImageQualityValidator()
