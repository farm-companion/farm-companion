'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight } from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'

interface AnimatedHeroProps {
  countyCount: number
}

export function AnimatedHero({ countyCount }: AnimatedHeroProps) {
  return (
    <section
      data-header-invert
      className="relative h-[75vh] min-h-[600px] md:h-[80vh] md:min-h-[700px] lg:h-screen lg:min-h-[800px] lg:max-h-[1000px] overflow-hidden"
    >
      {/* Background Image with Professional Handling */}
      <div className="absolute inset-0">
        <Image
          src="/main_header.jpg"
          alt="Colorful display of fresh vegetables, fruits, and flowers arranged in baskets at a UK farm shop, showcasing the variety of local produce available"
          fill
          className="object-cover object-center"
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={85}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />
        {/* Professional Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
        {/* Subtle texture overlay for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
      </div>

      {/* Content Overlay */}
      <div className="relative h-full flex items-center justify-center pt-16 pb-16 md:pt-20 md:pb-20">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="text-center max-w-4xl mx-auto px-6"
        >
          <h1 className="sr-only">Farm Companion — Find UK Farm Shops</h1>
          <motion.h2
            variants={staggerItem}
            className="text-display font-heading font-bold mb-4 md:mb-6 text-white drop-shadow-lg"
          >
            Find Fresh Local
            <span className="block text-serum drop-shadow-lg">Farm Shops</span>
          </motion.h2>

          <motion.p
            variants={staggerItem}
            className="text-body text-white/90 mb-6 md:mb-8 drop-shadow-md max-w-3xl mx-auto px-4"
          >
            Find farm shops near you with fresh local produce, seasonal UK fruit and vegetables,
            and authentic farm experiences across {countyCount} counties.
          </motion.p>

          <motion.div
            variants={staggerItem}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4"
          >
            <Link
              href="/map"
              className="bg-serum text-black h-12 sm:h-14 px-6 sm:px-8 rounded-lg font-semibold hover:bg-serum/90 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl backdrop-blur-sm hover:scale-105 transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serum focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <MapPin className="w-5 h-5" />
              <span className="text-caption font-semibold">Explore Farm Map</span>
            </Link>
            <Link
              href="/seasonal"
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white h-12 sm:h-14 px-6 sm:px-8 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105 transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span className="text-caption font-semibold">What&apos;s in Season</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Subtle Scroll Indicator (hidden on mobile to save space) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="hidden sm:block absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
