import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Farm Companion Admin Documentation - Complete Guide',
  description: 'Ultra-comprehensive guide for Farm Companion administrators covering authentication, photo management, claims processing, security, and troubleshooting',
}

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
