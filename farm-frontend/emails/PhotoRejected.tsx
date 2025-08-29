import * as React from 'react'
import { Body, Button, Column, Container, Head, Hr, Html, Img, Preview, Row, Section, Text } from '@react-email/components'

export default function PhotoRejectedEmail({
  siteUrl, logoPath, farmName, farmSlug, caption, reason, guidelinesUrl,
}: { 
  siteUrl: string
  logoPath: string
  farmName: string
  farmSlug: string
  caption?: string
  reason?: string
  guidelinesUrl: string
}) {
  // PuredgeOS Brand Colors - gentle rejection styling
  const brand = { 
    primary: '#00C2B2',        // Serum Teal - primary brand color
    accent: '#D4FF4F',         // Solar Lime - for highlights
    text: '#1E1F23',           // Obsidian Graphite - primary text
    textMuted: '#6F6F6F',      // Muted text with 4.5:1 contrast
    background: '#FFFFFF',     // Pure white background
    card: '#FFF7F7',           // Gentle red-tinted background for rejection
    border: '#F7D7D7',         // Soft red border
    neutral: '#1E1F23',        // Neutral color for secondary actions
  }
  
  const preview = `About your photo for ${farmName}`
  const resubmit = `${siteUrl}/shop/${encodeURIComponent(farmSlug)}#submit-photo`
  
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ 
        backgroundColor: brand.background, 
        color: brand.text, 
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        fontSize: '16px',
        lineHeight: '1.6',
        margin: 0,
        padding: 0
      }}>
        <Container style={{ 
          maxWidth: 600, 
          margin: '0 auto', 
          padding: '24px',
          backgroundColor: brand.background
        }}>
          {/* Header with Logo and Brand Identity */}
          <Row style={{ alignItems: 'center', marginBottom: '32px' }}>
            <Column style={{ width: 48 }}>
              <Img 
                src={logoPath} 
                alt="Farm Companion Logo" 
                width="40" 
                height="40" 
                style={{ 
                  display: 'block', 
                  borderRadius: 8,
                  border: `2px solid ${brand.border}`
                }} 
              />
            </Column>
            <Column>
              <Text style={{ 
                margin: 0, 
                fontSize: '20px', 
                fontWeight: 700,
                color: brand.text,
                fontFamily: 'Satoshi, Inter, sans-serif'
              }}>
                Farm Companion
              </Text>
              <Text style={{ 
                margin: 0, 
                color: brand.textMuted, 
                fontSize: '14px',
                fontStyle: 'italic'
              }}>
                Thanks for contributing 🌱
              </Text>
            </Column>
          </Row>

          {/* Main Content Card */}
          <Section style={{ 
            marginBottom: '24px',
            border: `1px solid ${brand.border}`, 
            borderRadius: 12, 
            background: brand.card, 
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            {/* Gentle Rejection Message */}
            <Text style={{ 
              margin: 0, 
              fontSize: '18px',
              fontWeight: 600,
              color: brand.text,
              marginBottom: '16px'
            }}>
              Thanks for your photo.
            </Text>
            
            {/* Rejection Explanation */}
            <Text style={{ 
              margin: 0,
              marginBottom: '16px',
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              We reviewed your submission for <strong style={{ color: brand.primary }}>{farmName}</strong> but couldn't approve it this time.
            </Text>

            {/* Caption Display */}
            {caption && (
              <Text style={{ 
                marginBottom: '16px',
                color: brand.textMuted, 
                fontStyle: 'italic',
                fontSize: '14px'
              }}>
                "{caption}"
              </Text>
            )}

            {/* Reason Section */}
            {reason && (
              <>
                <Hr style={{ 
                  borderColor: brand.border, 
                  marginTop: '16px', 
                  marginBottom: '16px',
                  borderWidth: '1px'
                }} />
                <Text style={{ 
                  margin: 0,
                  marginBottom: '16px',
                  fontSize: '15px',
                  lineHeight: '1.6'
                }}>
                  <strong style={{ color: brand.text }}>Reason:</strong> {reason}
                </Text>
              </>
            )}

            <Hr style={{ 
              borderColor: brand.border, 
              marginTop: '16px', 
              marginBottom: '20px',
              borderWidth: '1px'
            }} />

            {/* Next Steps */}
            <Text style={{ 
              margin: 0,
              marginBottom: '20px',
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              You can resubmit a new photo anytime. For best results, please review our quick guidelines:
            </Text>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button
                href={guidelinesUrl}
                style={{
                  display: 'inline-block',
                  backgroundColor: brand.neutral,
                  color: '#FFFFFF',
                  padding: '12px 20px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  textAlign: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(30, 31, 35, 0.2)'
                }}
              >
                View Guidelines
              </Button>
              <Button
                href={resubmit}
                style={{
                  display: 'inline-block',
                  backgroundColor: brand.primary,
                  color: '#FFFFFF',
                  padding: '12px 20px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  textAlign: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 194, 178, 0.3)'
                }}
              >
                Resubmit a Photo
              </Button>
            </div>
          </Section>

          {/* Footer */}
          <Section style={{ 
            paddingTop: '16px',
            borderTop: `1px solid ${brand.border}`
          }}>
            <Text style={{ 
              color: brand.textMuted, 
              fontSize: '12px',
              margin: 0
            }}>
              © {new Date().getFullYear()} Farm Companion. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
