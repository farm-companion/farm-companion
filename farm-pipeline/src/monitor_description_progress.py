#!/usr/bin/env python3
"""
Monitor Description Progress
Track the progress of farm description generation
"""

import csv
import json
from pathlib import Path
from datetime import datetime

def get_progress_stats():
    """Get progress statistics from CSV file."""
    csv_file = "data/farm_descriptions.csv"
    
    if not Path(csv_file).exists():
        return None
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    total_processed = len(rows)
    successful = len([r for r in rows if r.get('status') == 'success'])
    failed = total_processed - successful
    
    # Get total farms that need descriptions
    farms_file = Path('dist/farms.uk.json')
    if farms_file.exists():
        with open(farms_file, 'r', encoding='utf-8') as f:
            farms = json.load(f)
        
        total_needed = len([
            f for f in farms 
            if f.get('contact', {}).get('website') 
            and not any(social in f.get('contact', {}).get('website', '').lower() 
                       for social in ['facebook', 'instagram', 'twitter'])
        ])
    else:
        total_needed = 0
    
    return {
        'total_processed': total_processed,
        'successful': successful,
        'failed': failed,
        'total_needed': total_needed,
        'remaining': total_needed - total_processed,
        'success_rate': (successful / total_processed * 100) if total_processed > 0 else 0
    }

def show_recent_descriptions(limit=5):
    """Show recent successful descriptions."""
    csv_file = "data/farm_descriptions.csv"
    
    if not Path(csv_file).exists():
        return
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    successful_rows = [r for r in rows if r.get('status') == 'success']
    recent_rows = successful_rows[-limit:] if successful_rows else []
    
    if recent_rows:
        print(f"\n📖 Recent Descriptions ({len(recent_rows)}):")
        for i, row in enumerate(recent_rows, 1):
            farm_name = row.get('farm_name', 'Unknown')
            description = row.get('generated_description', '')
            word_count = len(description.split())
            created_at = row.get('created_at', '')
            
            print(f"   {i}. {farm_name} ({word_count} words)")
            print(f"      {description[:100]}...")
            print(f"      Created: {created_at}")
            print()

def show_failed_entries(limit=5):
    """Show recent failed entries."""
    csv_file = "data/farm_descriptions.csv"
    
    if not Path(csv_file).exists():
        return
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    failed_rows = [r for r in rows if r.get('status') != 'success']
    recent_failed = failed_rows[-limit:] if failed_rows else []
    
    if recent_failed:
        print(f"\n❌ Recent Failures ({len(recent_failed)}):")
        for i, row in enumerate(recent_failed, 1):
            farm_name = row.get('farm_name', 'Unknown')
            website = row.get('website', 'N/A')
            status = row.get('status', 'unknown')
            
            print(f"   {i}. {farm_name}")
            print(f"      Website: {website}")
            print(f"      Status: {status}")
            print()

def main():
    """Main monitoring function."""
    print("📊 Farm Description Progress Monitor")
    print("=" * 40)
    
    stats = get_progress_stats()
    
    if not stats:
        print("❌ No progress data found. Is the workflow running?")
        return
    
    print(f"📈 Progress Overview:")
    print(f"   Total farms needing descriptions: {stats['total_needed']}")
    print(f"   Processed so far: {stats['total_processed']}")
    print(f"   Successful: {stats['successful']}")
    print(f"   Failed: {stats['failed']}")
    print(f"   Remaining: {stats['remaining']}")
    print(f"   Success rate: {stats['success_rate']:.1f}%")
    
    if stats['total_processed'] > 0:
        progress_percent = (stats['total_processed'] / stats['total_needed']) * 100
        print(f"   Overall progress: {progress_percent:.1f}%")
        
        # Estimate completion time
        if stats['total_processed'] > 10:
            avg_time_per_farm = 5  # seconds (rough estimate)
            remaining_time = (stats['remaining'] * avg_time_per_farm) / 60  # minutes
            print(f"   Estimated time remaining: {remaining_time:.1f} minutes")
    
    # Show recent descriptions
    show_recent_descriptions()
    
    # Show recent failures
    show_failed_entries()
    
    print("💡 Tips:")
    print("   - Check 'data/farm_descriptions.csv' for full results")
    print("   - Run 'python3 src/apply_descriptions.py' to apply to farm data")
    print("   - Monitor this script periodically for updates")

if __name__ == "__main__":
    main()
