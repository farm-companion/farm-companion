#!/usr/bin/env python3
"""
Redis-Enhanced Farm Description Workflow
Professional farm description generation using DeepSeek R1 API with Redis progress tracking.
"""

import asyncio
import json
import csv
import time
import argparse
from pathlib import Path
from typing import Dict, List, Optional
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
import os
from redis_storage import FarmStorage
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
DEEPSEEK_API_KEY = "sk-eeaef6be7d6b45318b0c849beb9c4ebb"
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
CSV_FILE = "data/farm_descriptions.csv"
BATCH_SIZE = 20

# User agent for scraping
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def ensure_data_directory():
    """Ensure the data directory exists."""
    Path("data").mkdir(exist_ok=True)

def initialize_csv():
    """Initialize the CSV file with headers."""
    ensure_data_directory()
    
    if not Path(CSV_FILE).exists():
        with open(CSV_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'farm_id', 'farm_name', 'website', 'location', 
                'scraped_content', 'generated_description', 'status', 
                'created_at', 'updated_at'
            ])
        print(f"✅ Created new CSV file: {CSV_FILE}")

def create_deepseek_prompt(farm: Dict, scraped_content: Dict) -> str:
    """Create a prompt for DeepSeek R1 to generate farm description."""
    farm_name = farm.get('name', 'Unknown Farm')
    location = farm.get('location', {})
    address = f"{location.get('address', '')}, {location.get('city', '')}, {location.get('county', '')}"
    
    content_text = "\n".join(scraped_content.get('content_sections', []))
    
    prompt = f"""You are a professional copywriter specializing in farm shop descriptions. 

Create a compelling, engaging description for this farm shop:

Farm Name: {farm_name}
Location: {address}

Based on this website content, write a 200-300 word description that:
- Highlights the farm's unique offerings and atmosphere
- Emphasizes local, fresh produce and quality
- Uses warm, inviting language that makes visitors want to visit
- Includes specific details about what they offer
- Maintains a professional yet friendly tone

Website Content:
{content_text}

Write the description in the first person plural (we, our) as if the farm is speaking directly to customers. Make it engaging and informative without being overly promotional."""

    return prompt

