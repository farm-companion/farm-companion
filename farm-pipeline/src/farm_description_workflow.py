#!/usr/bin/env python3
"""
Farm Description Workflow
Professional farm description generation using DeepSeek R1 API
"""

import asyncio
import json
import csv
import time
from pathlib import Path
from typing import Dict, List, Optional
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
import os

# Import our utility modules
from utils.retry import retry_async, API_RETRY_CONFIG
from utils.logging import setup_logger, PerformanceLogger, ProgressLogger
from utils.rate_limiter import RateLimiter, DEEPSEEK_RATE_LIMIT

# Setup logger
logger = setup_logger(__name__, level='INFO', log_file=Path('logs/farm_description_workflow.log'))

# Configuration
DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY')
if not DEEPSEEK_API_KEY:
    raise ValueError('DEEPSEEK_API_KEY environment variable not set. Please set it before running the workflow.')
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
CSV_FILE = "data/farm_descriptions.csv"
BATCH_SIZE = 20

# User agent for scraping
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

# Initialize rate limiters
deepseek_limiter = RateLimiter(
    max_requests=DEEPSEEK_RATE_LIMIT.max_requests,
    time_window=DEEPSEEK_RATE_LIMIT.time_window,
    burst_size=DEEPSEEK_RATE_LIMIT.burst_size
)

def ensure_data_directory():
    """Ensure the data directory exists."""
    Path("data").mkdir(exist_ok=True)
    Path("logs").mkdir(exist_ok=True)

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
        logger.info(f"Created new CSV file: {CSV_FILE}")

