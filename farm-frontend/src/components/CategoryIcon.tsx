// Premium line-icon per category, replacing the emoji stored in Category.icon.
// Lucide icons match the site's existing line-art SVG language. Rendered in a
// brand-tinted rounded tile that fills on hover (the parent Link is `group`).
import { createElement } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Sprout, Cherry, Store, ShoppingBasket, Milk, Beef, Carrot, Apple, Coffee,
  Package, TreePine, Egg, House, GraduationCap, Citrus, Wheat, FerrisWheel,
  PawPrint, Grape, Beer, Salad, Fish, Flower2, Recycle, Moon, Handshake,
  IceCreamCone, Leaf, Hexagon, CookingPot, Shrub, Bird,
} from 'lucide-react'

/** slug -> icon. Every seeded category (seed-categories.ts) has an explicit entry. */
export const ICON_BY_SLUG: Record<string, LucideIcon> = {
  'organic-farms': Sprout,
  'pick-your-own': Cherry,
  'farm-shops': ShoppingBasket,
  'dairy-farms': Milk,
  'meat-producers': Beef,
  'vegetable-farms': Carrot,
  'fruit-farms': Apple,
  'farm-cafes': Coffee,
  'farmers-markets': Store,
  'veg-box-schemes': Package,
  'christmas-trees': TreePine,
  'free-range-eggs': Egg,
  'farm-stays': House,
  'educational-visits': GraduationCap,
  'pumpkin-patches': Citrus,
  'honey-beekeeping': Hexagon,
  'cider-apple-juice': Apple,
  'cheese-makers': Milk,
  'ice-cream-farms': IceCreamCone,
  'bakeries-flour-mills': Wheat,
  'farm-attractions': FerrisWheel,
  'farm-parks': PawPrint,
  'alpaca-farms': PawPrint,
  'vineyards': Grape,
  'breweries-distilleries': Beer,
  'herbs-salads': Salad,
  'preserves-jams': CookingPot,
  'fish-farms': Fish,
  'plant-nurseries': Shrub,
  'cut-flowers': Flower2,
  'regenerative-farms': Recycle,
  'biodynamic-farms': Moon,
  'csa': Handshake,
  'rare-breeds': Bird,
  'permaculture-farms': Leaf,
}

/** A neutral fallback for any unmapped slug. */
const FALLBACK: LucideIcon = Sprout

export function getCategoryIcon(slug: string): LucideIcon {
  return ICON_BY_SLUG[slug] ?? FALLBACK
}

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  // getCategoryIcon returns a stable, module-level Lucide component; createElement
  // selects it without tripping react-hooks/static-components (no render-scope component).
  return (
    <span
      className={
        'inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary ' +
        'transition-colors duration-300 group-hover:bg-brand-primary group-hover:text-white ' +
        (className ?? '')
      }
    >
      {createElement(getCategoryIcon(slug), { className: 'w-6 h-6', strokeWidth: 1.75, 'aria-hidden': true })}
    </span>
  )
}
