#!/usr/bin/env python3
"""
Farm Description Scraper
Scrapes comprehensive descriptions from farm websites to create 300-400 word descriptions.
"""

import asyncio
import json
import re
from pathlib import Path
from typing import Dict, List, Optional
import httpx
from bs4 import BeautifulSoup
import time

def process_content_into_description(scraped_data: Dict, farm_name: str, farm_location: str) -> str:
    """
    Process scraped content into a comprehensive 300-400 word description.
    """
    if scraped_data['status'] != 'success':
        return ""
    
    # Extract content
    title = scraped_data.get('title', '')
    meta_desc = scraped_data.get('meta_description', '')
    content_sections = scraped_data.get('content_sections', [])
    
    # Combine and clean content
    all_text = []
    
    # Add meta description if it's meaningful
    if meta_desc and len(meta_desc) > 20:
        all_text.append(meta_desc)
    
    # Add content sections
    for section in content_sections:
        # Clean the text
        cleaned = re.sub(r'\s+', ' ', section).strip()
        if len(cleaned) > 30 and len(cleaned) < 500:  # Reasonable length
            all_text.append(cleaned)
    
    # Combine all text
    combined_text = ' '.join(all_text)
    
    # If we have good content, format it
    if len(combined_text) > 100:
        # Create a structured description
        description_parts = []
        
        # Introduction
        intro = f"{farm_name} is a family-run farm shop located in {farm_location}."
        description_parts.append(intro)
        
        # Add the best content from the website
        # Take the first 200-300 words of meaningful content
        words = combined_text.split()
        content_words = words[:300]  # Limit to 300 words
        content_text = ' '.join(content_words)
        
        # Clean up the content
        content_text = re.sub(r'\s+', ' ', content_text).strip()
        
        description_parts.append(content_text)
        
        # Add a closing
        description_parts.append(f"Visit {farm_name} to experience authentic local produce and traditional farming values.")
        
        final_description = ' '.join(description_parts)
        
        # Ensure it's between 300-400 words
        word_count = len(final_description.split())
        if word_count < 300:
            # Add more content if needed
            remaining_words = 300 - word_count
            if len(words) > 300:
                additional_words = words[300:300+remaining_words]
                final_description += ' ' + ' '.join(additional_words)
        elif word_count > 400:
            # Truncate if too long
            words = final_description.split()
            final_description = ' '.join(words[:400])
        
        return final_description
    
    return ""

# User agent to avoid being blocked
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

