import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Rotocalco Press, four flat inks. Spec: docs/superpowers/specs/2026-05-19-pitti-press-design.md
const PAPER = '#F2EBDA'
const INK = '#0F0E0C'
const VERMILION = '#D33A2C'
const SEA_INK = '#1F3A5F'

// The brand's misregistration tell: the second ink lands slightly off the first,
// the way a two-colour press does. Fixed once here so every card shares it.
const REGISTRATION_OFFSET = 7

const clashDisplay = fetch(
  new URL('./ClashDisplay-Semibold.ttf', import.meta.url)
).then((res) => res.arrayBuffer())

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'Farm Companion'
    const subtitle = searchParams.get('subtitle') || 'UK Farm Shops Directory'
    const farmName = searchParams.get('farmName')
    const county = searchParams.get('county')
    // Task 7 (region-first-verified-listings): this route is shared by every
    // og:image caller (shop listing, map, individual farm pages). Only the
    // farm-detail page ever sends farmName, and only it may also send
    // canClaim=1, which it does only once a human has verified the venue.
    // Absent or unrecognised, canClaim defaults to false, so the "Farm Shop"
    // label never renders unless the caller explicitly earns it.
    const canClaim = searchParams.get('canClaim') === '1'

    const headline = farmName || title
    const standfirst = farmName ? county : subtitle
    // Long farm names need to come down a step or the descender clips the rule.
    const headlineSize = headline.length > 28 ? 60 : headline.length > 18 ? 72 : 84

    const font = await clashDisplay

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            backgroundColor: PAPER,
            fontFamily: 'Clash Display',
            position: 'relative',
          }}
        >
          {/* The plate: a sunrise over a field line, bleeding off the right
              edge. Slice D replaces this fixed motif with a per-farm map
              fragment; the composition and the safe margins stay as they are. */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '430px',
              height: '630px',
              display: 'flex',
            }}
          >
            {/* A half-disc sun on the horizon, then two field lines receding.
                Vermilion stays near 5% of the canvas, under the spec's 8% cap,
                because it is the only chromatic moment on the card. */}
            <svg width="430" height="630" viewBox="0 0 430 630">
              <path
                d={`M${150 + REGISTRATION_OFFSET} ${300 + REGISTRATION_OFFSET} A150 150 0 0 1 ${450 + REGISTRATION_OFFSET} ${300 + REGISTRATION_OFFSET} Z`}
                fill={INK}
              />
              <path d="M150 300 A150 150 0 0 1 450 300 Z" fill={VERMILION} />
              <rect x="56" y="336" width="374" height="30" fill={INK} />
              <rect x="142" y="402" width="288" height="30" fill={INK} />
            </svg>
          </div>

          {/* Editorial column, flush left */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '68px 72px',
              width: '790px',
              height: '630px',
            }}
          >
            {/* Masthead */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="46" height="46" viewBox="0 0 1024 1024">
                <rect width="1024" height="1024" fill={PAPER} />
                <circle cx="512" cy="672" r="144" fill={VERMILION} />
                <path
                  fill={INK}
                  fillRule="evenodd"
                  d="M128 896 L128 512 A384 384 0 0 1 896 512 L896 896 L704 896 L704 576 A192 192 0 0 0 320 576 L320 896 Z"
                />
              </svg>
              <div
                style={{
                  display: 'flex',
                  marginLeft: '18px',
                  fontSize: '21px',
                  letterSpacing: '0.2em',
                  color: INK,
                }}
              >
                FARM COMPANION
              </div>
            </div>

            {/* Headline block */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  fontSize: `${headlineSize}px`,
                  lineHeight: 1.04,
                  color: INK,
                  maxWidth: '640px',
                }}
              >
                {headline}
              </div>

              {standfirst ? (
                <div
                  style={{
                    display: 'flex',
                    marginTop: '20px',
                    fontSize: '30px',
                    color: SEA_INK,
                  }}
                >
                  {standfirst}
                </div>
              ) : null}

              {/* The one vermilion stamp, earned only when the caller sends
                  canClaim=1. See the note on canClaim above. */}
              {canClaim ? (
                <div
                  style={{
                    display: 'flex',
                    alignSelf: 'flex-start',
                    marginTop: '26px',
                    padding: '9px 18px',
                    backgroundColor: VERMILION,
                    color: PAPER,
                    fontSize: '19px',
                    letterSpacing: '0.16em',
                  }}
                >
                  FARM SHOP
                </div>
              ) : null}
            </div>

            {/* Footline */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  width: '120px',
                  height: '7px',
                  backgroundColor: VERMILION,
                  marginBottom: '18px',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  fontSize: '20px',
                  letterSpacing: '0.14em',
                  color: INK,
                  opacity: 0.6,
                }}
              >
                FARMCOMPANION.CO.UK
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [{ name: 'Clash Display', data: font, style: 'normal', weight: 600 }],
      }
    )
  } catch (e) {
    console.log(`Error generating OG image: ${e instanceof Error ? e.message : 'Unknown error'}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
