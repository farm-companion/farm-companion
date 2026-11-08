import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { PAPER, INK, SEA_INK, VERMILION, Mark, Sunrise, brandFont } from '../brand'

export const runtime = 'edge'

/**
 * Profile furniture for the four platforms worth drawing for: Pinterest,
 * Instagram, Facebook and X. Rendered here rather than drawn by hand so the
 * type is the real display face and the palette can never drift from the card.
 *
 * Exported to files by `scripts/export-social-kit.sh`; these are uploads a
 * person makes, not assets the site serves.
 *
 * Safe areas are the whole job on these formats, and each platform crops
 * differently, so every one is commented with what actually gets cut.
 */

type Format = 'avatar' | 'x-header' | 'fb-cover'

const SIZES: Record<Format, { width: number; height: number }> = {
  // Circle-cropped by every platform, and about 32px wide in a feed.
  avatar: { width: 400, height: 400 },
  // X shows 1500x500 and overlaps the profile picture over the bottom left,
  // so nothing that must be read goes in the left 460px below the midline.
  'x-header': { width: 1500, height: 500 },
  // Facebook shows 820x312 on desktop but crops to roughly the central 640
  // on a phone, so the content sits inside that middle band.
  'fb-cover': { width: 820, height: 312 },
}

function Avatar() {
  // 0.62 keeps the mark's corners inside the circle every platform crops.
  return (
    <div
      style={{
        width: '400px',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PAPER,
      }}
    >
      <Mark size={248} />
    </div>
  )
}

function XHeader() {
  return (
    <div
      style={{
        width: '1500px',
        height: '500px',
        display: 'flex',
        backgroundColor: PAPER,
        position: 'relative',
        fontFamily: 'Clash Display',
      }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex' }}>
        <Sunrise width={620} height={500} cx={400} cy={250} radius={150} />
      </div>
      {/* The avatar covers only the lower left, so the type sits well left and
          stays above y=380 rather than leaving half the banner empty. */}
      <div
        style={{
          position: 'absolute',
          left: '180px',
          top: '140px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', fontSize: '66px', color: INK, lineHeight: 1.05 }}>
          Farm Companion
        </div>
        <div style={{ display: 'flex', marginTop: '14px', fontSize: '27px', color: SEA_INK }}>
          Every farm shop in the UK, on one map
        </div>
        <div
          style={{
            display: 'flex',
            width: '104px',
            height: '7px',
            marginTop: '22px',
            backgroundColor: VERMILION,
          }}
        />
      </div>
    </div>
  )
}

function FbCover() {
  return (
    <div
      style={{
        width: '820px',
        height: '312px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PAPER,
        position: 'relative',
        fontFamily: 'Clash Display',
      }}
    >
      {/* No plate motif here. A mirrored pair read as decoration and both got
          sliced by the phone crop; at this size the type carries it alone. */}
      {/* Inside the central 640 Facebook keeps on a phone. */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Mark size={58} />
        <div style={{ display: 'flex', marginTop: '16px', fontSize: '44px', color: INK }}>
          Farm Companion
        </div>
        <div style={{ display: 'flex', marginTop: '8px', fontSize: '20px', color: SEA_INK }}>
          Every farm shop in the UK, on one map
        </div>
        <div
          style={{
            display: 'flex',
            width: '92px',
            height: '6px',
            marginTop: '18px',
            backgroundColor: VERMILION,
          }}
        />
      </div>
    </div>
  )
}

const RENDERERS: Record<Format, () => React.ReactElement> = {
  avatar: Avatar,
  'x-header': XHeader,
  'fb-cover': FbCover,
}

/**
 * `Object.hasOwn`, not `in`: `in` walks the prototype chain, so `constructor`,
 * `toString`, `valueOf` and friends all passed this guard. The lookups below
 * then returned inherited functions rather than a renderer and a size, and
 * `ImageResponse` was called with no width or height.
 */
function isFormat(value: string | null): value is Format {
  return value !== null && Object.hasOwn(SIZES, value)
}

export async function GET(request: NextRequest) {
  const format = new URL(request.url).searchParams.get('format')
  if (!isFormat(format)) {
    return new Response(`Unknown format. One of: ${Object.keys(SIZES).join(', ')}`, {
      status: 400,
    })
  }

  // The card route has had this since it shipped. Without it a font fetch or a
  // satori failure leaves the caller a stack trace instead of a message.
  try {
    const Renderer = RENDERERS[format]
    return new ImageResponse(<Renderer />, {
      ...SIZES[format],
      fonts: await brandFont(),
    })
  } catch (error) {
    console.error('social kit render failed', error)
    return new Response('Could not render the social image', { status: 500 })
  }
}
