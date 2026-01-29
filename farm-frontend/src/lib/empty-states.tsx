/**
 * Empty State Messages
 *
 * Pre-configured empty state content for different contexts.
 * Uses the "Knowledgeable Neighbor" voice: warm, specific to farming and
 * local food, avoiding generic directory-speak.
 *
 * Voice guidelines:
 * - Use farming and seasonal metaphors naturally
 * - Be warm and helpful, like a neighbor who knows the land
 * - "We've checked the fields" not "No results found"
 * - Encourage contribution to the community
 */

import {
  Search,
  MapPin,
  Heart,
  ShoppingBag,
  Calendar,
  Image,
  MessageSquare,
  Bell,
  Filter,
  Map,
  Store,
  Leaf,
  Clock,
  Star,
  FileText,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'

// =============================================================================
// TYPES
// =============================================================================

export interface EmptyStateContent {
  /** Icon component to display */
  icon: ReactNode
  /** Main title */
  title: string
  /** Descriptive message */
  description: string
  /** Optional action button config */
  action?: {
    label: string
    href?: string
  }
}

export type EmptyStateContext =
  // Search & Discovery
  | 'search-no-results'
  | 'search-no-query'
  | 'filter-no-results'
  | 'map-no-farms'
  | 'map-zoomed-out'
  // Lists & Collections
  | 'favorites-empty'
  | 'recent-empty'
  | 'compare-empty'
  // Farm-specific
  | 'county-no-farms'
  | 'category-no-farms'
  | 'seasonal-nothing'
  | 'farm-no-photos'
  | 'farm-no-reviews'
  | 'farm-no-hours'
  // User content
  | 'submissions-empty'
  | 'claims-empty'
  | 'notifications-empty'
  // Admin
  | 'admin-no-pending'
  | 'admin-no-photos'
  | 'admin-no-claims'

// =============================================================================
// EMPTY STATE MESSAGES
// =============================================================================

const emptyStates: Record<EmptyStateContext, EmptyStateContent> = {
  // ---------------------------------------------------------------------------
  // Search & Discovery
  // ---------------------------------------------------------------------------
  'search-no-results': {
    icon: <Search className="w-12 h-12" />,
    title: "We've checked the fields",
    description:
      "No farms match that search, but the countryside is vast. Try a different term or explore by county.",
    action: {
      label: 'Explore all farms',
      href: '/shop',
    },
  },
  'search-no-query': {
    icon: <Search className="w-12 h-12" />,
    title: 'Find real food near you',
    description:
      'Search by place, farm name, or what you fancy. Fresh eggs? Raw milk? Heritage veg?',
  },
  'filter-no-results': {
    icon: <Filter className="w-12 h-12" />,
    title: 'Nothing matches all those filters',
    description:
      'The harvest is selective this season. Try loosening a filter or two.',
    action: {
      label: 'Clear all filters',
    },
  },
  'map-no-farms': {
    icon: <Map className="w-12 h-12" />,
    title: 'Quiet fields here',
    description:
      "No farms listed in this spot yet. Pan around or zoom out to find what's nearby.",
    action: {
      label: 'Show all UK farms',
    },
  },
  'map-zoomed-out': {
    icon: <MapPin className="w-12 h-12" />,
    title: 'Zoom in to see the farms',
    description:
      "From this height, the fields blur together. Zoom in closer to see individual farms.",
  },

  // ---------------------------------------------------------------------------
  // Lists & Collections
  // ---------------------------------------------------------------------------
  'favorites-empty': {
    icon: <Heart className="w-12 h-12" />,
    title: 'Your basket is empty',
    description:
      "Tap the heart on farms you love. They'll be saved here for your next visit.",
    action: {
      label: 'Discover farms',
      href: '/shop',
    },
  },
  'recent-empty': {
    icon: <Clock className="w-12 h-12" />,
    title: 'No footprints yet',
    description:
      "Farms you visit will leave a trail here, making it easy to find them again.",
    action: {
      label: 'Start exploring',
      href: '/map',
    },
  },
  'compare-empty': {
    icon: <ShoppingBag className="w-12 h-12" />,
    title: 'Nothing on the scales',
    description:
      'Add farms to weigh them side by side: their produce, location, and what makes each special.',
    action: {
      label: 'Find farms',
      href: '/shop',
    },
  },

  // ---------------------------------------------------------------------------
  // Farm-specific
  // ---------------------------------------------------------------------------
  'county-no-farms': {
    icon: <Store className="w-12 h-12" />,
    title: 'Uncharted territory',
    description:
      "No farms listed here yet. Know a hidden gem in this county? Share your farm story.",
    action: {
      label: 'Share your farm story',
      href: '/add',
    },
  },
  'category-no-farms': {
    icon: <Leaf className="w-12 h-12" />,
    title: 'This field lies fallow',
    description:
      "We haven't found farms offering this in your area. Try another category or widen your search.",
    action: {
      label: 'Browse all categories',
      href: '/shop',
    },
  },
  'seasonal-nothing': {
    icon: <Calendar className="w-12 h-12" />,
    title: 'Between harvests',
    description:
      "The land is resting. Check back soon to see what's coming into season.",
    action: {
      label: 'View seasonal calendar',
      href: '/seasonal',
    },
  },
  'farm-no-photos': {
    icon: <Image className="w-12 h-12" />,
    title: 'No snapshots yet',
    description:
      "This farm's story is waiting to be told. Be the first to share a photo.",
    action: {
      label: 'Add a photo',
    },
  },
  'farm-no-reviews': {
    icon: <Star className="w-12 h-12" />,
    title: 'No voices yet',
    description:
      "This farm is waiting for its first review. Visit and share what you find.",
  },
  'farm-no-hours': {
    icon: <Clock className="w-12 h-12" />,
    title: 'Hours unknown',
    description:
      "We don't have opening times for this farm. Best to ring ahead or check their site.",
  },

  // ---------------------------------------------------------------------------
  // User content
  // ---------------------------------------------------------------------------
  'submissions-empty': {
    icon: <FileText className="w-12 h-12" />,
    title: 'No seeds planted',
    description:
      "You haven't shared any farms yet. Know a local gem? Share your farm story.",
    action: {
      label: 'Share your farm story',
      href: '/add',
    },
  },
  'claims-empty': {
    icon: <Store className="w-12 h-12" />,
    title: 'No farms claimed',
    description:
      "Run a farm that's listed? Claim it to keep your details fresh and tell your story.",
    action: {
      label: 'Find your farm',
      href: '/shop',
    },
  },
  'notifications-empty': {
    icon: <Bell className="w-12 h-12" />,
    title: 'All quiet on the farm',
    description: "Nothing new right now. We'll let you know when there's news.",
  },

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------
  'admin-no-pending': {
    icon: <FileText className="w-12 h-12" />,
    title: 'Barn is empty',
    description: 'All submissions reviewed. Check back when more come in from the field.',
  },
  'admin-no-photos': {
    icon: <Image className="w-12 h-12" />,
    title: 'Gallery curated',
    description: 'All photos have been sorted. New ones will appear here.',
  },
  'admin-no-claims': {
    icon: <Users className="w-12 h-12" />,
    title: 'Deeds in order',
    description: 'All ownership claims have been settled.',
  },
}

// =============================================================================
// FUNCTIONS
// =============================================================================

/**
 * Get empty state content by context
 */
export function getEmptyState(context: EmptyStateContext): EmptyStateContent {
  return emptyStates[context]
}

/**
 * Get empty state for search with custom query
 */
export function getSearchEmptyState(query?: string): EmptyStateContent {
  if (!query || query.trim() === '') {
    return emptyStates['search-no-query']
  }

  return {
    ...emptyStates['search-no-results'],
    description: `We've checked the fields for "${query}" but came up empty. Try different words or explore by county.`,
  }
}

/**
 * Get empty state for county with custom name
 */
export function getCountyEmptyState(countyName: string): EmptyStateContent {
  return {
    ...emptyStates['county-no-farms'],
    title: `${countyName} awaits`,
    description: `No farms listed in ${countyName} yet. Know a local gem? Share your farm story.`,
  }
}

/**
 * Get empty state for category with custom name
 */
export function getCategoryEmptyState(
  categoryName: string,
  countyName?: string
): EmptyStateContent {
  const location = countyName ? ` in ${countyName}` : ' nearby'

  return {
    ...emptyStates['category-no-farms'],
    title: `No ${categoryName.toLowerCase()} found`,
    description: `Haven't spotted ${categoryName.toLowerCase()}${location} yet. Try another category or cast a wider net.`,
  }
}

/**
 * Get empty state for map with custom bounds description
 */
export function getMapEmptyState(isZoomedOut: boolean): EmptyStateContent {
  return isZoomedOut
    ? emptyStates['map-zoomed-out']
    : emptyStates['map-no-farms']
}

/**
 * Create a custom empty state
 */
export function createEmptyState(
  icon: ReactNode,
  title: string,
  description: string,
  action?: { label: string; href?: string }
): EmptyStateContent {
  return { icon, title, description, action }
}

// =============================================================================
// SEASONAL EMPTY STATES
// =============================================================================

const seasonalMessages: Record<string, { title: string; description: string }> = {
  winter: {
    title: 'The land rests',
    description:
      'Fields lie fallow, but root cellars are full. Parsnips sweeten in the frost, and spring seeds are being sorted.',
  },
  spring: {
    title: 'First shoots breaking',
    description:
      'The soil is warming. Early greens are pushing through. Check back as the harvest unfolds.',
  },
  summer: {
    title: 'Abundance is coming',
    description:
      'The long days are working. Berries, stone fruits, and summer vegetables are ripening.',
  },
  autumn: {
    title: 'Harvest home',
    description:
      'The main crop is in. Apples, squash, and preserves fill the shelves. Winter stores are being laid down.',
  },
}

/**
 * Get seasonal empty state based on current month
 */
export function getSeasonalEmptyState(month?: number): EmptyStateContent {
  const currentMonth = month ?? new Date().getMonth()

  let season: string
  if (currentMonth >= 2 && currentMonth <= 4) {
    season = 'spring'
  } else if (currentMonth >= 5 && currentMonth <= 7) {
    season = 'summer'
  } else if (currentMonth >= 8 && currentMonth <= 10) {
    season = 'autumn'
  } else {
    season = 'winter'
  }

  const seasonal = seasonalMessages[season]

  return {
    icon: <Leaf className="w-12 h-12" />,
    title: seasonal.title,
    description: seasonal.description,
    action: {
      label: 'View seasonal calendar',
      href: '/seasonal',
    },
  }
}
