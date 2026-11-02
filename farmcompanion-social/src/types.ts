/**
 * TypeScript interfaces for farmcompanion-social
 */

export interface Farm {
  id: string;
  name: string;
  description?: string;
  /** URL slug, also the key for the farm's pre-generated map plate. */
  slug?: string;
  county?: string;
  /** Set only once a human has verified the venue is open to the public. */
  canClaim?: boolean;
}

export interface SocialCopy {
  caption: string;
  hashtags?: string[];
}

export interface GeneratedPost {
  copy: SocialCopy;
  imageUrl?: string;
}
