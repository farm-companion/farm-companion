/**
 * Empty State Messages
 *
 * Pre-configured empty state content for different contexts.
 * Used with the EmptyState component for consistent messaging.
 *
 * Voice guidelines:
 * - Be encouraging, not discouraging
 * - Suggest what the user can do next
 * - Keep it brief and friendly
 * - Use action-oriented language
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
    title: 'No results found',
    description:
      "We couldn't find any farm shops matching your search. Try different keywords or browse by county.",
    action: {
      label: 'Browse all shops',
      href: '/shop',
    },
  },
  'search-no-query': {
    icon: <Search className="w-12 h-12" />,
    title: 'Search for farm shops',
    description:
      'Enter a location, farm name, or product to find farm shops near you.',
  },
  'filter-no-results': {
    icon: <Filter className="w-12 h-12" />,
    title: 'No matches for these filters',
    description:
      'Try removing some filters to see more results. You can also search in a different area.',
    action: {
      label: 'Clear all filters',
    },
  },
  'map-no-farms': {
    icon: <Map className="w-12 h-12" />,
    title: 'No farm shops in this area',
    description:
      'Try zooming out or moving the map to explore nearby areas. Farm shops are spread across the UK.',
    action: {
      label: 'Show all UK farms',
    },
  },
  'map-zoomed-out': {
    icon: <MapPin className="w-12 h-12" />,
    title: 'Zoom in to see farm shops',
    description:
      'The map is zoomed out too far to show individual locations. Zoom in or search for a specific area.',
  },

  // ---------------------------------------------------------------------------
  // Lists & Collections
  // ---------------------------------------------------------------------------
  'favorites-empty': {
    icon: <Heart className="w-12 h-12" />,
    title: 'No favourites yet',
    description:
      "Save your favourite farm shops by tapping the heart icon. They'll appear here for easy access.",
    action: {
      label: 'Discover farm shops',
      href: '/shop',
    },
  },
  'recent-empty': {
    icon: <Clock className="w-12 h-12" />,
    title: 'No recent visits',
    description:
      "Farm shops you view will appear here so you can easily find them again.",
    action: {
      label: 'Start exploring',
      href: '/map',
    },
  },
  'compare-empty': {
    icon: <ShoppingBag className="w-12 h-12" />,
    title: 'Nothing to compare',
    description:
      'Add farm shops to compare their offerings, locations, and facilities side by side.',
    action: {
      label: 'Find farm shops',
      href: '/shop',
    },
  },

  // ---------------------------------------------------------------------------
  // Farm-specific
  // ---------------------------------------------------------------------------
  'county-no-farms': {
    icon: <Store className="w-12 h-12" />,
    title: 'No farm shops listed yet',
    description:
      "We don't have any farm shops listed in this county yet. Know one? Help us grow our directory.",
    action: {
      label: 'Add a farm shop',
      href: '/add',
    },
  },
  'category-no-farms': {
    icon: <Leaf className="w-12 h-12" />,
    title: 'No shops in this category',
    description:
      "We haven't found farm shops with this category in your area yet. Try a different category or location.",
    action: {
      label: 'Browse all categories',
      href: '/shop',
    },
  },
  'seasonal-nothing': {
    icon: <Calendar className="w-12 h-12" />,
    title: 'Nothing in season right now',
    description:
      'Check back soon or explore what produce is coming into season next month.',
    action: {
      label: 'View seasonal calendar',
      href: '/seasonal',
    },
  },
  'farm-no-photos': {
    icon: <Image className="w-12 h-12" />,
    title: 'No photos yet',
    description:
      'Be the first to share a photo of this farm shop. Help others see what to expect.',
    action: {
      label: 'Add a photo',
    },
  },
  'farm-no-reviews': {
    icon: <Star className="w-12 h-12" />,
    title: 'No reviews yet',
    description:
      "This farm shop hasn't been reviewed yet. Visit and share your experience to help others.",
  },
  'farm-no-hours': {
    icon: <Clock className="w-12 h-12" />,
    title: 'Opening hours not available',
    description:
      "We don't have opening hours for this farm shop. Contact them directly or check their website.",
  },

  // ---------------------------------------------------------------------------
  // User content
  // ---------------------------------------------------------------------------
  'submissions-empty': {
    icon: <FileText className="w-12 h-12" />,
    title: 'No submissions',
    description:
      "You haven't submitted any farm shops yet. Help grow our directory by adding local farms you know.",
    action: {
      label: 'Submit a farm shop',
      href: '/add',
    },
  },
  'claims-empty': {
    icon: <Store className="w-12 h-12" />,
    title: 'No claims',
    description:
      "You haven't claimed any farm shops. If you own or manage a listed farm, claim it to update the information.",
    action: {
      label: 'Find your farm',
      href: '/shop',
    },
  },
  'notifications-empty': {
    icon: <Bell className="w-12 h-12" />,
    title: 'No notifications',
    description: "You're all caught up. We'll notify you when there's something new.",
  },

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------
  'admin-no-pending': {
    icon: <FileText className="w-12 h-12" />,
    title: 'No pending items',
    description: 'All submissions have been reviewed. Check back later for new items.',
  },
  'admin-no-photos': {
    icon: <Image className="w-12 h-12" />,
    title: 'No photos to review',
    description: 'All photos have been moderated. New uploads will appear here.',
  },
  'admin-no-claims': {
    icon: <Users className="w-12 h-12" />,
    title: 'No pending claims',
    description: 'All ownership claims have been processed.',
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
    description: `We couldn't find any farm shops matching "${query}". Try different keywords or browse by county.`,
  }
}

/**
 * Get empty state for county with custom name
 */
export function getCountyEmptyState(countyName: string): EmptyStateContent {
  return {
    ...emptyStates['county-no-farms'],
    title: `No farm shops in ${countyName} yet`,
    description: `We don't have any farm shops listed in ${countyName} yet. Know one? Help us grow our directory.`,
  }
}

/**
 * Get empty state for category with custom name
 */
export function getCategoryEmptyState(
  categoryName: string,
  countyName?: string
): EmptyStateContent {
  const location = countyName ? ` in ${countyName}` : ' in your area'

  return {
    ...emptyStates['category-no-farms'],
    title: `No ${categoryName.toLowerCase()} shops found`,
    description: `We haven't found farm shops selling ${categoryName.toLowerCase()}${location} yet. Try a different category or location.`,
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
    title: 'Winter quietude',
    description:
      'Many crops are dormant now, but root vegetables and stored produce are available. Spring planting will begin soon.',
  },
  spring: {
    title: 'Spring is sprouting',
    description:
      'Early spring crops are just beginning. Check back as more produce comes into season over the coming weeks.',
  },
  summer: {
    title: 'Peak season ahead',
    description:
      'Summer abundance is coming. Many fruits and vegetables will be available soon.',
  },
  autumn: {
    title: 'Harvest winding down',
    description:
      'The main harvest is complete. Look for stored crops, preserves, and winter vegetables.',
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
