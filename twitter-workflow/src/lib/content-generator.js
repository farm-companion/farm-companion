import { callClaude } from './claude-cli.js';
import dotenv from 'dotenv';
import { 
  getDailySpotlightPrompt, 
  parseOgilvyResponse, 
  generateOgilvyFallback 
} from './ogilvy-prompts.js';
import { imageGenerator } from './image-generator.js';

dotenv.config({ path: '.env.local' });

/**
 * Ogilvy Content Generator for Farm Spotlights
 * 
 * Generates professional, Ogilvy-style content for daily farm spotlights
 * Following David Ogilvy's principles: one clear idea, concrete benefits, no hype
 */
class ContentGenerator {
  /**
   * Generate Ogilvy-style tweet content for a farm spotlight
   * @param {Object} farm - Farm data object
   * @param {Object} options - Content generation options (legacy support)
   */
  async generateFarmSpotlight(farm, _options = {}) {
    try {
      console.log(`✍️  Generating Ogilvy-style content for: ${farm.name}`);
      
      // Use Ogilvy prompt for consistent, professional copy
      const prompt = getDailySpotlightPrompt(farm);
      const response = await callClaude(prompt);
      
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
   * Generate both content and image for a farm spotlight
   * @param {Object} farm - Farm data object
   * @param {Object} options - Generation options
   */
  async generateFarmSpotlightWithImage(farm, options = {}) {
    try {
      console.log(`🎨 Generating content and image for: ${farm.name}`);
      
      // Generate content first
      const contentResult = await this.generateFarmSpotlight(farm, options);
      
      // Generate image
      const imageBuffer = await imageGenerator.generateFarmImage(farm);
      
      return {
        ...contentResult,
        image: imageBuffer,
        hasImage: !!imageBuffer
      };
    } catch (error) {
      console.error(`❌ Content and image generation error: ${error.message}`);
      // Return content without image if image generation fails
      const contentResult = await this.generateFarmSpotlight(farm, options);
      return {
        ...contentResult,
        image: null,
        hasImage: false
      };
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

  /**
   * Test content generation (alias for monitoring system)
   */
  async testGeneration() {
    return await this.testContentGeneration();
  }
}

// Export singleton instance
export const contentGenerator = new ContentGenerator();