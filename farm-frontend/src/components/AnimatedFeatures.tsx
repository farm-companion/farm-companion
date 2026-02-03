'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Leaf, Calendar, Heart } from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'

export function AnimatedFeatures() {
  const features = [
    {
      icon: Leaf,
      title: 'Fresh & Local',
      description: 'Direct from farm to table, ensuring maximum freshness and flavor.',
    },
    {
      icon: Calendar,
      title: 'Seasonal Selection',
      description: "Discover what's in season and at its peak flavor throughout the year.",
    },
    {
      icon: Heart,
      title: 'Family Values',
      description: 'Support local families and sustainable farming practices.',
    },
  ]

  return (
    <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden">
      {/* Full-bleed background */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1595855759920-86582396756a?w=1920&q=80&auto=format"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
          className="text-center mb-16 md:mb-20"
        >
          {/* Vertical line accent */}
          <motion.div
            variants={fadeInUp}
            className="w-px h-12 bg-white/40 mx-auto mb-8"
            aria-hidden="true"
          />

          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center justify-center w-16 h-16 border border-white/30 rounded-full mb-6"
          >
            <Leaf className="w-7 h-7 text-white/90" />
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-white mb-4 tracking-tight"
          >
            Why Choose Farm Shops?
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed"
          >
            Experience the difference of truly fresh, local produce from family-run farms across the UK.
          </motion.p>

          {/* Vertical line accent */}
          <motion.div
            variants={fadeInUp}
            className="w-px h-12 bg-white/40 mx-auto mt-8"
            aria-hidden="true"
          />
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="group relative bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 sm:p-10 text-center transition-all duration-500 hover:bg-white/15 hover:border-white/40 hover:-translate-y-1"
            >
              {/* Icon in circular frame */}
              <div className="inline-flex items-center justify-center w-14 h-14 border border-white/30 rounded-full mb-6 transition-colors duration-500 group-hover:border-white/50">
                <feature.icon className="w-6 h-6 text-white/90" />
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-normal text-white mb-3 tracking-tight">
                {feature.title}
              </h3>

              <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                {feature.description}
              </p>

              {/* Subtle hover glow */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent rounded-xl" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
