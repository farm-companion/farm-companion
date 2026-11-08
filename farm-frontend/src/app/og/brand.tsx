/**
 * Shared Rotocalco Press furniture for every satori-rendered surface.
 *
 * This lives beside the OG route rather than in `src/lib` so that
 * `new URL('./ClashDisplay-Semibold.ttf', import.meta.url)` keeps resolving
 * against the font that sits in this directory.
 *
 * It exists because the brand constants were about to be needed in a second
 * renderer, and duplicating them is precisely how this project ended up
 * shipping three different palettes at once.
 *
 * Spec: docs/superpowers/specs/2026-05-19-pitti-press-design.md
 */

export const PAPER = '#F2EBDA'
export const INK = '#0F0E0C'
export const VERMILION = '#D33A2C'
export const SEA_INK = '#1F3A5F'

/**
 * The brand's misregistration tell: the second ink lands slightly off the
 * first, the way a two-colour press does. Defined once so every surface shares
 * it; at feed scale it is the only thing that identifies us.
 */
export const REGISTRATION_OFFSET = 7

/** The mark's arch, on the 1024 grid it was drawn on. */
export const ARCH_PATH =
  'M128 896 L128 512 A384 384 0 0 1 896 512 L896 896 L704 896 L704 576 A192 192 0 0 0 320 576 L320 896 Z'

export const clashDisplay = fetch(
  new URL('./ClashDisplay-Semibold.ttf', import.meta.url)
).then((res) => res.arrayBuffer())

export async function brandFont(): Promise<
  { name: string; data: ArrayBuffer; style: 'normal'; weight: 600 }[]
> {
  return [{ name: 'Clash Display', data: await clashDisplay, style: 'normal', weight: 600 }]
}

/** The mark: a Loam arch with the single Vermilion stamp inside it. */
export function Mark({ size, paper = PAPER }: { size: number; paper?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024">
      <rect width="1024" height="1024" fill={paper} />
      <circle cx="512" cy="672" r="144" fill={VERMILION} />
      <path fill={INK} fillRule="evenodd" d={ARCH_PATH} />
    </svg>
  )
}

/**
 * The plate motif: a half-disc sun over receding field lines, carrying the
 * registration offset. Used wherever a surface has no map plate of its own.
 *
 * `radius` keeps Vermilion near 5% of the frame, under the spec's 8% cap.
 */
export function Sunrise({
  width,
  height,
  cx,
  cy,
  radius,
}: {
  width: number
  height: number
  cx: number
  cy: number
  radius: number
}) {
  const arc = (x: number, y: number) =>
    `M${x - radius} ${y} A${radius} ${radius} 0 0 1 ${x + radius} ${y} Z`
  const barY = cy + radius * 0.24
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={arc(cx + REGISTRATION_OFFSET, cy + REGISTRATION_OFFSET)} fill={INK} />
      <path d={arc(cx, cy)} fill={VERMILION} />
      <rect
        x={cx - radius * 1.63}
        y={barY}
        width={radius * 2.49}
        height={radius * 0.2}
        fill={INK}
      />
      <rect
        x={cx - radius * 1.06}
        y={barY + radius * 0.44}
        width={radius * 1.92}
        height={radius * 0.2}
        fill={INK}
      />
    </svg>
  )
}

/** Flush-left masthead: mark, then the name in spaced capitals. */
export function Masthead({ size = 46, gap = 18 }: { size?: number; gap?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Mark size={size} />
      <div
        style={{
          display: 'flex',
          marginLeft: `${gap}px`,
          fontSize: `${Math.round(size * 0.46)}px`,
          letterSpacing: '0.2em',
          color: INK,
        }}
      >
        FARM COMPANION
      </div>
    </div>
  )
}
