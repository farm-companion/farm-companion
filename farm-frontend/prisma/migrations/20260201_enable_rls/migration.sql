-- Enable Row Level Security on all public tables
-- This migration secures the database by:
-- 1. Enabling RLS on all tables
-- 2. Allowing public read access (farm directory is public)
-- 3. Restricting write access to service role only

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- DROP EXISTING POLICIES (if any)
-- =============================================================================

DROP POLICY IF EXISTS "Public read access for farms" ON public.farms;
DROP POLICY IF EXISTS "Service role write access for farms" ON public.farms;

DROP POLICY IF EXISTS "Public read access for categories" ON public.categories;
DROP POLICY IF EXISTS "Service role write access for categories" ON public.categories;

DROP POLICY IF EXISTS "Public read access for farm_categories" ON public.farm_categories;
DROP POLICY IF EXISTS "Service role write access for farm_categories" ON public.farm_categories;

DROP POLICY IF EXISTS "Public read access for products" ON public.products;
DROP POLICY IF EXISTS "Service role write access for products" ON public.products;

DROP POLICY IF EXISTS "Public read access for images" ON public.images;
DROP POLICY IF EXISTS "Service role write access for images" ON public.images;

DROP POLICY IF EXISTS "Public read access for reviews" ON public.reviews;
DROP POLICY IF EXISTS "Service role write access for reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated write access for reviews" ON public.reviews;

DROP POLICY IF EXISTS "Public read access for events" ON public.events;
DROP POLICY IF EXISTS "Service role write access for events" ON public.events;

-- =============================================================================
-- FARMS TABLE POLICIES
-- =============================================================================

-- Anyone can read active farms
CREATE POLICY "Public read access for farms"
ON public.farms
FOR SELECT
TO public
USING (status = 'active');

-- Only service role can insert/update/delete
CREATE POLICY "Service role write access for farms"
ON public.farms
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================================================
-- CATEGORIES TABLE POLICIES
-- =============================================================================

-- Anyone can read categories
CREATE POLICY "Public read access for categories"
ON public.categories
FOR SELECT
TO public
USING (true);

-- Only service role can modify
CREATE POLICY "Service role write access for categories"
ON public.categories
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================================================
-- FARM_CATEGORIES TABLE POLICIES
-- =============================================================================

-- Anyone can read farm-category relationships
CREATE POLICY "Public read access for farm_categories"
ON public.farm_categories
FOR SELECT
TO public
USING (true);

-- Only service role can modify
CREATE POLICY "Service role write access for farm_categories"
ON public.farm_categories
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================================================
-- PRODUCTS TABLE POLICIES
-- =============================================================================

-- Anyone can read products
CREATE POLICY "Public read access for products"
ON public.products
FOR SELECT
TO public
USING (true);

-- Only service role can modify
CREATE POLICY "Service role write access for products"
ON public.products
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================================================
-- IMAGES TABLE POLICIES
-- =============================================================================

-- Anyone can read approved images
CREATE POLICY "Public read access for images"
ON public.images
FOR SELECT
TO public
USING (status = 'approved');

-- Only service role can modify
CREATE POLICY "Service role write access for images"
ON public.images
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================================================
-- REVIEWS TABLE POLICIES
-- =============================================================================

-- Anyone can read approved reviews
CREATE POLICY "Public read access for reviews"
ON public.reviews
FOR SELECT
TO public
USING (status = 'approved');

-- Authenticated users can create reviews (pending approval)
CREATE POLICY "Authenticated write access for reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (status = 'pending');

-- Only service role can update/delete reviews
CREATE POLICY "Service role write access for reviews"
ON public.reviews
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================================================
-- EVENTS TABLE POLICIES
-- =============================================================================

-- Anyone can read published events
CREATE POLICY "Public read access for events"
ON public.events
FOR SELECT
TO public
USING (status = 'published');

-- Only service role can modify
CREATE POLICY "Service role write access for events"
ON public.events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
