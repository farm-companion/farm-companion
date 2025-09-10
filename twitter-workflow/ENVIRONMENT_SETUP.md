# Environment Setup for Ogilvy/Apple Content Generation

## Required Environment Variables

Add these to your `.env.local` file in the `twitter-workflow` directory:

```bash
# DeepSeek (copy)
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Image Generation Services (choose one or more)
# fal.ai FLUX (recommended - primary)
FAL_KEY=your-fal-ai-api-key-here

# Pollinations AI (fallback - no config needed)

# Hugging Face (fallback)
HUGGING_FACE_API_KEY=your-hugging-face-api-key-here

# DeepSeek (fallback)
DEEPSEEK_API_KEY=your-deepseek-api-key-here

# X/Twitter API Configuration
X_API_KEY=your-x-api-key
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
TWITTER_ACCESS_TOKEN=your-twitter-access-token
TWITTER_ACCESS_SECRET=your-twitter-access-secret

# Bluesky Configuration
BLUESKY_IDENTIFIER=your-bluesky-identifier
BLUESKY_PASSWORD=your-bluesky-password

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHANNEL_ID=your-telegram-channel-id

# Posting Configuration
POSTING_ENABLED=true
DRY_RUN_MODE=false
```

## New Features Added

### 1. Ogilvy/Apple Content Generation
- **DeepSeek API** for professional copywriting
- **Platform-specific caps**: X ≤ 240, Instagram ≤ 400, Telegram ≤ 1000
- **Strict JSON output** with robust parsing
- **Fallback system** for reliability

### 2. Robust Image Generation
- **Multiple fallback services**: fal.ai FLUX, Pollinations AI, Hugging Face, DeepSeek
- **No faces/hands/text** policy enforced
- **UK countryside realism** style
- **Editorial natural light** photography
- **1:1 aspect ratio** optimized
- **Automatic retry logic** with exponential backoff
- **URL overlay integration** for farm branding

### 3. Enhanced Content Quality
- **Apple-level copywriting** principles
- **David Ogilvy** methodology
- **UK English** with proper localization
- **Halal/brand-safe** content filtering

## Testing the New System

Run the test command to verify everything works:

```bash
cd twitter-workflow
node -e "
import { contentGenerator } from './src/lib/content-generator.js';
await contentGenerator.testContentGeneration();
"
```

## Platform-Specific Output

The new system generates content optimized for each platform:

- **X (Twitter)**: ≤ 240 characters, concise, punchy
- **Instagram**: ≤ 400 characters, visual-focused
- **Telegram**: ≤ 1000 characters, detailed, formatted

All content includes proper hashtags, alt text, and image specifications.
