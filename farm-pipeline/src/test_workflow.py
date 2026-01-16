#!/usr/bin/env python3
"""
Test Farm Description Workflow
Test the workflow with a single farm to verify everything works
"""

import asyncio
import json
from pathlib import Path
from farm_description_workflow import (
    initialize_csv, load_farms_data, get_farms_needing_descriptions,
    scrape_farm_website, create_deepseek_prompt, generate_description_with_deepseek, save_to_csv
)

async def test_single_farm():
    """Test the workflow with a single farm."""
    print("🧪 Testing Farm Description Workflow")
    print("=" * 40)
    
    # Initialize
    initialize_csv()
    farms = load_farms_data()
    farms_needing_descriptions = get_farms_needing_descriptions(farms)
    
    if not farms_needing_descriptions:
        print("❌ No farms found for testing")
        return
    
    # Test with first farm
    test_farm = farms_needing_descriptions[0]
    farm_name = test_farm.get('name', 'Unknown Farm')
    website = test_farm.get('contact', {}).get('website', '')
    
    print(f"🏪 Testing with: {farm_name}")
    print(f"🌐 Website: {website}")
    print()
    
    # Step 1: Scrape website
    print("🔍 Step 1: Scraping website...")
    scraped_content = await scrape_farm_website(website)
    
    if scraped_content.get('status') == 'success':
        print(f"✅ Scraped {len(scraped_content.get('content_sections', []))} content sections")
        print(f"📄 Title: {scraped_content.get('title', 'N/A')}")
        print(f"📝 Meta Description: {scraped_content.get('meta_description', 'N/A')[:100]}...")
    else:
        print(f"❌ Scraping failed: {scraped_content.get('error', 'Unknown error')}")
        return
    
    # Step 2: Generate description
    print("\n🤖 Step 2: Generating description with DeepSeek R1...")
    prompt = create_deepseek_prompt(test_farm, scraped_content)
    
    print("📝 Generated prompt (first 200 chars):")
    print(f"   {prompt[:200]}...")
    print()
    
    generated_description = await generate_description_with_deepseek(prompt)
    
    if generated_description.get('status') == 'success':
        description = generated_description.get('description', '')
        word_count = len(description.split())
        print(f"✅ Generated {word_count} word description")
        print("\n📖 Generated Description:")
        print("-" * 40)
        print(description)
        print("-" * 40)
    else:
        print(f"❌ Description generation failed: {generated_description.get('error', 'Unknown error')}")
        return
    
    # Step 3: Save to CSV
    print("\n💾 Step 3: Saving to CSV...")
    save_to_csv(test_farm, scraped_content, generated_description)
    print("✅ Saved to CSV")
    
    print(f"\n🎉 Test completed successfully!")
    print(f"📁 Check: data/farm_descriptions.csv")

if __name__ == "__main__":
    asyncio.run(test_single_farm())