def load_farms_data():
    """Load farm data from JSON file."""
    farms_file = Path('dist/farms.uk.json')
    if not farms_file.exists():
        raise FileNotFoundError("farms.uk.json not found. Run the Google Places script first.")
    
    with open(farms_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_farms_data(farms: List[Dict]):
    """Save farm data back to JSON file."""
    farms_file = Path('dist/farms.uk.json')

    # Create backup before saving
    backup_file = Path(f'dist/farms.uk.json.backup.{int(time.time())}')
    if farms_file.exists():
        import shutil
        shutil.copy2(farms_file, backup_file)
        logger.info(f"Created backup: {backup_file}")

    # Save updated farms
    with open(farms_file, 'w', encoding='utf-8') as f:
        json.dump(farms, f, indent=2, ensure_ascii=False)

    logger.info(f"Updated farms.uk.json with {len(farms)} farms")

def update_farm_description(farms: List[Dict], farm_id: str, description: str):
    """Update a specific farm's description in the main data."""
    for farm in farms:
        if farm.get('id') == farm_id:
            farm['description'] = description
            farm['updatedAt'] = datetime.now().isoformat()
            return True
    return False

def get_farms_needing_descriptions(farms: List[Dict]) -> List[Dict]:
    """Get farms that need descriptions (have websites, not social media)."""
    farms_needing_descriptions = []
    
    for farm in farms:
        website = farm.get('contact', {}).get('website')
        has_description = farm.get('description')
        if website and not any(social in website.lower() for social in ['facebook', 'instagram', 'twitter']) and not has_description:
            farms_needing_descriptions.append(farm)
    
    return farms_needing_descriptions

@retry_async(
    max_attempts=API_RETRY_CONFIG['max_attempts'],
    base_delay=API_RETRY_CONFIG['base_delay'],
    max_delay=API_RETRY_CONFIG['max_delay'],
    exceptions=API_RETRY_CONFIG['exceptions']
)
async def scrape_farm_website(url: str) -> Dict:
    """Scrape farm website for content with retry logic."""
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
            title_text = title.get_text().strip() if title else ""

            logger.debug(f"Successfully scraped {url}: {len(content_sections)} sections found")

            return {
                'status': 'success',
                'title': title_text,
                'meta_description': meta_description,
                'content_sections': content_sections[:10],  # Limit to first 10 sections
                'url': url
            }

    except Exception as e:
        logger.error(f"Failed to scrape {url}: {str(e)}")
        return {
            'status': 'error',
            'error': str(e),
            'url': url
        }

def create_deepseek_prompt(farm_data: Dict, scraped_content: Dict) -> str:
    """Create the DeepSeek R1 prompt for farm description generation."""
    
    # Extract farm information
    farm_name = farm_data.get('name', '')
    location = farm_data.get('location', {})
    location_str = f"{location.get('address', '')}, {location.get('county', '')} {location.get('postcode', '')}"
    
    # Extract offerings
    offerings = farm_data.get('offerings', [])
    offerings_str = ', '.join(offerings) if offerings else 'farm shop products'
    
    # Process scraped content
    content_text = ""
    if scraped_content.get('status') == 'success':
        content_sections = scraped_content.get('content_sections', [])
        content_text = ' '.join(content_sections[:5])  # Use first 5 sections
    
    # Create the prompt
    prompt = f"""You are a master copywriter trained in the style of David Ogilvy (direct, persuasive, human) and Apple marketing (clean, elegant, aspirational). Your task is to write a minimum 250-word farm profile that feels both luxurious and trustworthy while being SEO-optimized and friendly for large language models.

Farm Data Provided:

Name: {farm_name}

Location: {location_str}

History/Background: {content_text[:500] if content_text else 'Family-run farm with traditional values'}

Produce/Offerings: {offerings_str}

Special Features: Farm shop, fresh local produce

Opening Times/Visitor Info: Available at the farm shop

Writing Instructions:

Start strong with a single, bold opening line that captures the farm's essence (Ogilvy-style "headline").

In the first paragraph, introduce the farm's name, location, and what makes it instantly distinctive.

Weave in a storytelling arc: heritage → what they produce → the visitor's experience.

Use Apple-style simplicity and rhythm: short, powerful sentences balanced with flowing narrative.

Naturally embed local SEO keywords (e.g., "farm shop in {location.get('county', 'the area')}," "fresh seasonal produce").

Highlight uniqueness (sustainability, community, or design of the shop) in an aspirational but authentic way.

End with an emotive close: an invitation to visit, taste, or connect with the farm.

Rules:

Tone = Ogilvy persuasion + Apple clarity.

No clichés, no fluff. Every sentence must feel intentional.

Minimum 250 words.

Now, based on the information above, write the complete farm description."""

    return prompt

@retry_async(
    max_attempts=API_RETRY_CONFIG['max_attempts'],
    base_delay=API_RETRY_CONFIG['base_delay'],
    max_delay=API_RETRY_CONFIG['max_delay'],
    exceptions=API_RETRY_CONFIG['exceptions']
)
async def generate_description_with_deepseek(prompt: str) -> Dict:
    """Generate description using DeepSeek R1 API with rate limiting and retry logic."""
    try:
        # Apply rate limiting
        async with deepseek_limiter:
            with PerformanceLogger(logger, 'DeepSeek API call', level='DEBUG'):
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        DEEPSEEK_API_URL,
                        headers={
                            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "deepseek-chat",
                            "messages": [
                                {
                                    "role": "user",
                                    "content": prompt
                                }
                            ],
                            "temperature": 0.7,
                            "max_tokens": 1000
                        }
                    )

                    if response.status_code == 200:
                        result = response.json()
                        content = result['choices'][0]['message']['content']
                        logger.debug(f"DeepSeek API success: {len(content)} characters generated")
                        return {
                            'status': 'success',
                            'description': content.strip()
                        }
                    else:
                        error_msg = f"API Error: {response.status_code} - {response.text}"
                        logger.error(error_msg)
                        return {
                            'status': 'error',
                            'error': error_msg
                        }

    except Exception as e:
        logger.error(f"DeepSeek API call failed: {str(e)}", exc_info=True)
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