async def test_single_website(url: str) -> Dict[str, str]:
    """
    Test scraping a single website to extract description content.
    Returns a dictionary with extracted content and metadata.
    """
    print(f"🔍 Testing: {url}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0, headers=HEADERS, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract title
            title = soup.find('title')
            title_text = title.get_text().strip() if title else "No title found"
            
            # Look for common description sections
            description_sections = []
            
            # Common selectors for "About Us" type content
            selectors = [
                'h1, h2, h3',  # Headers
                'p',           # Paragraphs
                '.about, .about-us, .our-story, .story',  # Common class names
                '#about, #about-us, #our-story, #story',  # Common IDs
                '.description, .content, .main-content',  # Content areas
            ]
            
            for selector in selectors:
                elements = soup.select(selector)
                for element in elements:
                    text = element.get_text().strip()
                    if len(text) > 50:  # Only meaningful content
                        description_sections.append(text)
            
            # Get meta description
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            meta_description = meta_desc.get('content', '') if meta_desc else ''
            
            return {
                'url': url,
                'title': title_text,
                'meta_description': meta_description,
                'content_sections': description_sections[:10],  # Limit to first 10 sections
                'status': 'success'
            }
            
    except Exception as e:
        print(f"❌ Error scraping {url}: {e}")
        return {
            'url': url,
            'error': str(e),
            'status': 'error'
        }

async def main():
    """Test the scraping with a few sample websites."""
    print("🧪 Testing web scraping functionality...")
    
    # Load farm data
    farms_file = Path('dist/farms.uk.json')
    if not farms_file.exists():
        print("❌ farms.uk.json not found. Run the Google Places script first.")
        return
    
    with open(farms_file, 'r', encoding='utf-8') as f:
        farms = json.load(f)
    
    # Get farms with regular websites (not social media)
    farms_with_websites = []
    for farm in farms:
        website = farm.get('contact', {}).get('website')
        if website and not any(social in website.lower() for social in ['facebook', 'instagram', 'twitter']):
            farms_with_websites.append(farm)
    
    print(f"📊 Found {len(farms_with_websites)} farms with regular websites")
    
    # Test with first 3 websites
    test_farms = farms_with_websites[:3]
    
    for farm in test_farms:
        print(f"\n🏪 Testing: {farm['name']}")
        result = await test_single_website(farm['contact']['website'])
        
        if result['status'] == 'success':
            print(f"✅ Success! Title: {result['title']}")
            print(f"📝 Meta Description: {result['meta_description'][:100]}...")
            print(f"📄 Content Sections: {len(result['content_sections'])} found")
            
            # Process into description
            farm_location = farm.get('location', {}).get('county', 'the local area')
            description = process_content_into_description(result, farm['name'], farm_location)
            
            if description:
                word_count = len(description.split())
                print(f"📖 Generated Description ({word_count} words):")
                print(f"   {description[:200]}...")
            else:
                print("❌ Could not generate description")
        else:
            print(f"❌ Failed: {result.get('error', 'Unknown error')}")
        
        # Be nice to servers
        await asyncio.sleep(2)

async def scrape_all_farm_descriptions():
    """
    Scrape descriptions for all farms with websites and update the data.
    """
    print("🚀 Starting full farm description scraping...")
    
    # Load farm data
    farms_file = Path('dist/farms.uk.json')
    if not farms_file.exists():
        print("❌ farms.uk.json not found. Run the Google Places script first.")
        return
    
    with open(farms_file, 'r', encoding='utf-8') as f:
        farms = json.load(f)
    
    # Get farms with regular websites (not social media) that don't have descriptions yet
    farms_with_websites = []
    for farm in farms:
        website = farm.get('contact', {}).get('website')
        has_description = farm.get('description')
        if website and not any(social in website.lower() for social in ['facebook', 'instagram', 'twitter']) and not has_description:
            farms_with_websites.append(farm)
    
    print(f"📊 Found {len(farms_with_websites)} farms with regular websites that need descriptions")
    
    # Track progress
    successful_scrapes = 0
    failed_scrapes = 0
    
    # Process farms in batches to be nice to servers
    batch_size = 10
    for i in range(0, len(farms_with_websites), batch_size):
        batch = farms_with_websites[i:i+batch_size]
        print(f"\n🔄 Processing batch {i//batch_size + 1}/{(len(farms_with_websites) + batch_size - 1)//batch_size}")
        
        for farm in batch:
            print(f"  🏪 {farm['name']}")
            
            # Scrape the website
            result = await test_single_website(farm['contact']['website'])
            
            if result['status'] == 'success':
                # Process into description
                farm_location = farm.get('location', {}).get('county', 'the local area')
                description = process_content_into_description(result, farm['name'], farm_location)
                
                if description:
                    # Update the farm data
                    farm['description'] = description
                    successful_scrapes += 1
                    print(f"    ✅ Generated {len(description.split())} word description")
                else:
                    failed_scrapes += 1
                    print(f"    ❌ Could not generate description")
            else:
                failed_scrapes += 1
                print(f"    ❌ Failed to scrape website")
            
            # Be nice to servers
            await asyncio.sleep(1)
        
        # Save progress after each batch
        with open('dist/farms.uk.json', 'w', encoding='utf-8') as f:
            json.dump(farms, f, indent=2, ensure_ascii=False)
        
        print(f"  💾 Saved progress ({successful_scrapes} successful, {failed_scrapes} failed)")
        
        # Longer pause between batches
        await asyncio.sleep(5)
    
    print(f"\n🎉 Scraping complete!")
    print(f"✅ Successful: {successful_scrapes}")
    print(f"❌ Failed: {failed_scrapes}")
    print(f"📊 Success rate: {successful_scrapes/(successful_scrapes+failed_scrapes)*100:.1f}%")

if __name__ == "__main__":
    # Run full scraping
    asyncio.run(scrape_all_farm_descriptions())
    
    # For testing, uncomment the line below
    # asyncio.run(main())
