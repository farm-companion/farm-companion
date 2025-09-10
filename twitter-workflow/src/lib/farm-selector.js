import axios from 'axios';
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';
import { addDays, startOfYear, differenceInDays } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Farm Selector for Daily Twitter Spotlights
 * 
 * Implements deterministic farm selection based on date
 * Ensures consistent, fair rotation through all farms
 */
export class FarmSelector {
  constructor() {
    this.farmDataUrl = process.env.FARM_DATA_URL || 'https://www.farmcompanion.co.uk/api/farms';
    this.timezone = process.env.TARGET_TIMEZONE || 'Europe/London';
    this.cache = {
      farms: null,
      lastFetch: null,
      cacheDuration: 24 * 60 * 60 * 1000 // 24 hours
    };
  }

  /**
   * Get the farm for today's spotlight
   * @param {Date} date - Optional date (defaults to today)
   * @param {boolean} useCache - Whether to use cached farm data
   */
  async getTodaysFarm(date = new Date(), useCache = true) {
    try {
      const farms = await this.getFarms(useCache);
      const selectedFarm = this.selectFarmForDate(date, farms);
      
      console.log(`📅 Selected farm for ${format(date, 'yyyy-MM-dd')}: ${selectedFarm.name}`);
      
      return {
        success: true,
        farm: selectedFarm,
        date: date.toISOString(),
        totalFarms: farms.length,
        farmIndex: this.getFarmIndex(date, farms.length)
      };
    } catch (error) {
      console.error('❌ Failed to get today\'s farm:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get 2 different farms for today's dual spotlight
   * @param {Date} date - Optional date (defaults to today)
   * @param {boolean} useCache - Whether to use cached farm data
   */
  async getTodaysFarms(date = new Date(), useCache = true) {
    try {
      const farms = await this.getFarms(useCache);
      
      if (farms.length < 2) {
        throw new Error('Not enough farms available for dual spotlight');
      }
      
      // Get first farm using standard selection
      const firstFarm = this.selectFarmForDate(date, farms);
      const firstIndex = this.getFarmIndex(date, farms.length);
      
      // Get second farm using a different seed (offset by half the farm count)
      const secondDate = new Date(date);
      secondDate.setDate(secondDate.getDate() + Math.floor(farms.length / 2));
      const secondFarm = this.selectFarmForDate(secondDate, farms);
      const secondIndex = this.getFarmIndex(secondDate, farms.length);
      
      // Ensure we have 2 different farms
      if (firstFarm.id === secondFarm.id) {
        // If same farm, pick the next one in the rotation
        const nextIndex = (secondIndex + 1) % farms.length;
        const nextFarm = farms[nextIndex];
        
        console.log(`📅 Selected farms for ${format(date, 'yyyy-MM-dd')}: ${firstFarm.name} & ${nextFarm.name}`);
        
        return {
          success: true,
          farms: [firstFarm, nextFarm],
          date: date.toISOString(),
          totalFarms: farms.length,
          farmIndices: [firstIndex, nextIndex]
        };
      }
      
      console.log(`📅 Selected farms for ${format(date, 'yyyy-MM-dd')}: ${firstFarm.name} & ${secondFarm.name}`);
      
      return {
        success: true,
        farms: [firstFarm, secondFarm],
        date: date.toISOString(),
        totalFarms: farms.length,
        farmIndices: [firstIndex, secondIndex]
      };
    } catch (error) {
      console.error('❌ Failed to get today\'s farms:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get farm data from API or cache
   */
  async getFarms(useCache = true) {
    // Check cache first
    if (useCache && this.cache.farms && this.cache.lastFetch) {
      const now = new Date();
      const cacheAge = now.getTime() - this.cache.lastFetch.getTime();
      
      if (cacheAge < this.cache.cacheDuration) {
        console.log(`📦 Using cached farm data (${Math.round(cacheAge / 1000 / 60)} minutes old)`);
        return this.cache.farms;
      }
    }

    try {
      console.log('🌐 Fetching fresh farm data from API...');
      
      const response = await axios.get(this.farmDataUrl, {
        params: {
          limit: 2000, // Get all farms
          verified: true // Only verified farms for spotlights
        },
        timeout: 30000
      });

      if (!response.data || !response.data.farms) {
        throw new Error('Invalid response format from farm API');
      }

      const farms = response.data.farms;
      
      // Filter and validate farms
      const validFarms = this.filterValidFarms(farms);
      
      if (validFarms.length === 0) {
        throw new Error('No valid farms found for spotlight');
      }

      // Update cache
      this.cache.farms = validFarms;
      this.cache.lastFetch = new Date();
      
      console.log(`✅ Loaded ${validFarms.length} valid farms for spotlight selection`);
      
      return validFarms;
    } catch (error) {
      console.error('❌ Failed to fetch farm data:', error.message);
      
      // Return cached data if available, even if stale
      if (this.cache.farms) {
        console.log('⚠️  Using stale cached data due to API failure');
        return this.cache.farms;
      }
      
      throw error;
    }
  }

  /**
   * Filter farms to only include valid ones for spotlight
   */
  filterValidFarms(farms) {
    return farms.filter(farm => {
      // Must have basic required fields
      if (!farm.name || !farm.location) {
        return false;
      }

      // Must have location coordinates
      if (!farm.location.lat || !farm.location.lng) {
        return false;
      }

      // Must have some content (name, story, or offerings)
      const hasContent = farm.story || farm.description || 
                        (farm.offerings && farm.offerings.length > 0);
      
      if (!hasContent) {
        return false;
      }

      // Must have a meaningful name (not just generic terms)
      const name = farm.name.toLowerCase();
      const genericTerms = ['farm', 'shop', 'store', 'market', 'business'];
      const hasGenericName = genericTerms.some(term => name.includes(term));
      
      // Must have either a specific name or good content
      if (!hasGenericName && !farm.story && !farm.description) {
        return false;
      }

      // Prefer farms with images
      const hasImages = farm.images && farm.images.length > 0;
      
      // Prefer verified farms
      const isVerified = farm.verified === true || farm.verified === 'True';
      
      // Prefer farms with good ratings
      const hasGoodRating = farm.rating && farm.rating >= 4.0;
      
      // Prefer farms with contact information
      const hasContact = farm.contact && (farm.contact.website || farm.contact.phone);
      
      // Prefer farms with opening hours
      const hasHours = farm.hours && farm.hours.length > 0;
      
      // Score farms (higher score = more likely to be selected)
      let score = 0;
      if (hasImages) score += 3;
      if (isVerified) score += 2;
      if (hasGoodRating) score += 2;
      if (farm.story || farm.description) score += 2;
      if (farm.offerings && farm.offerings.length > 0) score += 1;
      if (hasContact) score += 1;
      if (hasHours) score += 1;
      
      // Bonus for farms with rich content
      if (farm.story && farm.story.length > 100) score += 1;
      if (farm.offerings && farm.offerings.length > 2) score += 1;
      
      // Only include farms with minimum score
      return score >= 3;
    });
  }

  /**
   * Select farm for a specific date using deterministic algorithm
   */
  selectFarmForDate(date, farms) {
    const farmIndex = this.getFarmIndex(date, farms.length);
    return farms[farmIndex];
  }

  /**
   * Get farm index for a specific date
   */
  getFarmIndex(date, totalFarms) {
    // Convert date to target timezone
    const zonedDate = utcToZonedTime(date, this.timezone);
    
    // Get day of year (1-366)
    const startOfYearDate = startOfYear(zonedDate);
    const dayOfYear = differenceInDays(zonedDate, startOfYearDate) + 1;
    
    // Use day of year to determine farm index
    // This ensures the same farm is selected for the same date each year
    const farmIndex = (dayOfYear - 1) % totalFarms;
    
    return farmIndex;
  }

  /**
   * Get farm selection schedule for a date range
   */
  async getFarmSchedule(startDate, endDate) {
    try {
      const farms = await this.getFarms();
      const schedule = [];
      
      let currentDate = new Date(startDate);
      const end = new Date(endDate);
      
      while (currentDate <= end) {
        const farmIndex = this.getFarmIndex(currentDate, farms.length);
        const farm = farms[farmIndex];
        
        schedule.push({
          date: currentDate.toISOString().split('T')[0],
          farm: {
            name: farm.name,
            location: farm.location,
            slug: farm.slug
          },
          farmIndex
        });
        
        currentDate = addDays(currentDate, 1);
      }
      
      return {
        success: true,
        schedule,
        totalFarms: farms.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get statistics about farm selection
   */
  async getSelectionStats() {
    try {
      const farms = await this.getFarms();
      
      const stats = {
        totalFarms: farms.length,
        farmsWithImages: farms.filter(f => f.images && f.images.length > 0).length,
        verifiedFarms: farms.filter(f => f.verified === true || f.verified === 'True').length,
        farmsWithStories: farms.filter(f => f.story || f.description).length,
        averageRating: this.calculateAverageRating(farms),
        counties: this.getCountyDistribution(farms),
        cacheStatus: {
          hasCache: !!this.cache.farms,
          lastFetch: this.cache.lastFetch,
          cacheAge: this.cache.lastFetch ? 
            Math.round((new Date().getTime() - this.cache.lastFetch.getTime()) / 1000 / 60) : null
        }
      };
      
      return {
        success: true,
        stats
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate average rating of farms
   */
  calculateAverageRating(farms) {
    const farmsWithRatings = farms.filter(f => f.rating && typeof f.rating === 'number');
    if (farmsWithRatings.length === 0) return null;
    
    const totalRating = farmsWithRatings.reduce((sum, farm) => sum + farm.rating, 0);
    return Math.round((totalRating / farmsWithRatings.length) * 10) / 10;
  }

  /**
   * Get distribution of farms by county
   */
  getCountyDistribution(farms) {
    const countyCount = {};
    
    farms.forEach(farm => {
      const county = farm.location?.county || 'Unknown';
      countyCount[county] = (countyCount[county] || 0) + 1;
    });
    
    // Sort by count (descending)
    return Object.entries(countyCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10) // Top 10 counties
      .map(([county, count]) => ({ county, count }));
  }

  /**
   * Test the farm selection system
   */
  async testSelection() {
    try {
      const farms = await this.getFarms();
      const today = new Date();
      const selectedFarm = this.selectFarmForDate(today, farms);
      
      return {
        success: true,
        testResults: {
          totalFarms: farms.length,
          selectedFarm: selectedFarm.name,
          farmIndex: this.getFarmIndex(today, farms.length),
          date: today.toISOString().split('T')[0]
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const farmSelector = new FarmSelector();
