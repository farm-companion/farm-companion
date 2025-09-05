# Bing Indexing Guide for Farm Companion

This guide ensures your site meets all Bing indexing requirements and best practices.

## ✅ Current Bing Configuration

### 1. Bing Webmaster Tools
- **Status**: ✅ Configured
- **Verification**: Meta tag `msvalidate.01` with key `D5F792E19E823EAE982BA6AB25F2B588`
- **Location**: `src/app/layout.tsx`

### 2. Robots.txt
- **Status**: ✅ Optimized for Bing
- **Configuration**: Explicitly allows `bingbot` and `msnbot`
- **Location**: `src/app/robots.ts`
- **URL**: `https://www.farmcompanion.co.uk/robots.txt`

### 3. Sitemap
- **Status**: ✅ Configured
- **URL**: `https://www.farmcompanion.co.uk/sitemap.xml`
- **Format**: XML sitemap with proper priorities and change frequencies
- **Size**: Optimized (limited to 1000 farm pages to avoid size issues)

### 4. Bing-Specific Meta Tags
- **Status**: ✅ Added
- **Tags**: 
  - `msapplication-TileColor`: #00C2B2 (brand color)
  - `msapplication-config`: /browserconfig.xml
  - `theme-color`: #00C2B2

### 5. Browser Configuration
- **Status**: ✅ Created
- **File**: `/public/browserconfig.xml`
- **Purpose**: Windows/Bing integration

## 🚀 Bing API Endpoints

### URL Submission API
- **Endpoint**: `/api/bing/submit`
- **Method**: POST
- **Purpose**: Submit individual URLs to Bing for faster indexing
- **Usage**: 
  ```bash
  curl -X POST https://www.farmcompanion.co.uk/api/bing/submit \
    -H "Content-Type: application/json" \
    -d '{"url": "https://www.farmcompanion.co.uk/shop/example-farm"}'
  ```

### Sitemap Ping API
- **Endpoint**: `/api/bing/ping`
- **Method**: POST
- **Purpose**: Notify Bing when sitemap is updated
- **Usage**:
  ```bash
  curl -X POST https://www.farmcompanion.co.uk/api/bing/ping
  ```

## 📋 Bing Indexing Checklist

### Technical Requirements
- [x] **Robots.txt**: Allows Bing crawlers (`bingbot`, `msnbot`)
- [x] **Sitemap**: Valid XML sitemap with proper structure
- [x] **Meta Tags**: Bing-specific meta tags included
- [x] **Webmaster Tools**: Site verified in Bing Webmaster Tools
- [x] **URL Structure**: Clean, SEO-friendly URLs
- [x] **Mobile-Friendly**: Responsive design
- [x] **Page Speed**: Optimized for performance
- [x] **HTTPS**: Secure connection

### Content Requirements
- [x] **Unique Content**: Each page has unique, valuable content
- [x] **Title Tags**: Descriptive, unique title tags
- [x] **Meta Descriptions**: Compelling meta descriptions
- [x] **Heading Structure**: Proper H1, H2, H3 hierarchy
- [x] **Internal Linking**: Good internal link structure
- [x] **Images**: Alt text for all images
- [x] **Schema Markup**: Structured data where appropriate

### Bing-Specific Optimizations
- [x] **Bing Webmaster Tools**: Site verified and configured
- [x] **IndexNow API**: Ready for URL submission
- [x] **Sitemap Ping**: Automated sitemap updates
- [x] **Bingbot User Agent**: Explicitly allowed in robots.txt
- [x] **Windows Integration**: browserconfig.xml for Windows tiles

## 🔧 Environment Variables

Add these to your `.env.production` file:

```bash
# Bing API Key for IndexNow submissions
BING_API_KEY=your_bing_api_key_here
```

## 📊 Monitoring Bing Indexing

### 1. Bing Webmaster Tools
- Monitor crawl errors
- Check indexing status
- View search performance
- Submit sitemap manually if needed

### 2. Server Logs
- Monitor Bingbot crawl frequency
- Check for crawl errors
- Verify proper user agent handling

### 3. API Endpoints
- Test URL submission: `GET /api/bing/submit`
- Test sitemap ping: `GET /api/bing/ping`

## 🚨 Troubleshooting

### Common Issues

1. **Pages Not Indexed**
   - Check robots.txt allows Bing
   - Verify sitemap includes the page
   - Submit URL manually via API
   - Check for crawl errors in Webmaster Tools

2. **Slow Indexing**
   - Use IndexNow API for faster submission
   - Ensure sitemap is updated regularly
   - Check page load speed
   - Verify mobile-friendliness

3. **Crawl Errors**
   - Check server logs for Bingbot requests
   - Verify robots.txt syntax
   - Ensure no blocking in .htaccess or server config
   - Check for redirect loops

### Manual Actions

1. **Submit Sitemap to Bing**
   - Go to Bing Webmaster Tools
   - Navigate to Sitemaps section
   - Submit: `https://www.farmcompanion.co.uk/sitemap.xml`

2. **Submit Individual URLs**
   - Use the `/api/bing/submit` endpoint
   - Or submit manually in Bing Webmaster Tools

3. **Request Re-crawling**
   - Use "Fetch as Bingbot" in Webmaster Tools
   - Request indexing for specific pages

## 📈 Best Practices

1. **Regular Updates**: Keep sitemap updated when content changes
2. **Quality Content**: Ensure all pages provide value
3. **Fast Loading**: Optimize page speed for better crawling
4. **Mobile-First**: Ensure mobile-friendly design
5. **Structured Data**: Use schema markup where appropriate
6. **Internal Linking**: Help Bing discover all pages
7. **Monitor Performance**: Track indexing status regularly

## 🔗 Useful Links

- [Bing Webmaster Tools](https://www.bing.com/webmasters/)
- [Bing IndexNow API](https://www.bing.com/indexnow)
- [Bing SEO Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)
- [Bing Sitemap Guidelines](https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed)
