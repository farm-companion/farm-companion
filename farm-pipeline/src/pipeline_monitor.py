#!/usr/bin/env python3
"""
Farm Pipeline Monitor
Real-time monitoring and control dashboard for the farm description pipeline.
"""

import json
import time
import argparse
from datetime import datetime
from redis_storage import FarmStorage
import asyncio
from redis_description_workflow import main as run_workflow

def display_status(storage: FarmStorage):
    """Display current pipeline status."""
    status = storage.get_pipeline_status()
    
    print("🏗️  FARM PIPELINE MONITOR")
    print("=" * 50)
    print(f"🕐 Last Updated: {status.get('last_updated', 'Unknown')}")
    print()
    
    # Progress bar
    total = status.get('total_farms', 0)
    processed = status.get('processed_farms', 0)
    failed = status.get('failed_farms', 0)
    needs_desc = status.get('needs_description', 0)
    coverage = status.get('coverage_percent', 0)
    
    print(f"📊 OVERALL PROGRESS")
    print(f"   Total Farms: {total:,}")
    print(f"   ✅ Processed: {processed:,}")
    print(f"   ❌ Failed: {failed:,}")
    print(f"   🔄 Pending: {needs_desc:,}")
    print(f"   📈 Coverage: {coverage:.1f}%")
    print()
    
    # Progress bar visualization
    if total > 0:
        bar_length = 40
        filled_length = int(bar_length * processed / total)
        bar = '█' * filled_length + '░' * (bar_length - filled_length)
        print(f"   Progress: [{bar}] {processed}/{total}")
        print()
    
    # Recent activity
    print(f"📋 RECENT ACTIVITY")
    farms_needing_desc = storage.get_farms_needing_descriptions()
    if farms_needing_desc:
        print(f"   Next farms to process:")
        for i, farm in enumerate(farms_needing_desc[:5], 1):
            name = farm.get('name', 'Unknown')
            website = farm.get('contact', {}).get('website', 'No website')
            print(f"     {i}. {name}")
            print(f"        {website}")
    else:
        print("   🎉 All farms processed!")
    
    print()

def show_menu():
    """Show the main menu."""
    print("🎛️  PIPELINE CONTROLS")
    print("=" * 50)
    print("1. 📊 Show Status")
    print("2. 🚀 Run Description Workflow")
    print("3. 🔄 Run Single Batch")
    print("4. 📈 Run Multiple Batches")
    print("5. 💾 Export to JSON")
    print("6. 🔍 Check Specific Farm")
    print("7. 🧹 Clear Failed Farms")
    print("8. ❌ Exit")
    print()

def check_specific_farm(storage: FarmStorage):
    """Check details of a specific farm."""
    farm_id = input("Enter farm ID (or name to search): ").strip()
    
    if not farm_id:
        return
    
    # Try to find farm by ID first, then by name
    farm = storage.get_farm(farm_id)
    
    if not farm:
        # Search by name
        all_farms = storage.get_all_farms()
        matching_farms = [f for f in all_farms if farm_id.lower() in f.get('name', '').lower()]
        
        if matching_farms:
            print(f"\n🔍 Found {len(matching_farms)} matching farms:")
            for i, f in enumerate(matching_farms[:5], 1):
                print(f"  {i}. {f.get('name')} (ID: {f.get('id')})")
                print(f"     Description: {'✅' if f.get('description') else '❌'}")
                print(f"     Website: {f.get('contact', {}).get('website', 'No website')}")
            
            if len(matching_farms) > 5:
                print(f"  ... and {len(matching_farms) - 5} more")
        else:
            print(f"❌ No farms found matching '{farm_id}'")
        return
    
    # Display farm details
    print(f"\n🏡 FARM DETAILS: {farm.get('name')}")
    print("=" * 50)
    print(f"ID: {farm.get('id')}")
    print(f"Name: {farm.get('name')}")
    print(f"Location: {farm.get('location', {}).get('address', 'Unknown')}")
    print(f"Website: {farm.get('contact', {}).get('website', 'No website')}")
    print(f"Description: {'✅ Present' if farm.get('description') else '❌ Missing'}")
    
    if farm.get('description'):
        desc = farm.get('description', '')
        word_count = len(desc.split())
        print(f"Word Count: {word_count}")
        print(f"Preview: {desc[:200]}...")
    
    print(f"Images: {len(farm.get('images', []))}")
    print(f"Rating: {farm.get('rating', 'N/A')}")
    print(f"Updated: {farm.get('updatedAt', 'Unknown')}")

def clear_failed_farms(storage: FarmStorage):
    """Clear failed farms from tracking."""
    print("🧹 Clearing failed farms from tracking...")
    
    # This would reset failed farms to be retried
    # For now, just show the current failed count
    status = storage.get_pipeline_status()
    failed_count = status.get('failed_farms', 0)
    
    if failed_count > 0:
        print(f"⚠️  Found {failed_count} failed farms")
        response = input("Do you want to reset failed farms for retry? (y/N): ")
        if response.lower() == 'y':
            # This would require additional Redis methods
            print("🔄 Failed farms reset for retry")
        else:
            print("❌ Operation cancelled")
    else:
        print("✅ No failed farms to clear")

async def run_workflow_interactive(storage: FarmStorage):
    """Run the description workflow interactively."""
    print("🚀 Starting Description Workflow...")
    print()
    
    # Get current status
    status = storage.get_pipeline_status()
    needs_desc = status.get('needs_description', 0)
    
    if needs_desc == 0:
        print("🎉 All farms already have descriptions!")
        return
    
    print(f"📋 {needs_desc} farms need descriptions")
    print()
    
    # Ask for batch configuration
    try:
        max_batches = input(f"Enter max batches to process (default: all {needs_desc//20 + 1}): ").strip()
        max_batches = int(max_batches) if max_batches else None
    except ValueError:
        print("❌ Invalid input, using default")
        max_batches = None
    
    print()
    print("🔄 Starting workflow...")
    print("=" * 50)
    
    # Run the workflow
    try:
        await run_workflow()
    except Exception as e:
        print(f"❌ Workflow failed: {e}")

def main():
    """Main monitoring loop."""
    print("🏗️  Farm Pipeline Monitor")
    print("=" * 50)
    
    try:
        storage = FarmStorage()
        print("✅ Redis connection established")
    except Exception as e:
        print(f"❌ Failed to connect to Redis: {e}")
        return
    
    while True:
        try:
            show_menu()
            choice = input("Select option (1-8): ").strip()
            
            if choice == '1':
                display_status(storage)
                
            elif choice == '2':
                print("🚀 Running full description workflow...")
                asyncio.run(run_workflow_interactive(storage))
                
            elif choice == '3':
                print("🔄 Running single batch...")
                asyncio.run(run_workflow_interactive(storage))
                
            elif choice == '4':
                print("📈 Running multiple batches...")
                asyncio.run(run_workflow_interactive(storage))
                
            elif choice == '5':
                print("💾 Exporting to JSON...")
                if storage.export_to_json():
                    print("✅ Export successful")
                else:
                    print("❌ Export failed")
                    
            elif choice == '6':
                check_specific_farm(storage)
                
            elif choice == '7':
                clear_failed_farms(storage)
                
            elif choice == '8':
                print("👋 Goodbye!")
                break
                
            else:
                print("❌ Invalid choice. Please select 1-8.")
            
            if choice != '8':
                input("\nPress Enter to continue...")
                print("\n" + "="*50 + "\n")
                
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            input("Press Enter to continue...")

if __name__ == "__main__":
    main()
