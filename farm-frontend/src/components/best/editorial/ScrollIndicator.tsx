/**
 * ScrollIndicator Component
 *
 * Minimalist vertical line animation for "Scroll to Discover".
 * No text, just elegant motion design.
 */

'use client'

interface ScrollIndicatorProps {
  targetId?: string
}

export function ScrollIndicator({ targetId = '#content' }: ScrollIndicatorProps) {
  const handleClick = () => {
    const target = document.querySelector(targetId)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 group cursor-pointer"
      aria-label="Scroll to discover content"
    >
      {/* Text - subtle, wide-tracked */}
      <span className="text-xs text-white/60 tracking-[0.2em] uppercase group-hover:text-white/80 transition-colors duration-300">
        Discover
      </span>

      {/* Animated vertical line */}
      <div className="relative w-px h-12 bg-white/20 overflow-hidden">
        {/* Animated fill */}
        <div className="absolute top-0 left-0 w-full bg-white/80 animate-scroll-line" />
      </div>

      {/* CSS for animation */}
      <style jsx>{`
        @keyframes scrollLine {
          0% {
            height: 0;
            top: 0;
          }
          50% {
            height: 100%;
            top: 0;
          }
          51% {
            height: 100%;
            top: 0;
          }
          100% {
            height: 0;
            top: 100%;
          }
        }
        .animate-scroll-line {
          animation: scrollLine 2s ease-in-out infinite;
        }
      `}</style>
    </button>
  )
}
