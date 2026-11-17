import { callClaude } from './claude-cli.js';
import dotenv from 'dotenv';
import { 
  getProfileBioPrompt, 
  getPinnedTweetPrompt, 
  getAltTextPrompt 
} from './ogilvy-prompts.js';

dotenv.config();

/**
 * Profile Content Generator for Farm Companion
 * 
 * Generates Ogilvy-style profile bio, pinned tweet, and alt text
 */
export class ProfileGenerator {
  /**
   * Generate profile bio using Ogilvy principles
   */
  async generateProfileBio() {
    try {
      console.log('✍️  Generating Ogilvy-style profile bio...');
      
      const prompt = getProfileBioPrompt();
      const response = await callClaude(prompt);
      
      if (response.success) {
        const bio = response.content.trim();
        
        // Validate length
        if (bio.length > 160) {
          console.log(`⚠️  Bio too long: ${bio.length} chars (max 160)`);
          return this.generateFallbackBio();
        }
        
        console.log(`✅ Generated profile bio (${bio.length} chars): "${bio}"`);
        return {
          success: true,
          bio: bio,
          length: bio.length,
          method: 'ogilvy-ai'
        };
      } else {
        console.log(`⚠️  AI generation failed: ${response.error}`);
        return this.generateFallbackBio();
      }
      
    } catch (error) {
      console.error(`❌ Profile bio generation error: ${error.message}`);
      return this.generateFallbackBio();
    }
  }

  /**
   * Generate pinned tweet using Ogilvy principles
   */
  async generatePinnedTweet() {
    try {
      console.log('✍️  Generating Ogilvy-style pinned tweet...');
      
      const prompt = getPinnedTweetPrompt();
      const response = await callClaude(prompt);
      
      if (response.success) {
        const tweet = response.content.trim();
        
        // Validate length
        if (tweet.length > 240) {
          console.log(`⚠️  Tweet too long: ${tweet.length} chars (max 240)`);
          return this.generateFallbackPinnedTweet();
        }
        
        console.log(`✅ Generated pinned tweet (${tweet.length} chars): "${tweet}"`);
        return {
          success: true,
          tweet: tweet,
          length: tweet.length,
          method: 'ogilvy-ai'
        };
      } else {
        console.log(`⚠️  AI generation failed: ${response.error}`);
        return this.generateFallbackPinnedTweet();
      }
      
    } catch (error) {
      console.error(`❌ Pinned tweet generation error: ${error.message}`);
      return this.generateFallbackPinnedTweet();
    }
  }

  /**
   * Generate alt text for farm shop images
   */
  async generateAltText(farm) {
    try {
      console.log(`✍️  Generating alt text for: ${farm.name}`);
      
      const prompt = getAltTextPrompt(farm);
      const response = await callClaude(prompt);
      
      if (response.success) {
        const altText = response.content.trim();
        
        // Validate length
        if (altText.length > 120) {
          console.log(`⚠️  Alt text too long: ${altText.length} chars (max 120)`);
          return this.generateFallbackAltText(farm);
        }
        
        console.log(`✅ Generated alt text (${altText.length} chars): "${altText}"`);
        return {
          success: true,
          alt_text: altText,
          length: altText.length,
          method: 'ogilvy-ai'
        };
      } else {
        console.log(`⚠️  AI generation failed: ${response.error}`);
        return this.generateFallbackAltText(farm);
      }
      
    } catch (error) {
      console.error(`❌ Alt text generation error: ${error.message}`);
      return this.generateFallbackAltText(farm);
    }
  }

  /**
   * Generate fallback profile bio
   */
  generateFallbackBio() {
    const bio = 'Find real UK farm shops by region and produce. Daily spotlight on independent shops.';
    console.log('🔄 Using fallback profile bio');
    return {
      success: true,
      bio: bio,
      length: bio.length,
      method: 'fallback'
    };
  }

  /**
   * Generate fallback pinned tweet
   */
  generateFallbackPinnedTweet() {
    const tweet = 'Discover fresh, local, traceable produce from independent UK farm shops. One daily spotlight. #FarmShop #FarmCompanion';
    console.log('🔄 Using fallback pinned tweet');
    return {
      success: true,
      tweet: tweet,
      length: tweet.length,
      method: 'fallback'
    };
  }

  /**
   * Generate fallback alt text
   */
  generateFallbackAltText(_farm) {
    const altText = `Farm shop exterior with local produce on display`;
    console.log('🔄 Using fallback alt text');
    return {
      success: true,
      alt_text: altText,
      length: altText.length,
      method: 'fallback'
    };
  }
}
