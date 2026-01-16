#!/usr/bin/env python3
"""
Apply Generated Descriptions
Apply professional descriptions from CSV back to farm data
"""

import json
import csv
from pathlib import Path
from datetime import datetime

def load_csv_descriptions(csv_file: str):
    """Load descriptions from CSV file."""
    descriptions = {}
    
    if not Path(csv_file).exists():
        print(f"❌ CSV file not found: {csv_file}")
        return descriptions
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            farm_id = row.get('farm_id', '')
            if farm_id and row.get('status') == 'success':
                descriptions[farm_id] = {
                    'description': row.get('generated_description', ''),
                    'created_at': row.get('created_at', ''),
                    'word_count': len(row.get('generated_description', '').split())
                }
    
    return descriptions

def apply_descriptions_to_farms():
    """Apply descriptions from CSV to farm data."""
    csv_file = "data/farm_descriptions.csv"
    farms_file = Path('dist/farms.uk.json')
    
    # Load descriptions from CSV
    print("📖 Loading descriptions from CSV...")
    descriptions = load_csv_descriptions(csv_file)
    
    if not descriptions:
        print("❌ No valid descriptions found in CSV")
        return
    
    print(f"✅ Loaded {len(descriptions)} descriptions from CSV")
    
    # Load farm data
    if not farms_file.exists():
        print("❌ farms.uk.json not found")
        return
    
    with open(farms_file, 'r', encoding='utf-8') as f:
        farms = json.load(f)
    
    # Apply descriptions
    applied_count = 0
    for farm in farms:
        farm_id = farm.get('id', '')
        if farm_id in descriptions:
            farm['description'] = descriptions[farm_id]['description']
            applied_count += 1
            print(f"✅ Applied description to {farm.get('name', 'Unknown Farm')} ({descriptions[farm_id]['word_count']} words)")
    
    # Save updated farm data
    with open('dist/farms.uk.json', 'w', encoding='utf-8') as f:
        json.dump(farms, f, indent=2, ensure_ascii=False)
    
    print(f"\n🎉 Applied {applied_count} descriptions to farm data")
    print(f"📁 Updated: dist/farms.uk.json")
    
    # Copy to frontend
    frontend_file = Path('../farm-frontend/public/data/farms.uk.json')
    if frontend_file.parent.exists():
        import shutil
        shutil.copy2('dist/farms.uk.json', frontend_file)
        print(f"📁 Synced to frontend: {frontend_file}")

def show_csv_stats():
    """Show statistics about the CSV file."""
    csv_file = "data/farm_descriptions.csv"
    
    if not Path(csv_file).exists():
        print("❌ CSV file not found")
        return
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    total_rows = len(rows)
    successful = len([r for r in rows if r.get('status') == 'success'])
    failed = total_rows - successful
    
    print(f"📊 CSV Statistics:")
    print(f"   Total farms processed: {total_rows}")
    print(f"   Successful descriptions: {successful}")
    print(f"   Failed: {failed}")
    print(f"   Success rate: {successful/total_rows*100:.1f}%")
    
    if successful > 0:
        # Show sample descriptions
        print(f"\n📖 Sample Descriptions:")
        successful_rows = [r for r in rows if r.get('status') == 'success']
        for i, row in enumerate(successful_rows[:3], 1):
            farm_name = row.get('farm_name', 'Unknown')
            description = row.get('generated_description', '')
            word_count = len(description.split())
            print(f"   {i}. {farm_name} ({word_count} words)")
            print(f"      {description[:100]}...")
            print()

if __name__ == "__main__":
    print("🏪 Farm Description Application Tool")
    print("=" * 40)
    
    # Show CSV stats first
    show_csv_stats()
    
    # Ask user if they want to apply descriptions
    print("Apply descriptions to farm data? (y/n): ", end="")
    response = input().lower().strip()
    
    if response in ['y', 'yes']:
        apply_descriptions_to_farms()
    else:
        print("❌ Operation cancelled")
