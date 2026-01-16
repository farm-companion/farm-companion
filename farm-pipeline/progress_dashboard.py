#!/usr/bin/env python3
"""
Progress Dashboard for Farm Description Scraping
Shows a visual representation of the scraping progress.
"""

import json
from pathlib import Path
from datetime import datetime

def create_progress_bar(percentage, width=50):
    """Create a visual progress bar."""
    filled = int(width * percentage / 100)
    bar = '█' * filled + '░' * (width - filled)
    return f"[{bar}] {percentage:.1f}%"

def show_dashboard():
    """Display a comprehensive progress dashboard."""
    farms_file = Path('dist/farms.uk.json')
    
    if not farms_file.exists():
        print('❌ farms.uk.json not found')
        return
    
    with open(farms_file, 'r', encoding='utf-8') as f:
        farms = json.load(f)
    
    # Calculate statistics
    total_farms = len(farms)
    farms_with_descriptions = [f for f in farms if f.get('description')]
    farms_needing_descriptions = []
    
    for farm in farms:
        website = farm.get('contact', {}).get('website')
        has_description = farm.get('description')
        if website and not any(social in website.lower() for social in ['facebook', 'instagram', 'twitter']) and not has_description:
            farms_needing_descriptions.append(farm)
    
    farms_with_desc = len(farms_with_descriptions)
    farms_needing_desc = len(farms_needing_descriptions)
    coverage_percent = (farms_with_desc / total_farms) * 100
    
    # Display dashboard
    print('=' * 60)
    print('🏪 FARM COMPANION - DESCRIPTION SCRAPING DASHBOARD')
    print('=' * 60)
    print(f'📅 Last Updated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print()
    
    # Progress overview
    print('📊 PROGRESS OVERVIEW')
    print('-' * 30)
    print(f'Total Farms:           {total_farms:>4}')
    print(f'With Descriptions:     {farms_with_desc:>4}')
    print(f'Needing Descriptions:  {farms_needing_desc:>4}')
    print()
    
    # Visual progress bar
    print('📈 COVERAGE PROGRESS')
    print('-' * 30)
    print(create_progress_bar(coverage_percent))
    print(f'Current Coverage: {coverage_percent:.1f}%')
    print()
    
    # Recent activity
    if farms_with_descriptions:
        print('📖 RECENTLY PROCESSED FARMS')
        print('-' * 30)
        recent_farms = farms_with_descriptions[-10:]  # Last 10
        for i, farm in enumerate(recent_farms, 1):
            desc = farm['description']
            word_count = len(desc.split())
            print(f'{i:2d}. {farm["name"][:40]:<40} ({word_count:>3} words)')
        print()
    
    # Next in queue
    if farms_needing_descriptions:
        print('📋 NEXT IN QUEUE')
        print('-' * 30)
        next_farms = farms_needing_descriptions[:10]  # First 10
        for i, farm in enumerate(next_farms, 1):
            website = farm.get('contact', {}).get('website', 'No website')
            domain = website.split('//')[-1].split('/')[0] if '//' in website else website
            print(f'{i:2d}. {farm["name"][:35]:<35} | {domain}')
        print()
    
    # Estimated completion
    if farms_needing_desc > 0:
        # Rough estimate: 10 farms per batch, ~15 seconds per batch = 1.5 seconds per farm
        # Plus 5 seconds between batches = ~2 seconds per farm average
        seconds_per_farm = 2
        total_seconds = farms_needing_desc * seconds_per_farm
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        
        print('⏱️  ESTIMATED COMPLETION')
        print('-' * 30)
        print(f'Remaining farms: {farms_needing_desc}')
        print(f'Estimated time:  {hours}h {minutes}m')
        print()
    
    print('=' * 60)
    print('💡 TIP: Run this script periodically to monitor progress!')
    print('=' * 60)

if __name__ == "__main__":
    show_dashboard()
