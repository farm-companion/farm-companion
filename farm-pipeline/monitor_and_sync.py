#!/usr/bin/env python3
"""
Monitor and Sync Script for Farm Description Scraping
Automatically syncs data to frontend and monitors progress.
"""

import json
import shutil
import time
from pathlib import Path
from datetime import datetime

def sync_data_to_frontend():
    """Copy the latest farm data to the frontend."""
    source_file = Path('dist/farms.uk.json')
    target_file = Path('../farm-frontend/public/data/farms.uk.json')
    
    if source_file.exists():
        shutil.copy2(source_file, target_file)
        print(f'✅ Synced data to frontend at {datetime.now().strftime("%H:%M:%S")}')
    else:
        print('❌ Source file not found')

def check_progress():
    """Check the current progress."""
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
    
    print(f'🕐 {datetime.now().strftime("%H:%M:%S")} | 📊 {total_farms} total | 📝 {farms_with_desc} with descriptions | 📈 {coverage_percent:.1f}% coverage | 🔄 {farms_needing_desc} remaining')

def main():
    """Main monitoring loop."""
    print('🚀 Starting farm description monitoring and sync...')
    print('Press Ctrl+C to stop')
    
    try:
        while True:
            check_progress()
            sync_data_to_frontend()
            print('⏳ Waiting 5 minutes before next check...')
            time.sleep(300)  # Wait 5 minutes
    except KeyboardInterrupt:
        print('\n🛑 Monitoring stopped')

if __name__ == "__main__":
    main()
