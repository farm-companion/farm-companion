# Farm Produce Images System

Cloud-based image management system for seasonal produce across all 12 months.

## Setup

1. **Environment Variables**
   Create `.env.local` with:
   ```bash
   # Vercel Blob Storage
   BLOB_READ_WRITE_TOKEN=your_blob_token_here
   
   # Vercel KV (Redis)
   KV_URL=your_kv_url_here
   KV_REST_API_URL=your_kv_rest_url_here
   KV_REST_API_TOKEN=your_kv_token_here
   KV_REST_API_READ_ONLY_TOKEN=your_kv_readonly_token_here
   
   # Resend Email
   RESEND_API_KEY=your_resend_api_key_here
   
   # Image Processing
   MAX_IMAGE_SIZE=5242880
   ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
   IMAGE_QUALITY=85
   ```

2. **Vercel Setup**
   - Link to Vercel project
   - Configure environment variables in Vercel dashboard
   - Deploy

## Features

- Cloud storage for all 12 months of produce images
- Image optimization and processing
- Metadata storage in Redis
- Email notifications
- Scalable architecture

## Structure

```
src/
├── app/
│   └── api/
│       ├── upload/
│       ├── serve/
│       └── metadata/
├── lib/
│   ├── storage.ts
│   ├── database.ts
│   └── image-processing.ts
└── types/
    └── produce.ts
```
