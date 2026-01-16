#!/usr/bin/env python3
"""
Script to upload existing produce images to the farm-produce-images service.
This migrates the local produce images to the cloud-based image service.
"""

import os
import sys
import json
import asyncio
import httpx
from pathlib import Path
from typing import Dict, List, Any

# Configuration
PRODUCE_IMAGES_API_URL = "https://farm-produce-images-mm7s8jmyf-abdur-rahman-morris-projects.vercel.app"

# Produce mapping - maps filenames to produce slugs and months
PRODUCE_MAPPING = {
    "apples": {"slug": "apples", "month": 9, "name": "Apples"},
    "Blackberries": {"slug": "blackberries", "month": 8, "name": "Blackberries"},
    "Plums": {"slug": "plums", "month": 8, "name": "Plums"},
    "runner-beans": {"slug": "runner-beans", "month": 8, "name": "Runner Beans"},
    "strawberries-fresh": {"slug": "strawberries", "month": 6, "name": "Strawberries"},
    "sweetcorn": {"slug": "sweetcorn", "month": 8, "name": "Sweetcorn"},
    "tomato": {"slug": "tomato", "month": 8, "name": "Tomatoes"},
}

class ProduceImageUploader:
    def __init__(self, api_url: str):
        self.api_url = api_url
        self.session = httpx.AsyncClient(timeout=60.0)
        
    async def upload_image(self, image_path: Path, produce_info: Dict[str, Any], image_number: int) -> bool:
        """Upload a single image to the produce images service."""
        try:
            # Read the image file
            with open(image_path, 'rb') as f:
                image_data = f.read()
            
            # Prepare form data
            files = {'images': (image_path.name, image_data, 'image/jpeg')}
            data = {
                'produceSlug': produce_info['slug'],
                'month': str(produce_info['month']),
                'alt': f"{produce_info['name']} - Image {image_number}",
                'isPrimary': 'true' if image_number == 1 else 'false'
            }
            
            print(f"📤 Uploading {image_path.name} for {produce_info['name']} (month {produce_info['month']})...")
            
            response = await self.session.post(
                f"{self.api_url}/api/upload",
                files=files,
                data=data
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print(f"✅ Successfully uploaded {image_path.name}")
                    return True
                else:
                    print(f"❌ Upload failed for {image_path.name}: {result.get('error', 'Unknown error')}")
                    return False
            else:
                print(f"❌ Upload failed for {image_path.name}: HTTP {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error uploading {image_path.name}: {str(e)}")
            return False
    
    async def upload_produce_images(self, images_dir: Path) -> None:
        """Upload all produce images to the service."""
        if not images_dir.exists():
            print(f"❌ Images directory not found: {images_dir}")
            return
        
        total_uploaded = 0
        total_failed = 0
        
        # Process each produce type
        for produce_key, produce_info in PRODUCE_MAPPING.items():
            print(f"\n🌱 Processing {produce_info['name']}...")
            
            # Find all images for this produce type
            pattern = f"{produce_key}*.jpg"
            image_files = list(images_dir.glob(pattern))
            
            if not image_files:
                print(f"⚠️  No images found for {produce_key}")
                continue
            
            # Sort images by number
            image_files.sort(key=lambda x: int(x.stem.split(produce_key)[-1]))
            
            # Upload each image
            for i, image_file in enumerate(image_files, 1):
                success = await self.upload_image(image_file, produce_info, i)
                if success:
                    total_uploaded += 1
                else:
                    total_failed += 1
                
                # Small delay to avoid overwhelming the API
                await asyncio.sleep(0.5)
        
        print(f"\n📊 Upload Summary:")
        print(f"✅ Successfully uploaded: {total_uploaded} images")
        print(f"❌ Failed uploads: {total_failed} images")
        
        if total_uploaded > 0:
            print(f"\n🎉 Produce images are now available in the cloud service!")
            print(f"🌐 API URL: {self.api_url}/api/images")
    
    async def close(self):
        """Close the HTTP session."""
        await self.session.aclose()

async def main():
    """Main function to run the image upload process."""
    print("🚀 Starting produce image upload to cloud service...")
    
    # Find the images directory
    script_dir = Path(__file__).parent
    farm_frontend_dir = script_dir.parent / "farm-frontend"
    images_dir = farm_frontend_dir / "public" / "images" / "produce"
    
    if not images_dir.exists():
        print(f"❌ Images directory not found: {images_dir}")
        print("Please ensure the produce images are in the correct location.")
        return
    
    print(f"📁 Found images directory: {images_dir}")
    
    # Create uploader and upload images
    uploader = ProduceImageUploader(PRODUCE_IMAGES_API_URL)
    try:
        await uploader.upload_produce_images(images_dir)
    finally:
        await uploader.close()

if __name__ == "__main__":
    asyncio.run(main())