async def process_farm_batch(farms_batch: List[Dict], all_farms: List[Dict]):
    """Process a batch of farms and update main data."""
    logger.info(f"Processing batch of {len(farms_batch)} farms")

    batch_updated = False
    progress = ProgressLogger(logger, total=len(farms_batch), operation='Processing farms in batch')

    for i, farm in enumerate(farms_batch, 1):
        farm_name = farm.get('name', 'Unknown Farm')
        website = farm.get('contact', {}).get('website', '')

        logger.info(f"[{i}/{len(farms_batch)}] Processing: {farm_name}")

        # Step 1: Scrape website
        logger.info(f"Scraping: {website}")
        scraped_content = await scrape_farm_website(website)

        if scraped_content.get('status') == 'success':
            sections_count = len(scraped_content.get('content_sections', []))
            logger.info(f"Scraped {sections_count} content sections")

            # Step 2: Generate description
            logger.info("Generating description with DeepSeek R1")
            prompt = create_deepseek_prompt(farm, scraped_content)
            generated_description = await generate_description_with_deepseek(prompt)

            if generated_description.get('status') == 'success':
                description = generated_description.get('description', '')
                word_count = len(description.split())
                logger.info(f"Generated {word_count} word description")

                # Update main farms data
                if update_farm_description(all_farms, farm['id'], description):
                    batch_updated = True
                    logger.info("Updated main farms data")

            else:
                error = generated_description.get('error', 'Unknown error')
                logger.error(f"Description generation failed: {error}")
        else:
            error = scraped_content.get('error', 'Unknown error')
            logger.error(f"Scraping failed: {error}")
            generated_description = {'status': 'error', 'error': 'Scraping failed'}

        # Step 3: Save to CSV
        save_to_csv(farm, scraped_content, generated_description)
        logger.debug("Saved to CSV")

        # Update progress
        progress.update(1)

        # Be nice to servers
        await asyncio.sleep(2)

    progress.complete()

    # Save main farms data after each batch if updated
    if batch_updated:
        save_farms_data(all_farms)
        logger.info("Saved updated farms.uk.json")

async def main():
    """Main workflow execution."""
    logger.info("=" * 70)
    logger.info("Starting Farm Description Workflow")
    logger.info("=" * 70)

    # Initialize
    initialize_csv()
    farms = load_farms_data()
    farms_needing_descriptions = get_farms_needing_descriptions(farms)

    logger.info(f"Total farms: {len(farms)}")
    logger.info(f"Farms needing descriptions: {len(farms_needing_descriptions)}")
    logger.info(f"CSV file: {CSV_FILE}")
    logger.info(f"Using DeepSeek R1 API")
    logger.info(f"Rate limit: {DEEPSEEK_RATE_LIMIT.max_requests} requests per {DEEPSEEK_RATE_LIMIT.time_window}s")

    # Create overall progress logger
    overall_progress = ProgressLogger(
        logger,
        total=len(farms_needing_descriptions),
        operation='Overall workflow progress',
        log_interval=1
    )

    # Process in batches
    for i in range(0, len(farms_needing_descriptions), BATCH_SIZE):
        batch = farms_needing_descriptions[i:i+BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        total_batches = (len(farms_needing_descriptions) + BATCH_SIZE - 1) // BATCH_SIZE

        logger.info(f"{'='*70}")
        logger.info(f"Batch {batch_num}/{total_batches}")
        logger.info(f"{'='*70}")

        with PerformanceLogger(logger, f'Batch {batch_num}/{total_batches}', level='INFO'):
            await process_farm_batch(batch, farms)

        overall_progress.update(len(batch))

        # Pause between batches
        if i + BATCH_SIZE < len(farms_needing_descriptions):
            logger.info("Pausing 10 seconds before next batch")
            await asyncio.sleep(10)

    overall_progress.complete()

    logger.info("=" * 70)
    logger.info("Workflow complete!")
    logger.info(f"Results saved to: {CSV_FILE}")
    logger.info(f"Processed {len(farms_needing_descriptions)} farms")
    logger.info(f"Main farms.uk.json updated with descriptions")
    logger.info("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
