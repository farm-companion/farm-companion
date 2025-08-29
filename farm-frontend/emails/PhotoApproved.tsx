import * as React from 'react'
import { Body, Button, Column, Container, Head, Hr, Html, Img, Preview, Row, Section, Text } from '@react-email/components'

export default function PhotoApprovedEmail({
  siteUrl, logoPath, farmName, farmSlug, photoUrl, caption,
}: { 
  siteUrl: string
  logoPath: string
  farmName: string
  farmSlug: string
  photoUrl?: string
  caption?: string 
}) {
  // PuredgeOS Brand Colors - ensuring high contrast and accessibility
  const brand = { 
    primary: '#00C2B2',        // Serum Teal - primary brand color
    accent: '#D4FF4F',         // Solar Lime - for highlights
    text: '#1E1F23',           // Obsidian Graphite - primary text
    textMuted: '#6F6F6F',      // Muted text with 4.5:1 contrast
    background: '#FFFFFF',     // Pure white background
    card: '#F9F9F7',           // Sandstone Fog - subtle card background
    border: '#E8EDF2',         // Light border with good contrast
    success: '#10B981',        // Success green for positive feedback
  }
  
  const preview = `Your photo for ${farmName} is now live 🎉`
  const farmLink = `${siteUrl}/shop/${encodeURIComponent(farmSlug)}#photos`
  
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
                Thanks for helping farmers shine 🌱
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
            {/* Success Message */}
            <Text style={{ 
              margin: 0, 
              fontSize: '18px',
              fontWeight: 600,
              color: brand.success,
              marginBottom: '16px'
            }}>
              Great news! 🎉
            </Text>
            
            {/* Approval Confirmation */}
            <Text style={{ 
              margin: 0,
              marginBottom: '16px',
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              Your photo for <strong style={{ color: brand.primary }}>{farmName}</strong> has been approved and is now live in the farm's gallery.
            </Text>

            {/* Photo Preview with Caption */}
            {photoUrl && (
              <Section style={{ marginBottom: '20px' }}>
                <Img
                  src={photoUrl}
                  alt={caption || 'Approved photo'}
                  width="552"
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    borderRadius: 10, 
                    border: `2px solid ${brand.border}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                {caption && (
                  <Text style={{ 
                    marginTop: '12px',
                    color: brand.textMuted, 
                    fontStyle: 'italic',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    "{caption}"
                  </Text>
                )}
              </Section>
            )}

            <Hr style={{ 
              borderColor: brand.border, 
              marginTop: '24px', 
              marginBottom: '24px',
              borderWidth: '1px'
            }} />

            {/* Call-to-Action Button */}
            <Button
              href={farmLink}
              style={{
                display: 'inline-block',
                backgroundColor: brand.primary,
                color: '#FFFFFF',
                padding: '14px 24px',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '16px',
                textAlign: 'center',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 194, 178, 0.3)'
              }}
            >
              View on the farm page →
            </Button>
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
