'use client'

import { motion } from 'framer-motion'
import { Leaf, Calendar, Heart } from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'

export function AnimatedFeatures() {
  const features = [
    {
      icon: Leaf,
      title: 'Fresh & Local',
      description: 'Direct from farm to table, ensuring maximum freshness and flavor.',
      colorBg: 'bg-serum/10',
      colorText: 'text-serum'
    },
    {
      icon: Calendar,
      title: 'Seasonal Selection',
      description: "Discover what's in season and at its peak flavor throughout the year.",
      colorBg: 'bg-solar/10',
      colorText: 'text-solar'
    },
    {
      icon: Heart,
      title: 'Family Values',
      description: 'Support local families and sustainable farming practices.',
      colorBg: 'bg-serum/10',
      colorText: 'text-serum'
    }
  ]

  return (
    <section className="bg-background-surface py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-8 md:mb-12"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-text-heading mb-3 md:mb-4"
          >
            Why Choose Farm Shops?
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto px-4"
          >
            Experience the difference of truly fresh, local produce from family-run farms across the UK.
          </motion.p>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              whileHover={{
                y: -8,
                boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="text-center p-5 sm:p-6 rounded-lg bg-background-canvas border border-border-default"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={`w-14 h-14 sm:w-16 sm:h-16 ${feature.colorBg} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}
              >
                <feature.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${feature.colorText}`} />
              </motion.div>
              <h3 className="text-lg sm:text-xl font-heading font-semibold text-text-heading mb-2">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-text-muted">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
