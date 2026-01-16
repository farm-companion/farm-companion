#!/usr/bin/env python3
"""
Progress Monitor for Farm Description Scraping
Quick script to check how many farms have descriptions and monitor progress.
"""

import json
from pathlib import Path
from datetime import datetime

def check_progress():
    """Check the current progress of farm description scraping."""
    farms_file = Path('dist/farms.uk.json')
    
    if not farms_file.exists():
        print('❌ farms.uk.json not found')
        return
    
    with open(farms_file, 'r', encoding='utf-8') as f:
        farms = json.load(f)
    
    # Count farms with descriptions
    farms_with_descriptions = [f for f in farms if f.get('description')]
    
    # Count farms that still need descriptions
    farms_needing_descriptions = []
    for farm in farms:
        website = farm.get('contact', {}).get('website')
        has_description = farm.get('description')
        if website and not any(social in website.lower() for social in ['facebook', 'instagram', 'twitter']) and not has_description:
            farms_needing_descriptions.append(farm)
    
    # Calculate statistics
    total_farms = len(farms)
    farms_with_desc = len(farms_with_descriptions)
    farms_needing_desc = len(farms_needing_descriptions)
    coverage_percent = (farms_with_desc / total_farms) * 100
    
    # Display progress
    print(f'🕐 Checked at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print(f'📊 TOTAL FARMS: {total_farms}')
    print(f'📝 FARMS WITH DESCRIPTIONS: {farms_with_desc}')
    print(f'📈 DESCRIPTION COVERAGE: {coverage_percent:.1f}%')
    print(f'🔄 FARMS STILL NEEDING DESCRIPTIONS: {farms_needing_desc}')
    
    if farms_needing_desc > 0:
        remaining_percent = (farms_needing_desc / total_farms) * 100
        print(f'⏳ REMAINING: {remaining_percent:.1f}%')
    
    # Show recent farms with descriptions (last 5)
    if farms_with_descriptions:
        print(f'\n📖 RECENT FARMS WITH DESCRIPTIONS:')
        recent_farms = farms_with_descriptions[-5:]  # Last 5
        for i, farm in enumerate(recent_farms):
            desc = farm['description']
            word_count = len(desc.split())
            print(f'  {i+1}. {farm["name"]} ({word_count} words)')
    
    # Show next farms to be processed
    if farms_needing_descriptions:
        print(f'\n📋 NEXT FARMS TO PROCESS:')
        next_farms = farms_needing_descriptions[:5]  # First 5
        for i, farm in enumerate(next_farms):
            website = farm.get('contact', {}).get('website', 'No website')
            print(f'  {i+1}. {farm["name"]} - {website}')

if __name__ == "__main__":
    check_progress()
