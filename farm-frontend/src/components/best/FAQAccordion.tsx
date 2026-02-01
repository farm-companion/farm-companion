'use client'

import { useState } from 'react'
import { ChevronDown, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQ {
  question: string
  answer: string
  tip?: string
}

interface FAQAccordionProps {
  faqs: FAQ[]
  title?: string
  className?: string
}

export function FAQAccordion({ faqs, title = 'The Organic Intel', className }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className={cn('', className)}>
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <Lightbulb className="w-6 h-6 text-amber-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
      </div>

      {/* Accordion Items */}
      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index

          return (
            <div
              key={index}
              className={cn(
                'rounded-xl border transition-all duration-300',
                isOpen
                  ? 'bg-white dark:bg-slate-900 border-brand-primary/30 shadow-lg shadow-brand-primary/5'
                  : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
              )}
            >
              {/* Question Button */}
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-slate-900 dark:text-white pr-4">
                  {faq.question}
                </span>
                <div
                  className={cn(
                    'flex-shrink-0 p-1 rounded-full transition-all duration-300',
                    isOpen ? 'bg-brand-primary text-white rotate-180' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  )}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* Answer Panel with Animation */}
              <div
                className={cn(
                  'grid transition-all duration-300 ease-in-out',
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                )}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5">
                    {/* Answer */}
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {faq.answer}
                    </p>

                    {/* Did You Know Tip */}
                    {faq.tip && (
                      <div className="mt-4 flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30">
                        <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                            Did you know?
                          </span>
                          <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                            {faq.tip}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

