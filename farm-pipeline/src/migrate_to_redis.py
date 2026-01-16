#!/usr/bin/env python3
"""
Farm Data Migration Script
Migrate existing farm data from JSON files to Redis for better reliability.
"""

import json
import time
from pathlib import Path
from redis_storage import FarmStorage
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def migrate_farms_to_redis():
    """Migrate all farm data from JSON to Redis."""
    print("🚀 Starting Farm Data Migration to Redis")
    print("=" * 50)
    
    try:
        # Initialize Redis storage
        storage = FarmStorage()
        print("✅ Redis storage initialized")
        
        # Check if data already exists in Redis
        status = storage.get_pipeline_status()
        if status.get('total_farms', 0) > 0:
            print(f"⚠️  Redis already contains {status['total_farms']} farms")
            response = input("Do you want to clear existing data and re-import? (y/N): ")
            if response.lower() != 'y':
                print("❌ Migration cancelled")
                return False
        
        # Import farms from JSON
        print("📥 Importing farms from JSON to Redis...")
        results = storage.import_from_json("dist/farms.uk.json")
        
        if results['success'] > 0:
            print(f"✅ Successfully migrated {results['success']} farms to Redis")
            
            # Get updated status
            new_status = storage.get_pipeline_status()
            print(f"📊 New Redis status: {new_status}")
            
            # Export back to JSON to ensure compatibility
            print("💾 Exporting Redis data back to JSON for frontend compatibility...")
            if storage.export_to_json():
                print("✅ JSON export successful")
            
            # Verify migration
            print("\n🔍 Verifying migration...")
            redis_farms = storage.get_all_farms()
            json_farms = []
            
            with open("dist/farms.uk.json", 'r', encoding='utf-8') as f:
                json_farms = json.load(f)
            
            if len(redis_farms) == len(json_farms):
                print(f"✅ Migration verified: {len(redis_farms)} farms in both Redis and JSON")
            else:
                print(f"⚠️  Migration verification failed: Redis={len(redis_farms)}, JSON={len(json_farms)}")
            
            return True
        else:
            print(f"❌ Migration failed: {results['failed']} farms failed to migrate")
            return False
            
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return False

def test_redis_operations():
    """Test Redis operations after migration."""
    print("\n🧪 Testing Redis operations...")
    
    try:
        storage = FarmStorage()
        
        # Test getting farms needing descriptions
        farms_needing_desc = storage.get_farms_needing_descriptions()
        print(f"🔄 Farms needing descriptions: {len(farms_needing_desc)}")
        
        # Test getting a single farm
        if farms_needing_desc:
            test_farm = farms_needing_desc[0]
            farm_id = test_farm['id']
            retrieved_farm = storage.get_farm(farm_id)
            
            if retrieved_farm and retrieved_farm.get('name') == test_farm.get('name'):
                print(f"✅ Single farm retrieval test passed: {retrieved_farm['name']}")
            else:
                print(f"❌ Single farm retrieval test failed")
        
        # Test pipeline status
        status = storage.get_pipeline_status()
        print(f"📊 Pipeline status: {status}")
        
        print("🎉 Redis operations test complete!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Redis operations test failed: {e}")
        return False

def main():
    """Main migration function."""
    print("🏗️  Farm Pipeline Redis Migration Tool")
    print("=" * 50)
    
    # Check if farms.uk.json exists
    if not Path("dist/farms.uk.json").exists():
        print("❌ farms.uk.json not found. Run the Google Places script first.")
        return
    
    # Check Redis connection
    try:
        storage = FarmStorage()
        print("✅ Redis connection verified")
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        return
    
    # Perform migration
    if migrate_farms_to_redis():
        print("\n🎉 Migration completed successfully!")
        
        # Test operations
        if test_redis_operations():
            print("\n✅ All tests passed! Redis migration is ready.")
        else:
            print("\n⚠️  Some tests failed. Check Redis configuration.")
    else:
        print("\n❌ Migration failed. Check logs for details.")

if __name__ == "__main__":
    main()
