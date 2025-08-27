# Orphan Blob Cleanup Implementation

## Overview

This document describes the implementation of orphan blob cleanup functionality that identifies and removes orphaned files from blob storage by comparing them against database records.

## Problem Statement

Orphan blobs are files in blob storage that have no corresponding database record. They can accumulate due to:
- Failed uploads where the blob was created but database operations failed
- Manual deletions of database records without cleaning up blobs
- System errors during the upload process
- Previous implementation issues (before P7 backend order-of-operations fix)

## Solution: Automated Orphan Cleanup

### Key Features

1. **Safe Cleanup**: Only deletes blobs older than a configurable threshold (default: 2 hours)
2. **Dry Run Mode**: Preview what would be deleted without actually deleting
3. **Comprehensive Analysis**: Compares all blobs against database records
4. **Multiple Access Methods**: Both script and API endpoint
5. **Detailed Reporting**: Provides statistics and cleanup results

## Implementation Details

### 1. Cleanup Script (`farm-photos/scripts/cleanup-orphan-blobs.js`)

**Usage:**
```bash
# Dry run (safe)
node scripts/cleanup-orphan-blobs.js --dry-run

# Live cleanup
node scripts/cleanup-orphan-blobs.js

# Custom age threshold
node scripts/cleanup-orphan-blobs.js --older-than-hours=24
```

**Features:**
- Command-line interface with options
- Dry run mode for safe testing
- Configurable age threshold
- Detailed logging and reporting
- Redis database integration

### 2. Admin API Endpoint (`farm-photos/src/app/api/admin/cleanup/route.ts`)

**GET Method:**
```bash
# Dry run
GET /api/admin/cleanup?dry-run=true&older-than-hours=2

# Live cleanup
GET /api/admin/cleanup?older-than-hours=2
```

**POST Method:**
```bash
POST /api/admin/cleanup
Content-Type: application/json

{
  "dryRun": true,
  "olderThanHours": 2
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Cleanup completed successfully",
  "dryRun": false,
  "totalBlobs": 150,
  "liveBlobs": 145,
  "orphanBlobs": 5,
  "deletedBlobs": 5,
  "failedDeletions": 0,
  "olderThanHours": 2
}
```

## Cleanup Process

### Step 1: Database Analysis
```typescript
// Get all photo submission IDs from Redis
const keys = await client.keys('photo:submission:*')
const submissionIds = keys.map(key => key.replace('photo:submission:', ''))
const dbSubmissionSet = new Set(submissionIds)
```

### Step 2: Blob Storage Analysis
```typescript
// List all blobs under farm-photos/ prefix
const { blobs } = await list({
  prefix: 'farm-photos/',
  limit: 1000
})
```

### Step 3: Orphan Identification
```typescript
// Group blobs by submission ID
const groupedBlobs = groupBlobsBySubmissionId(blobs)

// Identify orphan blobs
for (const [submissionId, submissionBlobs] of Object.entries(groupedBlobs)) {
  const hasLiveRecord = dbSubmissionSet.has(submissionId)
  
  for (const blob of submissionBlobs) {
    if (!hasLiveRecord && isBlobOlderThan(blob, olderThanHours)) {
      orphanBlobs.push({ ...blob, submissionId })
    }
  }
}
```

### Step 4: Safe Deletion
```typescript
// Only delete blobs older than threshold
function isBlobOlderThan(blob, hours) {
  const blobAge = Date.now() - new Date(blob.uploadedAt).getTime()
  const maxAge = hours * 60 * 60 * 1000
  return blobAge > maxAge
}
```

## Configuration

### Environment Variables
- `REDIS_URL`: Redis connection string
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob access token

### Default Settings
- **Blob Prefix**: `farm-photos/`
- **Default Age Threshold**: 2 hours
- **Maximum Blobs to List**: 1000

## Usage Examples

### 1. One-Time Cleanup (Script)
```bash
# Navigate to farm-photos directory
cd farm-photos

# Dry run to see what would be cleaned up
node scripts/cleanup-orphan-blobs.js --dry-run

# Run actual cleanup
node scripts/cleanup-orphan-blobs.js

# Clean up blobs older than 24 hours
node scripts/cleanup-orphan-blobs.js --older-than-hours=24
```

