import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Stronger negative prompt used across providers
const NO_FACE_NEGATIVE = 'no people, no person, no faces, no face, nobody, no humans, no portrait, no selfie, no crowds, no watermark, no text, no logo';

class ImageGenerator {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_IMAGE_API_KEY || process.env.DEEPSEEK_API_KEY;
    this.falApiKey = process.env.FAL_KEY;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.userAgent = 'FarmCompanion-TwitterWorkflow/1.2.0';
  }

  /**
   * Helper to sleep for backoff between retries
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate a farm shop image with no-faces protection and seeded retries
   * @param {Object} farm - Farm data object
   * @param {Object} opts - Options including width, height, styleHint
   * @returns {Promise<Buffer|null>} Image buffer or null if generation fails
   */
  async generateFarmImage(farm, opts = {}) {
    try {
      console.log(`🎨 Generating image for: ${farm.name}`);
      
      const width = opts.width ?? 1024;
      const height = opts.height ?? 1024;
      const prompt = this.createFarmPrompt(farm, opts.styleHint);
      const seed = this.hashString(farm?.name || 'default');
      
      console.log(`🎨 Image prompt: "${prompt.substring(0, 100)}..."`);
      
      // fal.ai FLUX first with multi-seed retries
      let imageBuffer = await this.callFalAI(prompt, { 
        width, 
        height, 
        seed, 
        maxAttempts: 3 
      });
      
      // Fall back to Pollinations if fal.ai fails
      if (!imageBuffer) {
        console.log('🔄 Falling back to Pollinations...');
        imageBuffer = await this.callPollinations(prompt, { 
          width, 
          height, 
          seed, 
          maxAttempts: 3 
        });
      }
      
      if (imageBuffer) {
        console.log(`✅ Image generated successfully (${imageBuffer.length} bytes)`);
        return imageBuffer;
      } else {
        console.warn('⚠️  Image generation returned null');
        return null;
      }
    } catch (error) {
      console.error('❌ Image generation failed:', error.message);
      return null;
    }
  }

  /**
   * Build the farm prompt with deterministic variety and a strong negative section.
   * Now includes farm produce, fruits, scenic views, and seeds for diverse content.
   * @param {Object} farm - Farm data object
   * @param {string} styleHint - Optional style hint for different image types
   * @returns {string} Formatted prompt
   */
  createFarmPrompt(farm, styleHint = '') {
    const h = this.hashString(farm?.name || 'default');
    
    // Determine image category based on farm name hash
    // Removed 'farm_produce', 'fruit_display', and 'produce_still_life' due to AI generating abnormal-looking fruits/vegetables
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
          'Professional UK farm shop exterior',
          'rustic stone building',
          'inviting atmosphere',
          'countryside setting',
          'high quality',
          'wide-angle building exterior from street view',
          'closed entrance, empty walkway, no people visible'
        ];
        specificElements = [
          'golden hour lighting', 'morning mist', 'sunny day', 'overcast sky',
          'autumn colors', 'spring flowers', 'winter scene', 'summer vibrancy',
          'vintage charm', 'modern rustic style', 'cozy atmosphere',
          'welcoming entrance', 'traditional signage', 'wooden shutters',
          'stone pathway', 'garden display', 'seasonal decorations'
        ];
        break;
        
        
      case 'scenic_views':
        basePrompt = [
          'UK countryside landscape',
          'rolling hills and fields',
          'farmland scenery',
          'natural lighting',
          'high quality landscape photography',
          'wide panoramic view',
          'no people visible'
        ];
        specificElements = [
          'wheat fields', 'barley fields', 'corn fields', 'sunflower fields',
          'lavender fields', 'rapeseed fields', 'hedgerows', 'dry stone walls',
          'country lanes', 'farm buildings', 'barns', 'silos', 'windmills',
          'rivers', 'streams', 'woodlands', 'meadows', 'pastures', 'orchards',
          'vineyards', 'greenhouses', 'polytunnels'
        ];
        break;
        
      case 'seeds_grains':
        basePrompt = [
          'Farm seeds and grains',
          'natural organic products',
          'wooden bowls and containers',
          'natural lighting',
          'high quality product photography',
          'still life composition',
          'no people visible'
        ];
        specificElements = [
          'wheat grains', 'barley grains', 'oats', 'rye', 'quinoa', 'rice',
          'sunflower seeds', 'pumpkin seeds', 'flax seeds', 'chia seeds',
          'sesame seeds', 'poppy seeds', 'hemp seeds', 'millet', 'buckwheat',
          'lentils', 'beans', 'peas', 'corn kernels', 'sorghum', 'amaranth'
        ];
        break;
        
      case 'vegetable_garden':
        basePrompt = [
          'UK vegetable garden',
          'raised beds and planters',
          'growing vegetables',
          'natural lighting',
          'high quality garden photography',
          'close-up garden view',
          'no people visible'
        ];
        specificElements = [
          'tomato plants', 'lettuce rows', 'carrot tops', 'onion greens',
          'cabbage heads', 'broccoli florets', 'cauliflower heads', 'pepper plants',
          'cucumber vines', 'bean plants', 'pea plants', 'herb garden',
          'strawberry plants', 'rhubarb', 'asparagus', 'artichokes',
          'leek plants', 'garlic shoots', 'potato plants', 'sweet corn'
        ];
        break;
        
      case 'farm_landscape':
        basePrompt = [
          'UK farm landscape',
          'agricultural fields',
          'countryside vista',
          'natural lighting',
          'high quality landscape photography',
          'aerial or elevated view',
          'no people visible'
        ];
        specificElements = [
          'plowed fields', 'planted rows', 'harvested fields', 'fallow fields',
          'crop rotation', 'field boundaries', 'farm tracks', 'irrigation systems',
          'farm machinery', 'barns and outbuildings', 'farmhouse', 'silos',
          'grain storage', 'livestock areas', 'fencing', 'gates', 'trees',
          'hedgerows', 'wildflower margins', 'ponds', 'streams'
        ];
        break;
        
    }
    
    // Add location context
    const county = farm?.location?.county
      ? `${farm.location.county} countryside, traditional British`
      : 'traditional British';
    
    // Select 2-3 specific elements based on farm name hash
    const selectedElements = [];
    for (let i = 0; i < 3; i++) {
      const index = (h + i * 7) % specificElements.length;
      selectedElements.push(specificElements[index]);
    }
    
    // Add farm type context
    const nameLower = (farm?.name || '').toLowerCase();
    let typeContext = '';
    if (nameLower.includes('butcher')) typeContext = 'butchery and meat products';
    else if (nameLower.includes('cafe')) typeContext = 'cafe and bakery items';
    else if (nameLower.includes('farm shop')) typeContext = 'farm shop products';
    else typeContext = 'local farm products';
    
    const parts = [
      ...basePrompt,
      county,
      typeContext,
      styleHint,
      selectedElements.join(', '),
      // embed negatives directly; Pollinations doesn't expose a separate negative parameter
      `Negative: ${NO_FACE_NEGATIVE}`
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Simple hash function for consistent randomization
   * @param {string} str - String to hash
   * @returns {number} Hash value
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Call Hugging Face free image generation API
   * @param {string} prompt - Image generation prompt
   * @returns {Promise<Buffer|null>} Image buffer or null
   */
  async callHuggingFaceImageAPI(prompt) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Image generation attempt ${attempt}/${this.maxRetries}`);
        
        const response = await axios.post(
          'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
          {
            inputs: prompt,
            parameters: {
              num_inference_steps: 20,
              guidance_scale: 7.5,
              width: 1024,
              height: 1024
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 120000, // 2 minute timeout for free API
            responseType: 'arraybuffer'
          }
        );

        if (response.data && response.data.length > 0) {
          const imageBuffer = Buffer.from(response.data);
          return imageBuffer;
        } else {
          console.warn(`⚠️  Unexpected API response format`);
          return null;
        }
      } catch (error) {
        console.error(`❌ Image generation attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.maxRetries) {
          console.error('❌ All image generation attempts failed');
          return null;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
    
    return null;
  }

  /**
   * fal.ai FLUX with seeded retries. We try multiple seeds if needed.
   * Nothing breaks: same return type Buffer|null, same inputs.
   * @param {string} prompt - Image generation prompt
   * @param {Object} opts - Options including width, height, seed, maxAttempts, backoffMs
   * @returns {Promise<Buffer|null>} Image buffer or null
   */
  async callFalAI(prompt, opts) {
    const attempts = Math.max(1, opts.maxAttempts ?? 3);
    const backoff = Math.max(0, opts.backoffMs ?? 400);

    if (!this.falApiKey) {
      console.warn('⚠️  FAL_KEY not found, skipping fal.ai generation');
      return null;
    }

    for (let i = 0; i < attempts; i++) {
      // vary seed each attempt but stay deterministic around the base seed
      const attemptSeed = (opts.seed + i * 9973) >>> 0;

      try {
        console.log(`🔄 fal.ai FLUX attempt ${i + 1}/${attempts} (seed: ${attemptSeed})...`);
        
        // Use the full prompt for production
        
        // Map dimensions to valid image_size values
        let imageSize = 'square';
        if (opts.width === 1024 && opts.height === 1024) {
          imageSize = 'square';
        } else if (opts.width === 1600 && opts.height === 900) {
          imageSize = 'landscape_16_9';
        } else if (opts.width === 900 && opts.height === 1600) {
          imageSize = 'portrait_16_9';
        }
        
        const response = await axios.post(
          'https://fal.run/fal-ai/flux',
          {
            prompt: prompt,
            image_size: imageSize,
            num_inference_steps: 20,
            guidance_scale: 7.5,
            seed: attemptSeed,
            enable_safety_checker: true
          },
          {
            headers: {
              'Authorization': `Key ${this.falApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 120000, // 2 minute timeout
            responseType: 'json'
          }
        );

        if (response.data && response.data.images && response.data.images.length > 0) {
          const imageUrl = response.data.images[0].url;
          if (imageUrl) {
            // Download the image from the URL
            const imageResponse = await axios.get(imageUrl, {
              responseType: 'arraybuffer',
              timeout: 60000
            });
            
            if (imageResponse.data && imageResponse.data.length > 0) {
              const imageBuffer = Buffer.from(imageResponse.data);
              console.log(`✅ fal.ai FLUX generated image (${imageBuffer.length} bytes, seed: ${attemptSeed})`);
              return imageBuffer;
            }
          }
        }
        
        // retry on unexpected response
        await this.sleep(backoff * (i + 1));
      } catch (err) {
        console.warn(`⚠️  fal.ai FLUX attempt ${i + 1} failed: ${err.message}`);
        if (err.response) {
          console.warn(`Response status: ${err.response.status}`);
          console.warn(`Response data:`, err.response.data);
        }
        // network/timeouts → retry with next seed
        await this.sleep(backoff * (i + 1));
      }
    }
    return null;
  }

  /**
   * Pollinations with seeded retries. We try multiple seeds if needed.
   * Nothing breaks: same return type Buffer|null, same inputs.
   * @param {string} prompt - Image generation prompt
   * @param {Object} opts - Options including width, height, seed, maxAttempts, backoffMs
   * @returns {Promise<Buffer|null>} Image buffer or null
   */
  async callPollinations(prompt, opts) {
    const attempts = Math.max(1, opts.maxAttempts ?? 3);
    const backoff = Math.max(0, opts.backoffMs ?? 400);

    for (let i = 0; i < attempts; i++) {
      // vary seed each attempt but stay deterministic around the base seed
      const attemptSeed = (opts.seed + i * 9973) >>> 0;

      const q = new URLSearchParams({
        width: String(opts.width),
        height: String(opts.height),
        model: 'flux',
        nologo: 'true',
        seed: String(attemptSeed)
      });
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${q.toString()}`;

      try {
        console.log(`🔄 Pollinations attempt ${i + 1}/${attempts} (seed: ${attemptSeed})...`);
        const res = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 60000,
          headers: { 'User-Agent': this.userAgent, Accept: 'image/*' }
        });
        
        if (res.status >= 200 && res.status < 300 && res.data?.length > 0) {
          const imageBuffer = Buffer.from(res.data);
          console.log(`✅ Pollinations AI generated image (${imageBuffer.length} bytes, seed: ${attemptSeed})`);
          return imageBuffer;
        }
        // retry on unexpected status
        await this.sleep(backoff * (i + 1));
      } catch (err) {
        console.warn(`⚠️  Pollinations attempt ${i + 1} failed: ${err.message}`);
        // network/timeouts → retry with next seed
        await this.sleep(backoff * (i + 1));
      }
    }
    return null;
  }

  /**
   * Call free image generation API using Pollinations AI (legacy method)
   * @param {string} prompt - Image generation prompt
   * @returns {Promise<Buffer|null>} Image buffer or null
   */
  async callAlternativeImageAPI(prompt) {
    try {
      console.log('🔄 Trying Pollinations AI (free, no auth required)...');
      
      // Use Pollinations AI - completely free, no API key required
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true`;
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 60000 // 1 minute timeout
      });

      if (response.data && response.data.length > 0) {
        const imageBuffer = Buffer.from(response.data);
        console.log(`✅ Pollinations AI generated image (${imageBuffer.length} bytes)`);
        return imageBuffer;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Pollinations AI failed:', error.message);
      return null;
    }
  }

  /**
   * Generate a fallback generic farm shop image
   * @returns {Promise<Buffer|null>} Generic image buffer
   */
  async generateFallbackImage() {
    const fallbackPrompt = "Professional UK farm shop exterior, rustic stone building, warm lighting, local produce display, inviting atmosphere, countryside setting, high quality, square format, 1024x1024, traditional British architecture";
    
    console.log('🔄 Generating fallback farm shop image');
    let imageBuffer = await this.callHuggingFaceImageAPI(fallbackPrompt);
    if (!imageBuffer) {
      imageBuffer = await this.callAlternativeImageAPI(fallbackPrompt);
    }
    return imageBuffer;
  }

  /**
   * Helper for tweet aspect ratio (16:9). Keeps the same no-face logic.
   * @param {Object} farm - Farm data object
   * @param {string} styleHint - Optional style hint
   * @returns {Promise<Buffer|null>} Image buffer or null
   */
  async generateTweetImage(farm, styleHint) {
    return this.generateFarmImage(farm, { width: 1600, height: 900, styleHint });
  }
}

export const imageGenerator = new ImageGenerator();
