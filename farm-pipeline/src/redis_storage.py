#!/usr/bin/env python3
"""
Redis Storage Layer for Farm Pipeline
Replaces file-based storage with Redis for better reliability and performance.
"""

import json
import redis
import time
from pathlib import Path
from typing import Dict, List, Optional, Set
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FarmStorage:
    """Redis-based storage for farm data with JSON compatibility."""
    
    def __init__(self, host='localhost', port=6379, db=0):
        """Initialize Redis connection."""
        self.redis = redis.Redis(host=host, port=port, db=db, decode_responses=True)
        self.test_connection()
        
        # Redis key prefixes
        self.FARMS_ALL = "farms:all"
        self.FARM_DATA = "farm:{}"
        self.FARMS_PROCESSED = "farms:processed"
        self.FARMS_FAILED = "farms:failed"
        self.FARMS_NEEDS_DESCRIPTION = "farms:needs_description"
        self.FARMS_PRIORITY = "farms:priority"
        self.PIPELINE_STATUS = "pipeline:status"
        
    def test_connection(self):
        """Test Redis connection."""
        try:
            self.redis.ping()
            logger.info("✅ Redis connection established")
        except redis.ConnectionError as e:
            logger.error(f"❌ Redis connection failed: {e}")
            raise
    
    def clear_all_data(self):
        """Clear all farm data from Redis (use with caution)."""
        keys = self.redis.keys("farms:*")
        if keys:
            self.redis.delete(*keys)
            logger.info(f"🗑️  Cleared {len(keys)} farm-related keys")
        else:
            logger.info("ℹ️  No farm data to clear")
    
    def save_farm(self, farm: Dict) -> bool:
        """Save a single farm to Redis."""
        try:
            farm_id = farm.get('id')
            if not farm_id:
                logger.error("❌ Farm missing ID")
                return False
            
            # Save farm data as hash
            farm_key = self.FARM_DATA.format(farm_id)
            farm_data = {k: json.dumps(v) if isinstance(v, (dict, list)) else str(v) for k, v in farm.items()}
            
            # Use pipeline for atomic operation
            with self.redis.pipeline() as pipe:
                pipe.hset(farm_key, mapping=farm_data)
                pipe.sadd(self.FARMS_ALL, farm_id)
                
                # Add to appropriate tracking sets
                if farm.get('description'):
                    pipe.sadd(self.FARMS_PROCESSED, farm_id)
                else:
                    website = farm.get('contact', {}).get('website', '')
                    if website and not any(social in website.lower() for social in ['facebook', 'instagram', 'twitter']):
                        pipe.sadd(self.FARMS_NEEDS_DESCRIPTION, farm_id)
                
                pipe.execute()
            
            logger.info(f"💾 Saved farm: {farm.get('name', 'Unknown')} ({farm_id})")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error saving farm {farm.get('name', 'Unknown')}: {e}")
            return False
    
    def save_farms_batch(self, farms: List[Dict]) -> Dict[str, int]:
        """Save multiple farms in batch with atomic operations."""
        results = {'success': 0, 'failed': 0}
        
        try:
            with self.redis.pipeline() as pipe:
                for farm in farms:
                    farm_id = farm.get('id')
                    if not farm_id:
                        results['failed'] += 1
                        continue
                    
                    farm_key = self.FARM_DATA.format(farm_id)
                    farm_data = {k: json.dumps(v) if isinstance(v, (dict, list)) else str(v) for k, v in farm.items()}
                    
                    pipe.hset(farm_key, mapping=farm_data)
                    pipe.sadd(self.FARMS_ALL, farm_id)
                    
                    if farm.get('description'):
                        pipe.sadd(self.FARMS_PROCESSED, farm_id)
                    else:
                        website = farm.get('contact', {}).get('website', '')
                        if website and not any(social in website.lower() for social in ['facebook', 'instagram', 'twitter']):
                            pipe.sadd(self.FARMS_NEEDS_DESCRIPTION, farm_id)
                
                # Execute all operations atomically
                pipe.execute()
                results['success'] = len(farms)
                
        except Exception as e:
            logger.error(f"❌ Batch save failed: {e}")
            results['failed'] = len(farms)
        
        logger.info(f"📦 Batch save complete: {results['success']} success, {results['failed']} failed")
        return results
    
    def get_farm(self, farm_id: str) -> Optional[Dict]:
        """Get a single farm by ID."""
        try:
            farm_key = self.FARM_DATA.format(farm_id)
            farm_data = self.redis.hgetall(farm_key)
            
            if not farm_data:
                return None
            
            # Parse JSON fields back to Python objects
            parsed_farm = {}
            for key, value in farm_data.items():
                try:
                    parsed_farm[key] = json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    parsed_farm[key] = value
            
            return parsed_farm
            
        except Exception as e:
            logger.error(f"❌ Error getting farm {farm_id}: {e}")
            return None
    
    def get_all_farms(self) -> List[Dict]:
        """Get all farms from Redis."""
        try:
            farm_ids = self.redis.smembers(self.FARMS_ALL)
            farms = []
            
            for farm_id in farm_ids:
                farm = self.get_farm(farm_id)
                if farm:
                    farms.append(farm)
            
            logger.info(f"📊 Retrieved {len(farms)} farms from Redis")
            return farms
            
        except Exception as e:
            logger.error(f"❌ Error getting all farms: {e}")
            return []
    
    def get_farms_needing_descriptions(self) -> List[Dict]:
        """Get farms that need descriptions."""
        try:
            farm_ids = self.redis.smembers(self.FARMS_NEEDS_DESCRIPTION)
            farms = []
            
            for farm_id in farm_ids:
                farm = self.get_farm(farm_id)
                if farm:
                    farms.append(farm)
            
            logger.info(f"🔄 Found {len(farms)} farms needing descriptions")
            return farms
            
        except Exception as e:
            logger.error(f"❌ Error getting farms needing descriptions: {e}")
            return []
    
    def update_farm_description(self, farm_id: str, description: str) -> bool:
        """Update a farm's description."""
        try:
            farm_key = self.FARM_DATA.format(farm_id)
            
            with self.redis.pipeline() as pipe:
                pipe.hset(farm_key, 'description', description)
                pipe.hset(farm_key, 'updatedAt', datetime.now().isoformat())
                pipe.sadd(self.FARMS_PROCESSED, farm_id)
                pipe.srem(self.FARMS_NEEDS_DESCRIPTION, farm_id)
                pipe.execute()
            
            logger.info(f"✅ Updated description for farm {farm_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error updating description for farm {farm_id}: {e}")
            return False
    
    def get_pipeline_status(self) -> Dict:
        """Get current pipeline status."""
        try:
            total_farms = self.redis.scard(self.FARMS_ALL)
            processed_farms = self.redis.scard(self.FARMS_PROCESSED)
            failed_farms = self.redis.scard(self.FARMS_FAILED)
            needs_description = self.redis.scard(self.FARMS_NEEDS_DESCRIPTION)
            
            coverage = (processed_farms / total_farms * 100) if total_farms > 0 else 0
            
            return {
                'total_farms': total_farms,
                'processed_farms': processed_farms,
                'failed_farms': failed_farms,
                'needs_description': needs_description,
                'coverage_percent': round(coverage, 1),
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting pipeline status: {e}")
            return {}
    
    def export_to_json(self, output_file: str = "dist/farms.uk.json") -> bool:
        """Export Redis data to JSON file for frontend compatibility."""
        try:
            farms = self.get_all_farms()
            
            # Ensure output directory exists
            Path(output_file).parent.mkdir(parents=True, exist_ok=True)
            
            # Create backup of existing file
            if Path(output_file).exists():
                backup_file = f"{output_file}.backup.{int(time.time())}"
                import shutil
                shutil.copy2(output_file, backup_file)
                logger.info(f"💾 Created backup: {backup_file}")
            
            # Save to JSON
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(farms, f, indent=2, ensure_ascii=False)
            
            logger.info(f"💾 Exported {len(farms)} farms to {output_file}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error exporting to JSON: {e}")
            return False
    
    def import_from_json(self, json_file: str = "dist/farms.uk.json") -> Dict[str, int]:
        """Import farms from JSON file to Redis."""
        try:
            if not Path(json_file).exists():
                logger.error(f"❌ JSON file not found: {json_file}")
                return {'success': 0, 'failed': 0}
            
            with open(json_file, 'r', encoding='utf-8') as f:
                farms = json.load(f)
            
            logger.info(f"📥 Importing {len(farms)} farms from {json_file}")
            
            # Clear existing data first
            self.clear_all_data()
            
            # Import farms
            results = self.save_farms_batch(farms)
            
            logger.info(f"📥 Import complete: {results['success']} success, {results['failed']} failed")
            return results
            
        except Exception as e:
            logger.error(f"❌ Error importing from JSON: {e}")
            return {'success': 0, 'failed': 0}

def main():
    """Test the Redis storage layer."""
    try:
        storage = FarmStorage()
        
        # Test basic operations
        print("🧪 Testing Redis storage layer...")
        
        # Get current status
        status = storage.get_pipeline_status()
        print(f"📊 Current status: {status}")
        
        # Test JSON export
        if storage.export_to_json():
            print("✅ JSON export successful")
        
        print("🎉 Redis storage layer test complete!")
        
    except Exception as e:
        print(f"❌ Redis storage test failed: {e}")

if __name__ == "__main__":
    main()
