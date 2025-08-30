import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'Farm Companion'
    const subtitle = searchParams.get('subtitle') || 'UK Farm Shops Directory'
    const type = searchParams.get('type') || 'default'
    const farmName = searchParams.get('farmName')
    const county = searchParams.get('county')



    // Background gradient based on type
    const getBackground = () => {
      switch (type) {
        case 'seasonal':
          return 'linear-gradient(135deg, #00C2B2 0%, #D4FF4F 100%)'
        case 'map':
          return 'linear-gradient(135deg, #00C2B2 0%, #4F46E5 100%)'
        case 'shop':
          return 'linear-gradient(135deg, #00C2B2 0%, #059669 100%)'
        case 'farm':
          return 'linear-gradient(135deg, #00C2B2 0%, #059669 100%)'
        default:
          return 'linear-gradient(135deg, #00C2B2 0%, #D4FF4F 100%)'
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            background: getBackground(),
            position: 'relative',
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            }}
          />
          
          {/* Logo/Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '20px',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.3)',
              }}
            >
              <span
                style={{
                  fontSize: '40px',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                🌾
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '4px',
                }}
              >
                Farm Companion
              </div>
              <div
                style={{
                  fontSize: '16px',
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                UK Farm Shops Directory
              </div>
            </div>
          </div>

          {/* Main content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: '800px',
              padding: '0 40px',
            }}
          >
            {farmName ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Farm name */}
                <h1
                  style={{
                    fontSize: '56px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: '0 0 16px 0',
                    lineHeight: '1.1',
                    textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  {farmName}
                </h1>

                {/* County */}
                {county && (
                  <p
                    style={{
                      fontSize: '28px',
                      color: 'rgba(255,255,255,0.9)',
                      margin: '0 0 16px 0',
                      lineHeight: '1.3',
                      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                    {county}
                  </p>
                )}

                {/* Farm shop indicator */}
                <p
                  style={{
                    fontSize: '24px',
                    color: 'rgba(255,255,255,0.8)',
                    margin: '0',
                    lineHeight: '1.3',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  Farm Shop
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <h1
                  style={{
                    fontSize: '64px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: '0 0 20px 0',
                    lineHeight: '1.1',
                    textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  {title}
                </h1>
                
                {subtitle && (
                  <p
                    style={{
                      fontSize: '32px',
                      color: 'rgba(255,255,255,0.9)',
                      margin: '0',
                      lineHeight: '1.3',
                      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bottom accent */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '18px',
            }}
          >
            <span style={{ display: 'inline' }}>🌱</span>
            <span style={{ display: 'inline' }}>Fresh Local Produce</span>
            <span style={{ display: 'inline' }}>🌱</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e) {
    console.log(`Error generating OG image: ${e instanceof Error ? e.message : 'Unknown error'}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
