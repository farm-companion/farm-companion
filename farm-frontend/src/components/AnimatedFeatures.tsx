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
      color: 'serum'
    },
    {
      icon: Calendar,
      title: 'Seasonal Selection',
      description: "Discover what's in season and at its peak flavor throughout the year.",
      color: 'solar'
    },
    {
      icon: Heart,
      title: 'Family Values',
      description: 'Support local families and sustainable farming practices.',
      color: 'serum'
    }
  ]

  return (
    <section className="bg-background-surface py-16">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-heading font-bold text-text-heading mb-4"
          >
            Why Choose Farm Shops?
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-lg text-text-muted max-w-2xl mx-auto"
          >
            Experience the difference of truly fresh, local produce from family-run farms across the UK.
          </motion.p>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
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
              className="text-center p-6 rounded-lg bg-background-canvas border border-border-default"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={`w-16 h-16 bg-${feature.color}/10 rounded-full flex items-center justify-center mx-auto mb-4`}
              >
                <feature.icon className={`w-8 h-8 text-${feature.color}`} />
              </motion.div>
              <h3 className="text-xl font-heading font-semibold text-text-heading mb-2">
                {feature.title}
              </h3>
              <p className="text-text-muted">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
