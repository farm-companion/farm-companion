import axios from 'axios';
import dotenv from 'dotenv';
import { 
  getDailySpotlightPrompt, 
  parseOgilvyResponse, 
  generateOgilvyFallback 
} from './ogilvy-prompts.js';
import { imageGenerator } from './image-generator.js';

dotenv.config();

/**
 * Ogilvy Content Generator for Farm Spotlights
 * 
 * Generates professional, Ogilvy-style content for daily farm spotlights
 * Following David Ogilvy's principles: one clear idea, concrete benefits, no hype
 */
class ContentGenerator {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Generate Ogilvy-style tweet content for a farm spotlight
   * @param {Object} farm - Farm data object
   * @param {Object} options - Content generation options (legacy support)
   */
  async generateFarmSpotlight(farm, options = {}) {
    try {
      console.log(`✍️  Generating Ogilvy-style content for: ${farm.name}`);
      
      // Use Ogilvy prompt for consistent, professional copy
      const prompt = getDailySpotlightPrompt(farm);
      const response = await this.callDeepSeekAPI(prompt);
      
      if (response.success) {
        const parsed = parseOgilvyResponse(response.content);
        
        if (parsed.success) {
          console.log(`✅ Generated Ogilvy content (${parsed.body.length} chars)`);
          console.log(`📝 Notes: ${parsed.notes}`);
          
          return {
            success: true,
            content: parsed.body,
            alt_text: parsed.alt_text,
            notes: parsed.notes,
            hashtagCount: parsed.hashtagCount,
            method: 'ogilvy-ai',
            length: parsed.body.length
          };
        } else {
          console.log(`⚠️  Ogilvy parsing failed: ${parsed.error}`);
          return this.generateFallbackContent(farm);
        }
      } else {
        console.log(`⚠️  AI generation failed: ${response.error}`);
        return this.generateFallbackContent(farm);
      }
      
    } catch (error) {
      console.error(`❌ Content generation error: ${error.message}`);
      return this.generateFallbackContent(farm);
    }
  }

  /**
   * Generate both content and image for a farm spotlight with coordination
   * @param {Object} farm - Farm data object
   * @param {Object} options - Generation options
   */
  async generateFarmSpotlightWithImage(farm, options = {}) {
    try {
      console.log(`🎨 Generating coordinated content and image for: ${farm.name}`);
      
      // Filter farm data to remove pork-related content
      const filteredFarm = this.filterPorkContent(farm);
      
      // Generate content first
      const contentResult = await this.generateFarmSpotlight(filteredFarm, options);
      
      // Generate image with content context for better matching
      const imageBuffer = await imageGenerator.generateFarmImage(filteredFarm, {
        contentContext: contentResult.content,
        theme: this.extractContentTheme(contentResult.content)
      });
      
      return {
        ...contentResult,
        image: imageBuffer,
        hasImage: !!imageBuffer
      };
    } catch (error) {
      console.error(`❌ Content and image generation error: ${error.message}`);
      // Return content without image if image generation fails
      const filteredFarm = this.filterPorkContent(farm);
      const contentResult = await this.generateFarmSpotlight(filteredFarm, options);
      return {
        ...contentResult,
        image: null,
        hasImage: false
      };
    }
  }

  /**
   * Filter out pork-related content from farm data
   * @param {Object} farm - Farm data object
   */
  filterPorkContent(farm) {
    const filtered = { ...farm };
    
    // Filter produce
    if (filtered.produce) {
      const porkKeywords = ['pork', 'pig', 'bacon', 'ham', 'sausage', 'chorizo', 'prosciutto'];
      const hasPork = porkKeywords.some(keyword => 
        filtered.produce.toLowerCase().includes(keyword)
      );
      
      if (hasPork) {
        // Replace pork content with alternative produce
        filtered.produce = filtered.produce
          .replace(/pork[^,]*/gi, 'grass-fed beef')
          .replace(/pig[^,]*/gi, 'free-range chicken')
          .replace(/bacon[^,]*/gi, 'artisan cheese')
          .replace(/ham[^,]*/gi, 'local honey')
          .replace(/sausage[^,]*/gi, 'fresh vegetables')
          .replace(/chorizo[^,]*/gi, 'seasonal fruit')
          .replace(/prosciutto[^,]*/gi, 'organic eggs');
      }
    }
    
    // Filter signature
    if (filtered.signature) {
      const porkKeywords = ['pork', 'pig', 'bacon', 'ham', 'sausage', 'chorizo', 'prosciutto'];
      const hasPork = porkKeywords.some(keyword => 
        filtered.signature.toLowerCase().includes(keyword)
      );
      
      if (hasPork) {
        filtered.signature = filtered.signature
          .replace(/pork[^,]*/gi, 'grass-fed beef')
          .replace(/pig[^,]*/gi, 'free-range chicken')
          .replace(/bacon[^,]*/gi, 'artisan cheese')
          .replace(/ham[^,]*/gi, 'local honey')
          .replace(/sausage[^,]*/gi, 'fresh vegetables')
          .replace(/chorizo[^,]*/gi, 'seasonal fruit')
          .replace(/prosciutto[^,]*/gi, 'organic eggs');
      }
    }
    
    return filtered;
  }

