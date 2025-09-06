# Testing DeepSeek AI with Ogilvy Prompts

## Quick Test Setup

1. **Create a local .env file** with your DeepSeek API key:
```bash
# Copy the example and add your key
cp env.example .env
```

2. **Edit .env and add your DeepSeek API key**:
```bash
DEEPSEEK_API_KEY=sk-eeaef6be7d6b45318b0c849beb9c4ebb
```

3. **Run the DeepSeek test**:
```bash
npm run test:deepseek
```

## What the Test Does

The test will:
- ✅ Verify your DeepSeek API key is working
- ✅ Generate AI content using Ogilvy prompts
- ✅ Validate the content follows Ogilvy principles
- ✅ Test all 4 content types (spotlight, bio, pinned tweet, alt text)

## Expected Output

You should see:
- **AI-generated content** instead of fallback content
- **Ogilvy validation checks** showing ✅ for each principle
- **Character counts** within limits
- **Proper hashtag usage**

## Example AI-Generated Content

**Daily Farm Spotlight:**
```
"Willow Brook Farm in Towcester, Northamptonshire — pasture-raised beef and small-batch dairy you can trust. #FarmShop #FarmCompanion #Beef"
```

**Profile Bio:**
```
"Find real UK farm shops by region and produce. Daily spotlight on independent shops."
```

**Pinned Tweet:**
```
"Discover fresh, local, traceable produce from independent UK farm shops. One daily spotlight. #FarmShop #FarmCompanion"
```

## If You See Fallback Content

If you see "Using Ogilvy fallback content" instead of AI-generated content:
1. Check your API key is correct
2. Verify the key has proper permissions
3. Check your internet connection
4. The fallback content is still professional and follows Ogilvy principles

## Production Deployment

Once the test works locally, the same DeepSeek API key in Vercel will generate AI content for the daily cron job at 09:05 Europe/London.
