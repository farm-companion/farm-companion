import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/**
 * Harvest Visual Signature negative prompt
 * Used across all image generation to ensure consistency
 */
const HARVEST_NEGATIVE = 'no people, no person, no faces, nobody, no humans, no watermark, no text, no logo, no AI artifacts, no distorted buildings';

/**
 * Harvest Visual Signature camera settings
 */
const HARVEST_CAMERA = '35mm prime lens, f/2.8, shallow depth of field';
const HARVEST_LIGHTING = 'soft natural overcast light, no harsh shadows';

class ImageGenerator {
  constructor() {
    this.runwareApiKey = process.env.RUNWARE_API_KEY;
    this.falApiKey = process.env.FAL_KEY;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.userAgent = 'FarmCompanion-TwitterWorkflow/2.0.0';
  }

  /**
   * Helper to sleep for backoff between retries
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate a farm shop image using Runware with Pollinations fallback
   * @param {Object} farm - Farm data object
   * @param {Object} opts - Options including width, height, styleHint
   * @returns {Promise<Buffer|null>} Image buffer or null if generation fails
   */
  async generateFarmImage(farm, opts = {}) {
    try {
      console.log(`Generating image for: ${farm.name}`);

      const width = opts.width ?? 1024;
      const height = opts.height ?? 1024;
      const prompt = this.createFarmPrompt(farm, opts.styleHint);
      const seed = this.hashString(farm?.name || 'default');

      console.log(`Image prompt: "${prompt.substring(0, 100)}..."`);

      // Try Runware first (60% cheaper, 40% faster than fal.ai)
      let imageBuffer = await this.callRunware(prompt, {
        width,
        height,
        seed,
        maxAttempts: 3
      });

      // Fall back to Pollinations if Runware fails
      if (!imageBuffer) {
        console.log('Falling back to Pollinations...');
        imageBuffer = await this.callPollinations(prompt, {
          width,
          height,
          seed,
          maxAttempts: 3
        });
      }

      if (imageBuffer) {
        console.log(`Image generated successfully (${imageBuffer.length} bytes)`);
        return imageBuffer;
      } else {
        console.warn('Image generation returned null');
        return null;
      }
    } catch (error) {
      console.error('Image generation failed:', error.message);
      return null;
    }
  }