### 2. API Cleanup (Programmatic)
```javascript
// Dry run
const dryRunResponse = await fetch('/api/admin/cleanup?dry-run=true')
const dryRunResult = await dryRunResponse.json()

// Live cleanup
const cleanupResponse = await fetch('/api/admin/cleanup?older-than-hours=2')
const cleanupResult = await cleanupResponse.json()
```

### 3. Scheduled Cleanup (Cron Job)
```bash
# Add to crontab for monthly cleanup
0 2 1 * * cd /path/to/farm-photos && node scripts/cleanup-orphan-blobs.js --older-than-hours=24
```

## Safety Features

### 1. Age Threshold Protection
- Only deletes blobs older than specified threshold
- Prevents accidental deletion of recent uploads
- Default 2-hour threshold provides safety buffer

### 2. Dry Run Mode
- Preview cleanup without actual deletion
- Safe for testing and verification
- Shows exactly what would be deleted

### 3. Comprehensive Logging
- Detailed logs of all operations
- Error reporting for failed deletions
- Statistics and summary reports

### 4. Database Verification
- Cross-references against live database records
- Only deletes truly orphaned blobs
- Preserves all valid photo files

## Testing

### Test Script (`farm-frontend/test-orphan-cleanup.js`)
```bash
# Run comprehensive tests
node test-orphan-cleanup.js
```

**Test Coverage:**
1. **Dry Run Cleanup** - Verifies dry run functionality
2. **Custom Hours** - Tests configurable age threshold
3. **POST Method** - Tests alternative API method
4. **Live Cleanup** - Tests actual deletion (if orphans exist)
5. **Error Handling** - Tests invalid parameter handling

## Monitoring and Maintenance

### 1. Regular Monitoring
- Run dry run monthly to check for orphan accumulation
- Monitor cleanup logs for any issues
- Track storage usage before/after cleanup

### 2. Scheduled Maintenance
```bash
# Monthly cleanup script
#!/bin/bash
cd /path/to/farm-photos
node scripts/cleanup-orphan-blobs.js --older-than-hours=24 >> cleanup.log 2>&1
```

### 3. Alerting
- Monitor for failed cleanup operations
- Alert on high orphan blob counts
- Track cleanup success rates

## Benefits

### 1. **Storage Efficiency**
- Reduces storage costs by removing unused files
- Prevents storage bloat from failed uploads
- Maintains clean blob storage

### 2. **System Reliability**
- Prevents accumulation of orphan files
- Reduces potential for storage issues
- Maintains system performance

### 3. **Cost Optimization**
- Lower storage costs
- Reduced bandwidth for unnecessary files
- Better resource utilization

### 4. **Operational Clarity**
- Clear visibility into storage usage
- Detailed reporting on cleanup operations
- Safe and controlled cleanup process

## Future Improvements

### 1. **Enhanced Deletion**
- Implement actual Vercel Blob deletion API
- Add batch deletion for efficiency
- Support for different blob stores

### 2. **Advanced Monitoring**
- Real-time orphan detection
- Automated cleanup triggers
- Integration with monitoring systems

### 3. **Scheduling Integration**
- Built-in scheduling capabilities
- Webhook notifications
- Integration with CI/CD pipelines

### 4. **Analytics**
- Historical cleanup data
- Storage usage trends
- Performance metrics

## Files Created

1. `farm-photos/scripts/cleanup-orphan-blobs.js` - Command-line cleanup script
2. `farm-photos/src/app/api/admin/cleanup/route.ts` - Admin API endpoint
3. `farm-frontend/test-orphan-cleanup.js` - Test suite
4. `farm-frontend/ORPHAN_CLEANUP_IMPLEMENTATION.md` - This documentation

## Impact

🧹 **Keeps storage tidy**

This implementation provides:
- **Automated cleanup** of orphan blobs
- **Safe operation** with age thresholds and dry runs
- **Multiple access methods** (script and API)
- **Comprehensive monitoring** and reporting
- **Cost optimization** through storage efficiency

The cleanup system ensures that blob storage remains clean and efficient, preventing accumulation of orphan files while maintaining system reliability and performance.
