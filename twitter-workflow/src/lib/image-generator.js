import axios from 'axios';
import dotenv from 'dotenv';
import { fal } from '@fal-ai/client';
import sharp from 'sharp';

dotenv.config();

// Positive-only prompts - no negative prompts to avoid confusion
const SAFE_POSITIVE_ADDITIONS = 'clean composition, professional photography, food focus, product display, market stall, farm setting, natural lighting, high quality, detailed, sharp focus';

class ImageGenerator {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_IMAGE_API_KEY || process.env.DEEPSEEK_API_KEY;
    this.falApiKey = process.env.FAL_KEY;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.userAgent = 'FarmCompanion-TwitterWorkflow/1.2.0';
    
    // Configure fal.ai client
    if (this.falApiKey) {
      fal.config({
        credentials: this.falApiKey
      });
    }
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
   * @param {Object} opts - Options including width, height, styleHint, contentContext, theme
   * @returns {Promise<Buffer|null>} Image buffer or null if generation fails
   */
  async generateFarmImage(farm, opts = {}) {
    try {
      console.log(`🎨 Generating image for: ${farm.name}`);
      
      const width = opts.width ?? 1024;
      const height = opts.height ?? 1024;
      
      // Use theme from content coordination if provided
      const styleHint = opts.theme || opts.styleHint || this.determineStyleFromFarm(farm);
      const prompt = this.createFarmPrompt(farm, styleHint, opts.contentContext);
      const seed = this.hashString(farm?.name || 'default');
      
      console.log(`🎨 Image prompt: "${prompt.substring(0, 100)}..."`);
      console.log(`🎨 Using theme: ${styleHint}`);
      
      // Qwen Image first (primary method)
      let imageBuffer = await this.callQwenImageAPI(prompt, { 
        width, 
        height, 
        seed, 
        maxAttempts: 3 
      });
      
      // Fall back to Pollinations if Qwen fails
      if (!imageBuffer) {
        console.log('🔄 Falling back to Pollinations...');
        imageBuffer = await this.callPollinations(prompt, { 
          width, 
          height, 
          seed, 
          maxAttempts: 3 
        });
      }
      
      // Final fallback to Hugging Face
      if (!imageBuffer) {
        console.log('🔄 Falling back to Hugging Face...');
        imageBuffer = await this.callHuggingFaceImageAPI(
          prompt,
          { width, height }
        );
      }
      
      if (imageBuffer) {
        // Add farm URL overlay to the image
        const imageWithUrl = await this.addFarmUrlOverlay(imageBuffer, farm);
        console.log(`✅ Image generated successfully (${imageWithUrl.length} bytes) with embedded URL`);
        return imageWithUrl;
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
   * Determine style hint from farm data
   * @param {Object} farm - Farm data object
   */
  determineStyleFromFarm(farm) {
    const nameLower = (farm?.name || '').toLowerCase();
    const produceLower = (farm?.produce || '').toLowerCase();
    
    if (produceLower.includes('beef') || produceLower.includes('lamb') || produceLower.includes('venison')) {
      return 'meat_products';
    } else if (produceLower.includes('chicken') || produceLower.includes('poultry') || produceLower.includes('eggs')) {
      return 'poultry_products';
    } else if (produceLower.includes('dairy') || produceLower.includes('milk') || produceLower.includes('cheese')) {
      return 'dairy_products';
    } else if (produceLower.includes('fruit') || produceLower.includes('apple') || produceLower.includes('berry')) {
      return 'fruit_display';
    } else if (produceLower.includes('vegetable') || produceLower.includes('produce')) {
      return 'fresh_produce';
    } else if (produceLower.includes('bread') || produceLower.includes('bakery')) {
      return 'bakery_items';
    } else if (nameLower.includes('garden') || nameLower.includes('growing')) {
      return 'vegetable_garden';
    } else {
      return 'farm_landscape'; // Default
    }
  }

  /**
   * Build the farm prompt with deterministic variety and a strong negative section.
   * Now includes farm produce, fruits, scenic views, and seeds for diverse content.
   * @param {Object} farm - Farm data object
   * @param {string} styleHint - Optional style hint for different image types
   * @param {string} contentContext - Content context for better image-text matching
   * @returns {string} Formatted prompt
   */
  createFarmPrompt(farm, styleHint = '', contentContext = '') {
    const h = this.hashString(farm?.name || 'default');
    
    // Use provided styleHint or determine from farm data
    const imageCategories = [
      'farm_shop_exterior',
      'farm_produce',
      'fruit_display',
      'scenic_views',
      'seeds_grains',
      'vegetable_garden',
      'farm_landscape',
      'produce_still_life',
      'meat_products',
      'dairy_products',
      'fresh_produce',
      'poultry_products',
      'bakery_items'
    ];
    
    // Use styleHint if provided, otherwise use hash-based selection
    const selectedCategory = styleHint || imageCategories[h % imageCategories.length];
    
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
        
      case 'farm_produce':
        basePrompt = [
          'Fresh farm produce display',
          'wooden crates and baskets',
          'natural lighting',
          'farm shop interior',
          'high quality product photography',
          'still life composition',
          'no people visible'
        ];
        specificElements = [
          'carrots', 'potatoes', 'onions', 'cabbage', 'lettuce', 'tomatoes',
          'cucumbers', 'peppers', 'mushrooms', 'herbs', 'garlic', 'beets',
          'radishes', 'spinach', 'kale', 'broccoli', 'cauliflower', 'squash',
          'pumpkins', 'sweet potatoes', 'turnips', 'parsnips'
        ];
        break;
        
      case 'fruit_display':
        basePrompt = [
          'Fresh fruit display',
          'colorful seasonal fruits',
          'natural lighting',
          'farm shop or market stall',
          'high quality product photography',
          'still life composition',
          'no people visible'
        ];
        specificElements = [
          'apples', 'pears', 'plums', 'cherries', 'strawberries', 'raspberries',
          'blackberries', 'blueberries', 'grapes', 'oranges', 'lemons', 'limes',
          'bananas', 'peaches', 'apricots', 'figs', 'pomegranates', 'kiwi',
          'mangoes', 'pineapples', 'melons', 'watermelons'
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
        
      case 'produce_still_life':
        basePrompt = [
          'Farm produce still life',
          'artisan food photography',
          'natural materials',
          'soft natural lighting',
          'high quality still life',
          'carefully arranged composition',
          'no people visible'
        ];
        specificElements = [
          'wooden cutting board', 'wicker baskets', 'ceramic bowls', 'linen cloth',
          'rustic table', 'natural textures', 'earth tones', 'warm lighting',
          'shallow depth of field', 'artisan presentation', 'farm-to-table style',
          'organic arrangement', 'seasonal colors', 'natural shadows',
          'textured backgrounds', 'vintage props', 'handmade elements'
        ];
        break;
        
      case 'meat_products':
        basePrompt = [
          'Farm meat products display',
          'butchery counter',
          'natural lighting',
          'high quality food photography',
          'professional presentation',
          'empty butchery counter',
          'meat cuts on display',
          'clean food photography'
        ];
        specificElements = [
          'grass-fed beef cuts', 'lamb cuts', 'venison', 'game meat',
          'butcher paper', 'wooden cutting boards', 'butcher knives', 'meat scales',
          'refrigerated display', 'artisan butchery', 'traditional cuts', 'quality marbling'
        ];
        break;
        
      case 'dairy_products':
        basePrompt = [
          'Farm dairy products display',
          'cheese and milk products',
          'natural lighting',
          'high quality food photography',
          'artisan presentation',
          'no people visible'
        ];
        specificElements = [
          'artisan cheese wheels', 'fresh milk bottles', 'yogurt pots', 'butter blocks',
          'cheese boards', 'dairy display case', 'glass milk bottles', 'cheese knives',
          'traditional dairy', 'farm-fresh milk', 'aged cheeses', 'cream products'
        ];
        break;
        
      case 'fresh_produce':
        basePrompt = [
          'Fresh farm produce display',
          'seasonal vegetables only',
          'natural lighting',
          'high quality produce photography',
          'market stall presentation',
          'empty market stall',
          'vegetables on display',
          'clean food photography'
        ];
        specificElements = [
          'fresh vegetables', 'seasonal vegetables', 'organic vegetables', 'root vegetables',
          'leafy greens', 'tomatoes', 'carrots', 'potatoes', 'onions', 'peppers',
          'cucumbers', 'lettuce', 'spinach', 'kale', 'cabbage', 'broccoli'
        ];
        break;
        
      case 'poultry_products':
        basePrompt = [
          'Farm poultry products display',
          'free-range chicken and eggs',
          'natural lighting',
          'high quality food photography',
          'professional presentation',
          'no people visible'
        ];
        specificElements = [
          'free-range chicken', 'fresh eggs', 'poultry display', 'egg cartons',
          'chicken cuts', 'whole chicken', 'organic poultry', 'farm-fresh eggs',
          'poultry counter', 'refrigerated poultry', 'traditional poultry', 'quality poultry'
        ];
        break;
        
      case 'bakery_items':
        basePrompt = [
          'Farm bakery display',
          'fresh baked goods',
          'natural lighting',
          'high quality bakery photography',
          'artisan presentation',
          'no people visible'
        ];
        specificElements = [
          'fresh bread loaves', 'artisan breads', 'pastries', 'cakes', 'cookies',
          'wooden bread boards', 'basket displays', 'bakery cases', 'flour dusting',
          'traditional baking', 'handmade bread', 'sourdough', 'whole grain bread'
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
      SAFE_POSITIVE_ADDITIONS
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
   * Call Qwen Image via fal.ai client (official implementation)
   * @param {string} prompt - Image generation prompt
   * @param {Object} opts - Options including width, height, seed, maxAttempts
   * @returns {Promise<Buffer|null>} Image buffer or null
   */
  async callQwenImageAPI(prompt, opts) {
    for (let attempt = 1; attempt <= (opts.maxAttempts || this.maxRetries); attempt++) {
      try {
        console.log(`🔄 Qwen Image generation attempt ${attempt}/${opts.maxAttempts || this.maxRetries}`);
        
        // Enhanced prompt with Qwen Image magic words for better quality
        const enhancedPrompt = `${prompt}, Ultra HD, 4K, cinematic composition.`;
        
        // Map dimensions to Qwen Image supported aspect ratios
        const aspectRatios = {
          "1:1": { width: 1328, height: 1328 },
          "16:9": { width: 1664, height: 928 },
          "9:16": { width: 928, height: 1664 },
          "4:3": { width: 1472, height: 1140 },
          "3:4": { width: 1140, height: 1472 },
          "3:2": { width: 1584, height: 1056 },
          "2:3": { width: 1056, height: 1584 }
        };
        
        // Find closest aspect ratio or use 16:9 as default
        let targetWidth = opts.width || 1024;
        let targetHeight = opts.height || 1024;
        
        // Find the closest supported aspect ratio
        const targetRatio = targetWidth / targetHeight;
        let closestRatio = "16:9";
        let minDiff = Infinity;
        
        for (const [ratio, dimensions] of Object.entries(aspectRatios)) {
          const ratioValue = dimensions.width / dimensions.height;
          const diff = Math.abs(ratioValue - targetRatio);
          if (diff < minDiff) {
            minDiff = diff;
            closestRatio = ratio;
          }
        }
        
        const { width, height } = aspectRatios[closestRatio];
        
        // Use fal.ai client as per documentation
        const result = await fal.subscribe("fal-ai/qwen-image", {
          input: {
            prompt: enhancedPrompt,
            width: width,
            height: height,
            num_inference_steps: 50,
            true_cfg_scale: 4.0,
            seed: opts.seed || Math.floor(Math.random() * 1000000)
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              console.log("🔄 Qwen Image generation in progress...");
            }
          },
        });

        if (result && result.data && result.data.images && result.data.images.length > 0) {
          const imageUrl = result.data.images[0].url;
          console.log('🖼️  Image URL:', imageUrl);
          
          // Download the image
          const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
          });

          if (imageResponse.data && imageResponse.data.length > 0) {
            const imageBuffer = Buffer.from(imageResponse.data);
            console.log(`✅ Qwen Image generated successfully (${imageBuffer.length} bytes, seed: ${opts.seed}, ratio: ${closestRatio})`);
            return imageBuffer;
          }
        }
        
        console.log('❌ No images in result:', result);
        throw new Error('No image returned from fal.ai');
        
      } catch (error) {
        console.error(`❌ Qwen Image generation attempt ${attempt} failed:`, error.message);
        
        if (error.response) {
          console.error(`📊 Status: ${error.response.status}, Data:`, error.response.data);
        }
        
        if (attempt === (opts.maxAttempts || this.maxRetries)) {
          console.error('❌ All Qwen Image generation attempts failed');
          return null;
        }
        
        // Wait before retry with exponential backoff
        await this.sleep(this.retryDelay * attempt);
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

  /**
   * Add farm URL overlay to the generated image
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {Object} farm - Farm data object
   * @returns {Promise<Buffer>} Image buffer with URL overlay
   */
  async addFarmUrlOverlay(imageBuffer, farm) {
    try {
      const farmUrl = `https://www.farmcompanion.co.uk/shop/${farm.slug}`;
      console.log(`🔗 Adding farm URL overlay: ${farmUrl}`);
      
      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      const { width, height } = metadata;
      
      // Create SVG text overlay
      const fontSize = Math.max(24, Math.floor(width / 40)); // Responsive font size
      const textY = height - 40; // Position near bottom
      const textX = 20; // Left margin
      
      const svgOverlay = `
        <svg width="${width}" height="${height}">
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="black" flood-opacity="0.5"/>
            </filter>
          </defs>
          <rect x="${textX - 10}" y="${textY - fontSize - 10}" width="${farmUrl.length * fontSize * 0.6 + 20}" height="${fontSize + 20}" 
                fill="rgba(0,0,0,0.7)" rx="8" ry="8"/>
          <text x="${textX}" y="${textY}" 
                font-family="Arial, sans-serif" 
                font-size="${fontSize}" 
                font-weight="bold" 
                fill="white" 
                filter="url(#shadow)">
            ${farmUrl}
          </text>
        </svg>
      `;
      
      // Apply overlay to image
      const imageWithOverlay = await sharp(imageBuffer)
        .composite([{
          input: Buffer.from(svgOverlay),
          top: 0,
          left: 0
        }])
        .jpeg({ quality: 90 })
        .toBuffer();
      
      console.log(`✅ URL overlay added successfully`);
      return imageWithOverlay;
      
    } catch (error) {
      console.error('❌ Failed to add URL overlay:', error.message);
      return imageBuffer; // Return original if overlay fails
    }
  }
}

export const imageGenerator = new ImageGenerator();
