-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "authorName" VARCHAR(100),
    "authorId" TEXT,
    "featuredImage" VARCHAR(500),
    "category" VARCHAR(100),
    "tags" TEXT[],
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "seoTitle" VARCHAR(255),
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "parentId" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "eventType" VARCHAR(50) NOT NULL,
    "farmId" TEXT,
    "sessionId" VARCHAR(100),
    "userAgent" TEXT,
    "referrer" VARCHAR(500),
    "ipAddress" VARCHAR(45),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm_categories" (
    "farmId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "farm_categories_pkey" PRIMARY KEY ("farmId","categoryId")
);

-- CreateTable
CREATE TABLE "farms" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "city" VARCHAR(100),
    "county" VARCHAR(100),
    "postcode" VARCHAR(10),
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "website" VARCHAR(500),
    "googlePlaceId" VARCHAR(255),
    "googleRating" DECIMAL(2,1),
    "googleReviewsCount" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "openingHours" JSONB,
    "facilities" JSONB,
    "paymentMethods" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dataSource" VARCHAR(20),
    "fsaId" VARCHAR(40),
    "lastEnrichedAt" TIMESTAMP(3),
    "osmId" VARCHAR(40),
    "provenance" JSONB,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "altText" VARCHAR(255),
    "caption" TEXT,
    "isHero" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "uploadedBy" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "googleAttribution" TEXT,
    "googlePhotoRef" VARCHAR(500),
    "source" VARCHAR(20) NOT NULL DEFAULT 'upload',
    "urlExpiresAt" TIMESTAMP(3),
    "attribution" VARCHAR(255),
    "license" VARCHAR(40),
    "sourceUrl" VARCHAR(500),

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "seasonal" BOOLEAN NOT NULL DEFAULT false,
    "availableMonths" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "userId" TEXT,
    "authorName" VARCHAR(100) NOT NULL,
    "authorEmail" VARCHAR(255),
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(255),
    "content" TEXT NOT NULL,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blog_posts_category_idx" ON "blog_posts"("category" ASC);

-- CreateIndex
CREATE INDEX "blog_posts_publishedAt_idx" ON "blog_posts"("publishedAt" ASC);

-- CreateIndex
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug" ASC);

-- CreateIndex
CREATE INDEX "blog_posts_status_idx" ON "blog_posts"("status" ASC);

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId" ASC);

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug" ASC);

-- CreateIndex
CREATE INDEX "events_createdAt_idx" ON "events"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "events_eventType_createdAt_idx" ON "events"("eventType" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "events_eventType_idx" ON "events"("eventType" ASC);

-- CreateIndex
CREATE INDEX "events_farmId_createdAt_idx" ON "events"("farmId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "events_farmId_eventType_createdAt_idx" ON "events"("farmId" ASC, "eventType" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "events_farmId_eventType_idx" ON "events"("farmId" ASC, "eventType" ASC);

-- CreateIndex
CREATE INDEX "events_farmId_idx" ON "events"("farmId" ASC);

-- CreateIndex
CREATE INDEX "events_sessionId_idx" ON "events"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "farm_categories_categoryId_idx" ON "farm_categories"("categoryId" ASC);

-- CreateIndex
CREATE INDEX "farm_categories_farmId_idx" ON "farm_categories"("farmId" ASC);

-- CreateIndex
CREATE INDEX "farms_city_idx" ON "farms"("city" ASC);

-- CreateIndex
CREATE INDEX "farms_city_status_idx" ON "farms"("city" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "farms_county_idx" ON "farms"("county" ASC);

-- CreateIndex
CREATE INDEX "farms_county_latitude_longitude_idx" ON "farms"("county" ASC, "latitude" ASC, "longitude" ASC);

-- CreateIndex
CREATE INDEX "farms_county_status_idx" ON "farms"("county" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "farms_county_verified_status_idx" ON "farms"("county" ASC, "verified" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "farms_featured_idx" ON "farms"("featured" ASC);

-- CreateIndex
CREATE INDEX "farms_featured_verified_status_idx" ON "farms"("featured" ASC, "verified" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "farms_fsaId_idx" ON "farms"("fsaId" ASC);

-- CreateIndex
CREATE INDEX "farms_googleRating_idx" ON "farms"("googleRating" ASC);

-- CreateIndex
CREATE INDEX "farms_latitude_longitude_idx" ON "farms"("latitude" ASC, "longitude" ASC);

-- CreateIndex
CREATE INDEX "farms_latitude_longitude_status_idx" ON "farms"("latitude" ASC, "longitude" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "farms_osmId_idx" ON "farms"("osmId" ASC);

-- CreateIndex
CREATE INDEX "farms_postcode_idx" ON "farms"("postcode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "farms_slug_key" ON "farms"("slug" ASC);

-- CreateIndex
CREATE INDEX "farms_status_featured_idx" ON "farms"("status" ASC, "featured" ASC);

-- CreateIndex
CREATE INDEX "farms_status_googleRating_idx" ON "farms"("status" ASC, "googleRating" ASC);

-- CreateIndex
CREATE INDEX "farms_status_idx" ON "farms"("status" ASC);

-- CreateIndex
CREATE INDEX "farms_status_verified_idx" ON "farms"("status" ASC, "verified" ASC);

-- CreateIndex
CREATE INDEX "farms_verified_idx" ON "farms"("verified" ASC);

-- CreateIndex
CREATE INDEX "images_farmId_idx" ON "images"("farmId" ASC);

-- CreateIndex
CREATE INDEX "images_farmId_isHero_status_idx" ON "images"("farmId" ASC, "isHero" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "images_farmId_source_status_idx" ON "images"("farmId" ASC, "source" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "images_farmId_status_idx" ON "images"("farmId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "images_isHero_idx" ON "images"("isHero" ASC);

-- CreateIndex
CREATE INDEX "images_source_idx" ON "images"("source" ASC);

-- CreateIndex
CREATE INDEX "images_status_idx" ON "images"("status" ASC);

-- CreateIndex
CREATE INDEX "images_status_isHero_idx" ON "images"("status" ASC, "isHero" ASC);

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category" ASC);

-- CreateIndex
CREATE INDEX "products_farmId_idx" ON "products"("farmId" ASC);

-- CreateIndex
CREATE INDEX "products_seasonal_idx" ON "products"("seasonal" ASC);

-- CreateIndex
CREATE INDEX "reviews_farmId_idx" ON "reviews"("farmId" ASC);

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating" ASC);

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status" ASC);

-- CreateIndex
CREATE INDEX "reviews_userId_idx" ON "reviews"("userId" ASC);

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_categories" ADD CONSTRAINT "farm_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm_categories" ADD CONSTRAINT "farm_categories_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