async def generate_description_with_deepseek(prompt: str) -> Dict:
    """Generate description using DeepSeek R1 API."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                DEEPSEEK_API_URL,
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 500,
                    "temperature": 0.7
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data['choices'][0]['message']['content']
                return {
                    'status': 'success',
                    'description': content.strip()
                }
            else:
                return {
                    'status': 'error',
                    'error': f"API Error: {response.status_code} - {response.text}"
                }
                
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }

async def scrape_farm_website(url: str) -> Dict:
    """Scrape farm website for content."""
    try:
        async with httpx.AsyncClient(timeout=30.0, headers=HEADERS, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract content from common sections
            content_sections = []
            
            # Look for About Us, Our Story, etc.
            about_selectors = [
                'h1, h2, h3',  # Headers
                'p',           # Paragraphs
                '.about, .about-us, .our-story, .story',  # Common class names
                '#about, #about-us, #our-story, #story',  # Common IDs
                '.description, .content, .main-content',  # Content areas
            ]
            
            for selector in about_selectors:
                elements = soup.select(selector)
                for element in elements:
                    text = element.get_text().strip()
                    if len(text) > 50:  # Only meaningful content
                        content_sections.append(text)
            
            # Get meta description
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            meta_description = meta_desc.get('content', '') if meta_desc else ''
            
            # Get title
            title = soup.find('title')
            title_text = title.get_text().strip() if title else ''
            
            return {
                'status': 'success',
                'content_sections': content_sections[:10],  # Limit to 10 sections
                'meta_description': meta_description,
                'title': title_text
            }
            
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }

def save_to_csv(farm_data: Dict, scraped_content: Dict, generated_description: Dict):
    """Save farm data to CSV."""
    now = datetime.now().isoformat()
    
    # Prepare CSV row
    row = [
        farm_data.get('id', ''),
        farm_data.get('name', ''),
        farm_data.get('contact', {}).get('website', ''),
        f"{farm_data.get('location', {}).get('address', '')}, {farm_data.get('location', {}).get('county', '')}",
        json.dumps(scraped_content),
        generated_description.get('description', '') if generated_description.get('status') == 'success' else '',
        generated_description.get('status', 'error'),
        now,
        now
    ]
    
    # Append to CSV
    with open(CSV_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(row)

async def process_farm_batch(farms_batch: List[Dict], storage: FarmStorage):
    """Process a batch of farms with Redis integration."""
    print(f"\n🔄 Processing batch of {len(farms_batch)} farms...")
    
    batch_results = {'success': 0, 'failed': 0}
    
    for i, farm in enumerate(farms_batch, 1):
        farm_name = farm.get('name', 'Unknown Farm')
        farm_id = farm.get('id', 'Unknown')
        website = farm.get('contact', {}).get('website', '')
        
        print(f"\n  {i}/{len(farms_batch)}: {farm_name}")
        
        try:
            # Step 1: Scrape website
            print(f"    🔍 Scraping: {website}")
            scraped_content = await scrape_farm_website(website)
            
            if scraped_content.get('status') == 'success':
                print(f"    ✅ Scraped {len(scraped_content.get('content_sections', []))} content sections")
                
                # Step 2: Generate description
                print(f"    🤖 Generating description with DeepSeek R1...")
                prompt = create_deepseek_prompt(farm, scraped_content)
                generated_description = await generate_description_with_deepseek(prompt)
                
                if generated_description.get('status') == 'success':
                    description = generated_description.get('description', '')
                    word_count = len(description.split())
                    print(f"    ✅ Generated {word_count} word description")
                    
                    # Update Redis
                    if storage.update_farm_description(farm_id, description):
                        batch_results['success'] += 1
                        print(f"    💾 Updated Redis and tracking")
                    else:
                        print(f"    ⚠️  Failed to update Redis")
                        batch_results['failed'] += 1
                else:
                    print(f"    ❌ Description generation failed: {generated_description.get('error', 'Unknown error')}")
                    batch_results['failed'] += 1
            else:
                print(f"    ❌ Scraping failed: {scraped_content.get('error', 'Unknown error')}")
                batch_results['failed'] += 1
                generated_description = {'status': 'error', 'error': 'Scraping failed'}
            
            # Step 3: Save to CSV
            save_to_csv(farm, scraped_content, generated_description)
            print(f"    💾 Saved to CSV")
            
        except Exception as e:
            print(f"    ❌ Error processing farm: {e}")
            batch_results['failed'] += 1
        
        # Be nice to servers
        await asyncio.sleep(2)
    
    # Export updated data to JSON after each batch
    print(f"    💾 Exporting updated data to JSON...")
    storage.export_to_json()
    
    return batch_results

async def main():
    """Main workflow execution."""
    parser = argparse.ArgumentParser(description='Redis-Enhanced Farm Description Workflow')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be processed without running')
    parser.add_argument('--resume', action='store_true', help='Resume from where we left off')
    parser.add_argument('--max-batches', type=int, help='Maximum number of batches to process')
    args = parser.parse_args()
    
    print("🚀 Starting Redis-Enhanced Farm Description Workflow")
    print("=" * 60)
    
    try:
        # Initialize Redis storage
        storage = FarmStorage()
        print("✅ Redis storage initialized")
        
        # Initialize CSV
        initialize_csv()
        
        # Get pipeline status
        status = storage.get_pipeline_status()
        print(f"📊 Current Redis status: {status}")
        
        # Get farms needing descriptions
        farms_needing_descriptions = storage.get_farms_needing_descriptions()
        print(f"🔄 Farms needing descriptions: {len(farms_needing_descriptions)}")
        print(f"📁 CSV file: {CSV_FILE}")
        print(f"🤖 Using DeepSeek R1 API")
        print()
        
        if args.dry_run:
            print("🔍 DRY RUN MODE - No actual processing will occur")
            print(f"📋 Would process {len(farms_needing_descriptions)} farms in {(len(farms_needing_descriptions) + BATCH_SIZE - 1) // BATCH_SIZE} batches")
            return
        
        if not farms_needing_descriptions:
            print("🎉 All farms already have descriptions!")
            return
        
        # Process in batches
        total_batches = (len(farms_needing_descriptions) + BATCH_SIZE - 1) // BATCH_SIZE
        max_batches = args.max_batches if args.max_batches else total_batches
        
        print(f"📦 Processing {min(max_batches, total_batches)} of {total_batches} total batches")
        
        for i in range(0, min(len(farms_needing_descriptions), max_batches * BATCH_SIZE), BATCH_SIZE):
            batch = farms_needing_descriptions[i:i+BATCH_SIZE]
            batch_num = i // BATCH_SIZE + 1
            
            print(f"\n📦 Batch {batch_num}/{min(max_batches, total_batches)}")
            
            # Process batch
            batch_results = await process_farm_batch(batch, storage)
            
            # Update status
            current_status = storage.get_pipeline_status()
            print(f"    📊 Batch complete: {batch_results['success']} success, {batch_results['failed']} failed")
            print(f"    📈 Overall progress: {current_status['processed_farms']}/{current_status['total_farms']} ({current_status['coverage_percent']:.1f}%)")
            
            # Pause between batches (except last batch)
            if i + BATCH_SIZE < len(farms_needing_descriptions) and batch_num < max_batches:
                print(f"\n⏳ Pausing 10 seconds before next batch...")
                await asyncio.sleep(10)
            
            # Check if we've hit max batches
            if batch_num >= max_batches:
                print(f"\n⏹️  Reached maximum batch limit ({max_batches})")
                break
        
        # Final status
        final_status = storage.get_pipeline_status()
        print(f"\n🎉 Workflow complete!")
        print(f"📁 Results saved to: {CSV_FILE}")
        print(f"📊 Final status: {final_status}")
        
    except Exception as e:
        logger.error(f"❌ Workflow failed: {e}")
        print(f"❌ Workflow failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
