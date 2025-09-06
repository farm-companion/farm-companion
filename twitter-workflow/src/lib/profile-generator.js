import axios from 'axios';
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
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Generate profile bio using Ogilvy principles
   */
  async generateProfileBio() {
    try {
      console.log('✍️  Generating Ogilvy-style profile bio...');
      
      const prompt = getProfileBioPrompt();
      const response = await this.callDeepSeekAPI(prompt);
      
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
      const response = await this.callDeepSeekAPI(prompt);
      
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
      const response = await this.callDeepSeekAPI(prompt);
      
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
  generateFallbackAltText(farm) {
    const altText = `Farm shop exterior with local produce on display`;
    console.log('🔄 Using fallback alt text');
    return {
      success: true,
      alt_text: altText,
      length: altText.length,
      method: 'fallback'
    };
  }

  /**
   * Call DeepSeek API with retry logic
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
            temperature: 0.3,
            max_tokens: 200,
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
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }
}
