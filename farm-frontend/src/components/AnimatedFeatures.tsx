'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { Leaf, Calendar, Heart } from 'lucide-react'

// Custom spring-like easing for natural, premium motion
const ease = [0.16, 1, 0.3, 1] as const

export function AnimatedFeatures() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  // Cinematic zoom-out: image starts zoomed in and slowly pulls back
  const bgScale = useTransform(scrollYProgress, [0, 0.6], [1.25, 1.0])
  const bgY = useTransform(scrollYProgress, [0, 1], ['-5%', '15%'])

  // Content parallax: slides up and fades in driven by scroll position
  const contentY = useTransform(scrollYProgress, [0.15, 0.4], [60, 0])
  const contentOpacity = useTransform(scrollYProgress, [0.15, 0.35], [0, 1])

  const features = [
    {
      icon: Leaf,
      title: "What's Good Near You",
      description:
        "Butchers who age their own beef. Dairies with milk from this morning. Orchards where you can taste before you buy.",
    },
    {
      icon: Calendar,
      title: 'In Season This Month',
      description:
        "February means forced rhubarb, purple sprouting broccoli, and the last of the stored apples. Here's where to find them.",
    },
    {
      icon: Heart,
      title: 'Properly Vetted',
      description:
        'We verify every listing. Own livestock, named suppliers, opening hours checked. No glorified delis.',
    },
  ]

  return (
    <section
      ref={sectionRef}
      className="relative py-32 md:py-44 lg:py-56 overflow-hidden"
    >
      {/* Cinematic parallax background -- only the image moves */}
      <motion.div
        className="absolute -inset-[15%]"
        style={{ y: bgY, scale: bgScale }}
      >
        <Image
          src="/oranges-background.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          quality={75}
        />
      </motion.div>

      {/* Fixed overlays -- stay in place while image drifts behind */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/55 to-black/85" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      {/* Warm cinematic colour wash */}
      <div className="absolute inset-0 bg-amber-950/15 mix-blend-multiply" />

      {/* Scroll-driven content */}
      <motion.div
        className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        {/* Editorial section header */}
        <div className="text-center mb-20 md:mb-28">
          {/* Animated vertical accent */}
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            transition={{ duration: 0.8, ease }}
            viewport={{ once: true }}
            className="w-px h-16 bg-white/30 mx-auto mb-10 origin-top"
            aria-hidden="true"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            viewport={{ once: true }}
            className="text-xs uppercase tracking-[0.3em] text-white/50 mb-6 font-accent"
          >
            Why Farm Shops
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-8 tracking-tight leading-[1.05]"
          >
            Taste the
            <br />
            Difference
          </motion.h2>

          {/* Animated horizontal rule */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.4, ease }}
            viewport={{ once: true }}
            className="w-20 h-px bg-white/40 mx-auto mb-8 origin-left"
            aria-hidden="true"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease }}
            viewport={{ once: true }}
            className="text-base sm:text-lg text-white/60 max-w-xl mx-auto leading-relaxed"
          >
            Fresh produce, named suppliers, and opening hours you can trust.
            From farm gate to your kitchen.
          </motion.p>
        </div>

        {/* Feature cards -- staggered entrance with glass morphism */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: index * 0.15,
                ease,
              }}
              viewport={{ once: true, margin: '-50px' }}
              whileHover={{
                y: -8,
                transition: { duration: 0.3, ease: 'easeOut' },
              }}
              className="group relative bg-white/[0.07] backdrop-blur-xl rounded-2xl border border-white/[0.1] p-8 sm:p-10 text-center transition-all duration-500 hover:bg-white/[0.12] hover:border-white/[0.22] hover:shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
            >
              {/* Icon in circular frame */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-white/20 mb-7 transition-all duration-500 group-hover:border-white/40 group-hover:bg-white/[0.06]">
                <feature.icon className="w-6 h-6 text-white/80 transition-colors duration-500 group-hover:text-white" />
              </div>

              <h3 className="text-xl sm:text-2xl font-heading font-semibold text-white mb-4 tracking-tight leading-tight">
                {feature.title}
              </h3>

              <p className="text-sm sm:text-[15px] text-white/50 leading-relaxed group-hover:text-white/70 transition-colors duration-500">
                {feature.description}
              </p>

              {/* Bottom accent line on hover */}
              <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-2xl" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
