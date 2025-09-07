# 🔵 Bluesky Integration Setup Guide

## Overview

This guide walks you through setting up Bluesky posting alongside your existing Twitter workflow. The system will now post daily farm spotlights to both platforms simultaneously.

## Prerequisites

- Existing Twitter workflow (already configured)
- Bluesky account
- Node.js environment with the updated packages

## Step 1: Create Bluesky Account

1. **Sign up at [bsky.app](https://bsky.app)**
   - Choose a username (e.g., `farmcompanion.bsky.social`)
   - Complete account setup

2. **Generate App Password**
   - Go to Settings → App Passwords
   - Create a new app password (e.g., "Farm Companion Bot")
   - **Save this password** - you'll need it for configuration

## Step 2: Environment Configuration

Add these variables to your `.env.local` file:

```bash
# Bluesky Configuration
BLUESKY_IDENTIFIER=your-username.bsky.social
BLUESKY_PASSWORD=your-app-password-here
```

**Example:**
```bash
BLUESKY_IDENTIFIER=farmcompanion.bsky.social
BLUESKY_PASSWORD=abcd-efgh-ijkl-mnop
```

## Step 3: Test the Integration

Run the Bluesky test script:

```bash
node test-bluesky.js
```

Expected output:
```
🔵 Testing Bluesky Integration
=============================

🔌 Testing Bluesky connection...
✅ Connected to Bluesky as @farmcompanion.bsky.social
👤 Display name: Farm Companion

📝 Testing post creation (dry run)...
✅ Dry run successful!
📝 Content: "Test Farm Shop offers fresh local produce..."
📊 Length: 186 characters (under 300 limit ✅)
🖼️  Has image: No
🔗 Has website card: Yes

🎉 Bluesky integration test completed!
```

## Step 4: Run Daily Workflow

The workflow now posts to both platforms:

```bash
node send-tweet.js
```

**Expected workflow:**
1. 🎯 Select random farm
2. 🎨 Generate content and image with embedded URL
3. 🐦 Post to Twitter
4. 🔵 Post to Bluesky
5. 📢 Send notifications

## Platform Differences

| Feature | Twitter | Bluesky |
|---------|---------|---------|
| Character limit | 280 | 300 |
| Images | 4 max, 5MB | 4 max, 1MB |
| URL handling | t.co shortening | Full URLs |
| Embedding | Automatic cards | Manual website cards |
| URL in image | ✅ Embedded | ✅ Embedded |

## Content Strategy

### Twitter Posts
- **Length**: 120-220 characters (with URL embedded in image)
- **Images**: High-quality with embedded farm URL
- **Hashtags**: #FarmShop #FarmCompanion + optional regional

### Bluesky Posts
- **Length**: Same content as Twitter (under 300 limit)
- **Images**: Same images with embedded URL
- **Website Cards**: Automatic farm page cards
- **Hashtags**: Same hashtag strategy

## Error Handling

The system is resilient:
- ✅ **Both succeed**: Posts to both platforms
- ⚠️ **One fails**: Posts to successful platform, warns about failure
- ❌ **Both fail**: Throws error and stops workflow

## Monitoring

Check logs for:
- `✅ Bluesky post successful` - Successful posting
- `⚠️ Bluesky posting failed` - Platform-specific failure
- `🔗 Post includes website card` - Farm page embed working

## Troubleshooting

### Connection Issues
```bash
❌ Connection failed: Invalid credentials
```
**Solution**: Check `BLUESKY_IDENTIFIER` and `BLUESKY_PASSWORD` in `.env.local`

### Image Upload Issues
```bash
❌ Image too large: 2000000 bytes (max 1MB)
```
**Solution**: Images are automatically resized, but check if image generation is creating oversized files

### Rate Limiting
```bash
❌ Bluesky rate limit exceeded
```
**Solution**: Wait and retry - Bluesky has generous rate limits

## Production Deployment

1. **Add environment variables to Vercel**:
   - `BLUESKY_IDENTIFIER`
   - `BLUESKY_PASSWORD`

2. **Update cron job** (if using Vercel Cron):
   - No changes needed - same endpoint
   - Will now post to both platforms

3. **Monitor both platforms**:
   - Check Twitter: @FarmCompanion
   - Check Bluesky: @farmcompanion.bsky.social

## Benefits

✅ **Dual Platform Reach**: Expand audience to both Twitter and Bluesky  
✅ **Consistent Branding**: Same content, same embedded URLs  
✅ **Resilient Posting**: If one platform fails, other continues  
✅ **Professional Images**: High-quality images with embedded farm URLs  
✅ **Website Cards**: Automatic farm page embeds on Bluesky  

## Next Steps

1. Set up Bluesky account and app password
2. Add credentials to `.env.local`
3. Run `node test-bluesky.js` to verify
4. Run `node send-tweet.js` to test full workflow
5. Deploy to production with environment variables

Your daily farm spotlights will now reach audiences on both Twitter and Bluesky! 🎉
