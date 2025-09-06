# Changelog

All notable changes to the Twitter Workflow project will be documented in this file.

## [1.5.0] - 2025-01-06

### 🛠️ Production-Ready Monitoring System
- **FIXED**: Health check type mismatch - now passes proper status object instead of string
- **FIXED**: Slack Block Kit implementation - replaced legacy attachments with modern Block Kit
- **FIXED**: Robust retry logic - only retry 429/5xx errors with exponential backoff + jitter
- **FIXED**: Slack response validation - now checks both status code and response body ("ok")
- **FIXED**: Location handling - gracefully uses town, county, or falls back to UK
- **FIXED**: Vercel compatibility - removed hard dotenv dependency in production
- **IMPROVED**: Emoji support - now optional (disabled by default for clean brand)

### 🔧 Technical Improvements
- **NEW**: Slack Block Kit messages for better formatting and reliability
- **NEW**: Exponential backoff with jitter for retry logic
- **NEW**: Proper error classification (retryable vs non-retryable)
- **IMPROVED**: Health check data structure with clear status objects
- **IMPROVED**: Production-safe environment variable handling

## [1.4.0] - 2025-01-06

### 🎨 Diverse Image Categories
- **NEW**: 8 different image categories for maximum visual variety
- **NEW**: Farm produce displays with vegetables, fruits, and grains
- **NEW**: Scenic countryside landscapes and farm views
- **NEW**: Vegetable gardens and growing produce
- **NEW**: Seeds, grains, and organic products
- **NEW**: Artisan still life compositions
- **NEW**: Farm landscapes and agricultural fields

### 🔧 Technical Improvements
- **IMPROVED**: Deterministic category selection based on farm name hash
- **IMPROVED**: Each farm gets consistent category but different specific elements
- **IMPROVED**: Enhanced prompts for each category with specific elements
- **NEW**: `test:variety` script to showcase all image categories

### 🎯 Image Categories Available
1. **Farm Shop Exterior** - Traditional building exteriors
2. **Farm Produce** - Fresh vegetables in displays
3. **Fruit Display** - Colorful seasonal fruits
4. **Scenic Views** - Countryside landscapes and fields
5. **Seeds & Grains** - Organic grains and seeds
6. **Vegetable Garden** - Growing vegetables in gardens
7. **Farm Landscape** - Agricultural fields and vistas
8. **Produce Still Life** - Artisan food photography

## [1.3.0] - 2025-01-06

### 🛡️ No-Faces Protection
- **NEW**: Strong negative prompts to eliminate people from AI-generated images
- **NEW**: Seeded retry system for consistent but varied images per farm
- **NEW**: Enhanced Pollinations AI integration with better error handling
- **NEW**: Tweet aspect ratio support (16:9) for optimized social media images

### 🔧 Technical Improvements
- **FIXED**: Duplicate tweet issue - dry run mode now properly respected
- **FIXED**: Tweet length validation with conservative character limits
- **IMPROVED**: Image randomization - each farm gets unique, consistent images
- **IMPROVED**: Multi-seed retry logic with exponential backoff
- **IMPROVED**: Enhanced image prompts with composition hints to discourage people

### 🎨 Image Generation Enhancements
- **NEW**: `callPollinations()` method with seeded retry logic
- **NEW**: `generateTweetImage()` helper for 16:9 aspect ratio
- **IMPROVED**: Deterministic variety - same farm gets same seed, different farms get different images
- **IMPROVED**: Better error handling and fallback mechanisms

## [1.2.0] - 2025-09-06

### 🎯 Ogilvy Copy Chief Integration
- **NEW**: Implemented David Ogilvy-style copywriting prompts for professional, consistent content
- **NEW**: JSON-based content generation with strict validation and character limits
- **NEW**: Profile bio generation using Ogilvy microcopy principles (≤160 chars)
- **NEW**: Pinned tweet generation with launch messaging (≤240 chars)
- **NEW**: Image alt-text generation for accessibility (≤120 chars)

### ✨ Enhanced Content Quality
- **BREAKING**: Replaced Apple/Ogilvy hybrid prompts with pure Ogilvy copy chief approach
- **IMPROVED**: Content follows "one clear idea, one useful benefit" principle
- **IMPROVED**: British English, no emojis, no hype, no exclamation marks
- **IMPROVED**: Concrete nouns over adjectives, shorter is better
- **IMPROVED**: Consistent hashtag usage: #FarmShop #FarmCompanion + optional product/region tag

### 🔧 Technical Improvements
- **NEW**: `ogilvy-prompts.js` - Centralized prompt management
- **NEW**: `profile-generator.js` - Profile content generation
- **NEW**: JSON response parsing with validation
- **NEW**: Enhanced fallback content using Ogilvy principles
- **IMPROVED**: Better error handling and content structure validation

### 🧪 Testing & Validation
- **NEW**: `test:ogilvy` script for testing all Ogilvy prompts
- **NEW**: JSON parsing validation with character limit checks
- **NEW**: Hashtag count validation (2-3 total)
- **IMPROVED**: Comprehensive test coverage for all content types

### 📚 Documentation
- **NEW**: Detailed Ogilvy prompt specifications
- **NEW**: Example input/output for each prompt type
- **NEW**: Style guardrails and validation rules
- **IMPROVED**: Clear usage instructions for each prompt

## [1.1.0] - 2025-09-06

### 🔒 Security
- **BREAKING**: Removed committed `.env` file with real Twitter credentials
- Added proper environment variable management
- Updated environment example with all required variables

### 🔧 Critical Fixes
- **BREAKING**: Fixed cron route authentication to use `x-vercel-cron` header instead of Authorization
- **BREAKING**: Converted Next.js API handler to plain Node.js function for Vercel compatibility
- Added farm URLs to all tweets with proper length trimming using `twitter-text`
- Implemented idempotency guard using Upstash Redis to prevent double posting

### ✨ New Features
- Added `twitter-text` dependency for exact character counting (t.co rules)
- Added comprehensive test suite (8 tests) for tweet composition and idempotency
- Added detailed operations runbook with emergency procedures and troubleshooting
- Added Upstash Redis integration for idempotency

### 🎨 Improvements
- Set `includeEmojis: false` as default for cleaner brand tone
- Enhanced tweet composition with UTM tracking parameters
- Improved error handling and monitoring
- Added health check endpoint

### 🧪 Testing
- Added `tests/compose.test.js` for tweet composition validation
- Added `tests/idempotency.test.js` for idempotency functionality
- All tests passing (8/8)

### 📚 Documentation
- Added comprehensive operations runbook to README
- Added emergency procedures and troubleshooting guides
- Added key rotation procedures
- Added monitoring and alerting documentation

## [1.0.0] - 2025-09-06

### 🎉 Initial Release
- Daily farm spotlight Twitter automation
- DeepSeek AI content generation with Apple/Ogilvy style
- Deterministic farm selection algorithm
- Vercel cron job integration
- Comprehensive monitoring and error handling
- Slack notifications for success/failure
- Dry run testing capabilities