  /**
   * Build the Harvest Visual Signature farm prompt
   * @param {Object} farm - Farm data object
   * @param {string} styleHint - Optional style hint for different image types
   * @returns {string} Formatted prompt
   */
  createFarmPrompt(farm, styleHint = '') {
    const h = this.hashString(farm?.name || 'default');

    // Image categories with Harvest aesthetic
    const imageCategories = [
      'farm_shop_exterior',
      'scenic_views',
      'seeds_grains',
      'vegetable_garden',
      'farm_landscape'
    ];

    const selectedCategory = imageCategories[h % imageCategories.length];

    let basePrompt = [];
    let specificElements = [];

    switch (selectedCategory) {
      case 'farm_shop_exterior':
        basePrompt = [
          'Charming British farm shop exterior',
          'traditional stone building with rustic character',
          'warm inviting atmosphere',
          'English countryside setting',
          'editorial architectural photography'
        ];
        specificElements = [
          'golden hour lighting', 'soft morning light', 'warm afternoon sun',
          'autumn colors on climbing plants', 'spring flower boxes', 'summer greenery',
          'vintage wooden signage', 'cobblestone forecourt', 'heritage features',
          'weathered oak beams', 'period windows', 'slate roof tiles'
        ];
        break;

      case 'scenic_views':
        basePrompt = [
          'British countryside landscape',
          'rolling green hills and pastoral fields',
          'authentic UK farmland scenery',
          'National Geographic quality',
          'editorial landscape photography'
        ];
        specificElements = [
          'golden wheat fields', 'green pastures with sheep', 'patchwork fields',
          'dry stone walls', 'ancient hedgerows', 'country lanes',
          'distant church spire', 'morning mist in valleys', 'dramatic sky',
          'oak trees in fields', 'wildflower meadows', 'river through farmland'
        ];
        break;

      case 'seeds_grains':
        basePrompt = [
          'Artisan seeds and grains display',
          'natural organic products',
          'rustic wooden bowls and containers',
          'editorial food photography',
          'Waitrose magazine quality'
        ];
        specificElements = [
          'golden wheat grains', 'mixed heritage seeds', 'organic oats',
          'vintage glass jars', 'linen cloth backdrop', 'natural wooden surface',
          'scattered herbs', 'dried lavender', 'artisan bread nearby',
          'warm cream background', 'soft diffused light', 'selective focus'
        ];
        break;

      case 'vegetable_garden':
        basePrompt = [
          'British kitchen garden',
          'traditional raised beds and borders',
          'thriving vegetable patch',
          'editorial garden photography',
          'Country Living magazine style'
        ];
        specificElements = [
          'heritage vegetables', 'climbing runner beans', 'leafy greens',
          'terracotta pots', 'wooden plant labels', 'garden paths',
          'greenhouse in background', 'garden tools', 'watering can',
          'morning dew', 'soft sunlight', 'bee-friendly flowers'
        ];
        break;

      case 'farm_landscape':
        basePrompt = [
          'British agricultural landscape',
          'working farmland vista',
          'authentic UK countryside',
          'panoramic rural scene',
          'editorial landscape photography'
        ];
        specificElements = [
          'freshly plowed fields', 'crop rows extending to horizon', 'harvest time',
          'red barn in distance', 'farmhouse chimney smoke', 'grazing livestock',
          'tractor tracks', 'field margins with wildflowers', 'birds overhead',
          'dramatic cloudscape', 'golden hour', 'misty morning'
        ];
        break;
    }

    // Add location context with regional character
    const county = farm?.location?.county || farm?.county;
    let regionalHint = 'traditional British';
    if (county) {
      const countyLower = county.toLowerCase();
      if (countyLower.includes('cornwall')) regionalHint = 'Cornish granite and slate, coastal character';
      else if (countyLower.includes('cotswold') || countyLower.includes('glouc')) regionalHint = 'honey Cotswold limestone, dry stone walls';
      else if (countyLower.includes('york')) regionalHint = 'Yorkshire millstone grit, moorland backdrop';
      else if (countyLower.includes('devon')) regionalHint = 'Devon cob and thatch, red earth lanes';
      else if (countyLower.includes('kent')) regionalHint = 'Kentish oast houses, hop gardens';
      else if (countyLower.includes('sussex')) regionalHint = 'Sussex flint and brick, South Downs';
      else if (countyLower.includes('norfolk')) regionalHint = 'Norfolk flint, big skies, Broads landscape';
      else if (countyLower.includes('cumbria') || countyLower.includes('lake')) regionalHint = 'Lake District slate, mountain backdrop';
      else regionalHint = `${county} countryside, traditional British`;
    }

    // Select 2-3 specific elements based on farm name hash
    const selectedElements = [];
    for (let i = 0; i < 3; i++) {
      const index = (h + i * 7) % specificElements.length;
      selectedElements.push(specificElements[index]);
    }

    const parts = [
      ...basePrompt,
      HARVEST_CAMERA,
      HARVEST_LIGHTING,
      regionalHint,
      selectedElements.join(', '),
      styleHint,
      `Negative: ${HARVEST_NEGATIVE}`
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Simple hash function for consistent randomization
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Call Runware API using Flux.2 [dev] via Sonic Engine
   * Primary provider - 60% cheaper than fal.ai
   */
  async callRunware(prompt, opts) {
    const attempts = Math.max(1, opts.maxAttempts ?? 3);
    const backoff = Math.max(0, opts.backoffMs ?? 500);

    if (!this.runwareApiKey) {
      console.warn('RUNWARE_API_KEY not found, skipping Runware');
      return null;
    }

    for (let i = 0; i < attempts; i++) {
      const attemptSeed = (opts.seed + i * 9973) >>> 0;

      try {
        console.log(`Runware attempt ${i + 1}/${attempts} (seed: ${attemptSeed})...`);

        const payload = {
          taskType: 'imageInference',
          taskUUID: this.generateUUID(),
          model: 'runware:100@1', // Flux.2 [dev] via Sonic Engine
          positivePrompt: prompt,
          negativePrompt: HARVEST_NEGATIVE,
          width: opts.width || 1024,
          height: opts.height || 1024,
          seed: attemptSeed,
          steps: 28,
          CFGScale: 3.5,
          outputFormat: 'webp',
          numberResults: 1
        };

        const response = await axios.post(
          'https://api.runware.ai/v1',
          [payload],
          {
            headers: {
              'Authorization': `Bearer ${this.runwareApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 120000
          }
        );

        const results = response.data?.data || response.data;
        if (Array.isArray(results) && results.length > 0 && results[0].imageURL) {
          const imageUrl = results[0].imageURL;

          // Download the image
          const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 60000
          });

          if (imageResponse.data?.length > 0) {
            const imageBuffer = Buffer.from(imageResponse.data);
            console.log(`Runware generated image (${imageBuffer.length} bytes, seed: ${attemptSeed})`);
            return imageBuffer;
          }
        }

        await this.sleep(backoff * (i + 1));
      } catch (err) {
        console.warn(`Runware attempt ${i + 1} failed: ${err.message}`);
        await this.sleep(backoff * (i + 1));
      }
    }
    return null;
  }

  /**
   * Generate UUID for Runware requests
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Pollinations with seeded retries (fallback provider)
   */
  async callPollinations(prompt, opts) {
    const attempts = Math.max(1, opts.maxAttempts ?? 3);
    const backoff = Math.max(0, opts.backoffMs ?? 400);

    for (let i = 0; i < attempts; i++) {
      const attemptSeed = (opts.seed + i * 9973) >>> 0;

      const q = new URLSearchParams({
        width: String(Math.min(opts.width, 1600)),
        height: String(Math.min(opts.height, 1600)),
        model: 'flux',
        nologo: 'true',
        seed: String(attemptSeed)
      });
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${q.toString()}`;

      try {
        console.log(`Pollinations attempt ${i + 1}/${attempts} (seed: ${attemptSeed})...`);
        const res = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 90000,
          headers: { 'User-Agent': this.userAgent, Accept: 'image/*' }
        });

        if (res.status >= 200 && res.status < 300 && res.data?.length > 0) {
          const imageBuffer = Buffer.from(res.data);
          console.log(`Pollinations generated image (${imageBuffer.length} bytes, seed: ${attemptSeed})`);
          return imageBuffer;
        }
        await this.sleep(backoff * (i + 1));
      } catch (err) {
        console.warn(`Pollinations attempt ${i + 1} failed: ${err.message}`);
        await this.sleep(backoff * (i + 1));
      }
    }
    return null;
  }

  /**
   * Generate a fallback generic farm shop image
   */
  async generateFallbackImage() {
    const fallbackPrompt = `Charming British farm shop exterior, traditional stone building, ${HARVEST_CAMERA}, ${HARVEST_LIGHTING}, warm inviting atmosphere, English countryside, editorial photography, Negative: ${HARVEST_NEGATIVE}`;

    console.log('Generating fallback farm shop image');
    let imageBuffer = await this.callRunware(fallbackPrompt, {
      width: 1024,
      height: 1024,
      seed: 42,
      maxAttempts: 2
    });
    if (!imageBuffer) {
      imageBuffer = await this.callPollinations(fallbackPrompt, {
        width: 1024,
        height: 1024,
        seed: 42,
        maxAttempts: 2
      });
    }
    return imageBuffer;
  }

  /**
   * Helper for tweet aspect ratio (16:9)
   */
  async generateTweetImage(farm, styleHint) {
    return this.generateFarmImage(farm, { width: 1600, height: 900, styleHint });
  }
}

export const imageGenerator = new ImageGenerator();