  /**
   * Extract theme from content for image coordination
   * @param {string} content - Generated tweet content
   */
  extractContentTheme(content) {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('beef') || contentLower.includes('lamb') || contentLower.includes('venison')) {
      return 'meat_products';
    } else if (contentLower.includes('chicken') || contentLower.includes('poultry') || contentLower.includes('eggs')) {
      return 'poultry_products';
    } else if (contentLower.includes('dairy') || contentLower.includes('milk') || contentLower.includes('cheese')) {
      return 'dairy_products';
    } else if (contentLower.includes('fruit') || contentLower.includes('apple') || contentLower.includes('berry')) {
      return 'fruit_display';
    } else if (contentLower.includes('vegetable') || contentLower.includes('produce')) {
      return 'fresh_produce';
    } else if (contentLower.includes('bread') || contentLower.includes('bakery')) {
      return 'bakery_items';
    } else if (contentLower.includes('garden') || contentLower.includes('growing')) {
      return 'vegetable_garden';
    } else {
      return 'farm_landscape'; // Default theme
    }
  }

  /**
   * Generate fallback content using Ogilvy principles
   * @param {Object} farm - Farm data object
   */
  generateFallbackContent(farm) {
    console.log('🔄 Using Ogilvy fallback content');
    const fallback = generateOgilvyFallback(farm);
    
    // Ensure the fallback has the expected structure
    return {
      success: true,
      content: fallback.body,
      alt_text: fallback.alt_text,
      notes: fallback.notes,
      hashtagCount: fallback.hashtagCount,
      method: 'fallback',
      length: fallback.body.length
    };
  }

  /**
   * Call DeepSeek API with retry logic
   * @param {string} prompt - The prompt to send
   */
  async callDeepSeekAPI(prompt) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'DeepSeek API key not configured'
      };
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${this.baseUrl}/v1/chat/completions`,
          {
            model: 'deepseek-chat',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3, // Lower temperature for more consistent, professional output
            max_tokens: 500,
            stream: false
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        if (response.data && response.data.choices && response.data.choices[0]) {
          return {
            success: true,
            content: response.data.choices[0].message.content.trim()
          };
        } else {
          throw new Error('Invalid response format from DeepSeek API');
        }

      } catch (error) {
        console.error(`❌ DeepSeek API attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.maxRetries) {
          return {
            success: false,
            error: `DeepSeek API failed after ${this.maxRetries} attempts: ${error.message}`
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  /**
   * Test content generation with sample data
   * @param {Object} sampleFarm - Sample farm data for testing
   */
  async testContentGeneration(sampleFarm = null) {
    const testFarm = sampleFarm || {
      name: 'Willow Brook Farm',
      town: 'Towcester',
      county: 'Northamptonshire',
      produce: 'grass-fed beef, small-batch dairy',
      signature: 'Family-run farm shop with pasture-raised meat',
      slug: 'willow-brook-farm'
    };

    console.log('🧪 Testing Ogilvy content generation...');
    console.log(`📊 Test farm: ${testFarm.name}`);
    
    const result = await this.generateFarmSpotlight(testFarm);
    
    if (result.success) {
      console.log('✅ Test successful!');
      console.log(`📝 Generated content: "${result.content}"`);
      console.log(`📊 Length: ${result.length} characters`);
      console.log(`🏷️  Hashtags: ${result.hashtagCount}`);
      console.log(`📝 Notes: ${result.notes}`);
      if (result.alt_text) {
        console.log(`🖼️  Alt text: "${result.alt_text}"`);
      }
    } else {
      console.log('❌ Test failed:', result.error);
    }
    
    return result;
  }
}

// Export singleton instance
export const contentGenerator = new ContentGenerator();