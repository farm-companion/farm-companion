# Farm Companion

**UK's premier farm shop directory** — Connect consumers with 1,300+ verified local farms via an interactive map, real-time status, and seasonal produce guides.

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC)](https://tailwindcss.com/)

## 🎯 Mission

Enable 50k-100k monthly organic searches by connecting consumers with authentic UK farm shops through:
- **Discovery**: Interactive Google Maps with clustering, geolocation, and radius search
- **Trust**: Verified farms, real-time open/closed status, community photos
- **Seasonality**: Monthly produce guides showing what's in season now
- **Engagement**: Compare farms, directions, contact info, SEO-optimized pages

## ✨ Features

### Core Features
- 🗺️ **Interactive Map**: Google Maps integration with marker clustering, geolocation, and bounds-based filtering
- 🔍 **Advanced Search**: Full-text search with faceted filtering by county, category, and location
- 📍 **Farm Directory**: 1,300+ verified UK farm shops with detailed information
- 📅 **Seasonal Produce**: Monthly guides showing what's in season with recipes and storage tips
- 📸 **Photo Gallery**: Community-submitted photos with AI-powered moderation
- 🏷️ **Categories**: Browse farms by produce type (vegetables, fruits, dairy, meat, etc.)
- 📊 **Admin Dashboard**: Manage farms, photos, claims, and produce data
- 🎨 **PuredgeOS 3.0**: God-tier design system ensuring clarity, immersion, and excellence

### Technical Features
- ⚡ **Performance**: Lighthouse score >90, Core Web Vitals optimized
- ♿ **Accessibility**: WCAG 2.2 AA+ compliant, keyboard navigation, screen reader support
- 🔒 **Security**: Rate limiting, input validation, secure API keys management
- 📱 **Responsive**: Mobile-first design with safe area support for iOS
- 🚀 **SEO**: Dynamic sitemaps, Open Graph tags, structured data
- 💾 **Caching**: Redis caching layer for API responses and search results

## 🏗️ Architecture

### Monorepo Structure

```
farm-companion/
├── farm-frontend/          # Next.js frontend application
├── farm-pipeline/          # Data processing and migration scripts
├── farm-produce-images/   # Produce image management system
├── farm-schema/           # JSON schemas for data validation
└── produce-data-generator/ # Seasonal produce data generator
```

### Tech Stack

**Frontend**
- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript 5.9
- **UI**: React 19, Radix UI, Tailwind CSS 4.1
- **Maps**: Google Maps JavaScript API v2
- **Animations**: Framer Motion
- **Forms**: React Hook Form, Zod validation

**Backend**
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 5.22
- **Cache**: Redis (Vercel KV)
- **Storage**: Vercel Blob Storage
- **Search**: Meilisearch

**DevOps**
- **Hosting**: Vercel
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics, Sentry (optional)

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 20.18.3 or higher
- **pnpm**: 10.12 or higher
- **PostgreSQL**: Supabase account (free tier works)
- **Google Maps API Key**: [Get one here](https://console.cloud.google.com/google/maps-apis)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/farm-companion/farm-companion.git
   cd farm-companion
   ```

2. **Install dependencies**
   ```bash
   cd farm-frontend
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your configuration:
   ```env
   # Database (Supabase)
   DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
   DATABASE_POOLER_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
   
   # Google Maps
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_frontend_web_key"
   GOOGLE_MAPS_API_KEY="your_backend_server_key"
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
   
   # Redis (Vercel KV)
   REDIS_URL="your_redis_url"
   
   # Site Configuration
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   pnpm prisma generate
   
   # Push schema to database
   pnpm prisma db push
   
   # (Optional) Open Prisma Studio to view data
   pnpm prisma studio
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

### Frontend (`farm-frontend/`)

```
src/
├── app/                    # Next.js App Router pages
│   ├── map/               # Interactive map page
│   ├── shop/[slug]/      # Individual farm pages
│   ├── categories/        # Category listing pages
│   ├── seasonal/          # Seasonal produce guides
│   ├── admin/            # Admin dashboard
│   └── api/              # API routes
├── components/            # React components
│   ├── Map.tsx           # Main map component
│   ├── Search/           # Search components
│   └── ui/               # Reusable UI components
├── lib/                  # Utilities and helpers
│   ├── prisma.ts         # Prisma client singleton
│   ├── googleMaps.ts     # Google Maps loader
│   └── cache-manager.ts  # Redis cache utilities
├── types/                # TypeScript type definitions
└── styles/               # Global styles and fonts
```

### Key Directories

- **`farm-frontend/src/app/`**: Next.js pages and API routes
- **`farm-frontend/src/components/`**: React components organized by feature
- **`farm-frontend/src/lib/`**: Shared utilities and business logic
- **`farm-frontend/prisma/`**: Database schema and migrations
- **`farm-pipeline/`**: Data processing scripts and workflows

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Database
pnpm prisma generate  # Generate Prisma Client
pnpm prisma db push   # Push schema changes
pnpm prisma studio    # Open Prisma Studio

# Utilities
pnpm generate:produce-images  # Generate produce image data
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended config
- **Prettier**: Auto-format on save (configured in VS Code)
- **Conventions**: 
  - Use `'use client'` directive only when needed
  - Prefer server components by default
  - Colocate components with their features

### Design System

This project follows **PuredgeOS 3.0** design principles:

- **Clarity First**: Every interface must be instantly understandable
- **Immersion Second**: Visual polish enhances understanding
- **God-tier Always**: Pixel-perfect execution, instant performance

See [`PuredgeOS.md`](./PuredgeOS.md) for complete design system documentation.

## 🗄️ Database Schema

### Core Models

- **Farm**: Farm shop information (name, location, contact, hours)
- **Category**: Produce categories (vegetables, fruits, dairy, etc.)
- **Image**: Farm photos with moderation status
- **Produce**: Seasonal produce items with nutritional data
- **Claim**: Farm ownership claims for verification

See [`farm-frontend/prisma/schema.prisma`](./farm-frontend/prisma/schema.prisma) for the complete schema.

## 🚢 Deployment

### Vercel Deployment

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy**: Vercel automatically deploys on push to `master`

### Environment Variables

Required environment variables for production:

- `DATABASE_URL` - PostgreSQL connection string
- `DATABASE_POOLER_URL` - Pooled connection (recommended)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `REDIS_URL` - Redis connection string (optional)

See [`env.example`](./env.example) for all available variables.

### Build Configuration

The project uses Next.js App Router with:
- Static page generation for farm pages
- API routes for dynamic data
- Edge runtime for performance-critical routes
- ISR (Incremental Static Regeneration) for content updates

## 🧪 Testing

```bash
# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Run Playwright tests (if configured)
pnpm test
```

## 📊 Performance Targets

- **Lighthouse Performance**: >90
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3.5s
- **Cumulative Layout Shift**: <0.1
- **Map Load Time**: <2s (p95)

## 🔒 Security

- **API Keys**: Separate keys for frontend and backend
- **Rate Limiting**: Implemented on API routes
- **Input Validation**: Zod schemas for all user inputs
- **SQL Injection**: Protected via Prisma ORM
- **XSS**: Sanitized user-generated content
- **CORS**: Configured for production domains only

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Commit** with clear messages (`git commit -m 'Add amazing feature'`)
5. **Push** to your branch (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure accessibility compliance (WCAG 2.2 AA)
- Maintain performance budgets

## 📚 Documentation

- **[Setup Checklist](./farm-frontend/SETUP_CHECKLIST.md)**: Detailed setup instructions
- **[Architecture](./farm-frontend/docs/assistant/architecture.md)**: System architecture overview
- **[PuredgeOS Design System](./PuredgeOS.md)**: Complete design system documentation
- **[API Documentation](./farm-frontend/docs/api/)**: API route documentation

## 🔗 Related Repositories

- **[farm-pipeline](https://github.com/farm-companion/farm-pipeline)**: Data processing and migration scripts
- **[farm-schema](https://github.com/farm-companion/farm-schema)**: JSON schemas for data validation

## 📄 License

This project is proprietary. All rights reserved.

## 🙏 Acknowledgments

- **Google Maps**: For mapping services
- **Supabase**: For PostgreSQL hosting
- **Vercel**: For hosting and deployment
- **Prisma**: For the excellent ORM
- **Radix UI**: For accessible component primitives
- **Tailwind CSS**: For utility-first styling

## 📞 Support

For issues, questions, or contributions:
- **GitHub Issues**: [Create an issue](https://github.com/farm-companion/farm-companion/issues)
- **Email**: admin@farmcompanion.co.uk

---

**Built with ❤️ for UK farmers and local food enthusiasts**
