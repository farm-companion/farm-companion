// Designed fallback hero for farms with no real (or Pitti) photo.
// Council verdict (2026-05-25): a *designed* branded card beats both grey
// placeholders and blanket AI imagery — it's premium, $0, and honest ("no
// photo yet"), without the authenticity cost of a geo-proximate stock photo
// mislabelled as the farm. Deterministic muted-earth gradient (Apothecary/
// Pitti palette) + farm name in the display face + county + a faint category
// line-icon motif. Pure CSS/SVG; no network, no AI, no attribution burden.
import { createElement } from 'react'
import { getCategoryIcon } from './CategoryIcon'

// Curated muted, earthy palettes (Aesop/Folio Society register) — never garish.
const PALETTES = [
  { from: '#5b6b4e', to: '#3f4d38', ink: '#f4f1e8' }, // olive
  { from: '#9a7b4f', to: '#6f5733', ink: '#f7f2e7' }, // ochre
  { from: '#6b7f6e', to: '#4a5c4d', ink: '#f2f3ec' }, // sage
  { from: '#a06a4f', to: '#774634', ink: '#f8efe6' }, // terracotta
  { from: '#7d8a5c', to: '#586141', ink: '#f5f3e7' }, // moss
  { from: '#8a7355', to: '#5e4c38', ink: '#f6f0e6' }, // clay
  { from: '#5e6f78', to: '#414e55', ink: '#eef2f3' }, // slate-sage
  { from: '#86697a', to: '#5d4756', ink: '#f4eef1' }, // plum-grey
] as const

/** Stable palette per farm (hash the name) so a farm always looks the same. */
function pickPalette(seed: string): (typeof PALETTES)[number] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return PALETTES[h % PALETTES.length]
}

export function FarmFallbackHero({
  name,
  county,
  categorySlug,
  className,
}: {
  name: string
  county?: string | null
  categorySlug?: string
  className?: string
}) {
  const p = pickPalette(name)
  const Icon = getCategoryIcon(categorySlug ?? '')
  return (
    <div
      className={'absolute inset-0 flex flex-col items-center justify-center overflow-hidden px-5 text-center ' + (className ?? '')}
      style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
      aria-hidden="true"
    >
      {/* Faint oversized category motif for texture (decorative). */}
      <span className="pointer-events-none absolute -right-7 -bottom-7" style={{ color: p.ink, opacity: 0.12 }}>
        {createElement(Icon, { className: 'w-44 h-44', strokeWidth: 1 })}
      </span>
      {/* Hairline inner frame for craft. */}
      <span className="pointer-events-none absolute inset-3 rounded-xl" style={{ boxShadow: `inset 0 0 0 1px ${p.ink}1f` }} />
      <span className="relative font-primary text-xl sm:text-2xl font-semibold leading-tight line-clamp-3" style={{ color: p.ink }}>
        {name}
      </span>
      {county && (
        <span className="relative mt-2 font-accent text-[11px] uppercase tracking-[0.2em]" style={{ color: p.ink, opacity: 0.82 }}>
          {county}
        </span>
      )}
    </div>
  )
}
