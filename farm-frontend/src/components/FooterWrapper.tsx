'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

export default function FooterWrapper() {
  const pathname = usePathname()
  
  // Hide footer on map page for better UX
  if (pathname === '/map') {
    return null
  }
  
  return <Footer />
}
