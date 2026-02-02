/**
 * DataCallout Component
 *
 * Oversized thin-weight numbers paired with tiny caption text.
 * Inspired by LV's climate reporting design.
 *
 * WCAG AA Compliant: Uses semantic color system for dark/light mode support.
 */

interface DataPoint {
  value: string
  label: string
  sublabel?: string
}

interface DataCalloutProps {
  data: DataPoint[]
  title?: string
  className?: string
}

export function DataCallout({ data, title, className = '' }: DataCalloutProps) {
  return (
    <section className={`py-16 md:py-24 bg-background-secondary ${className}`}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Section title */}
        {title && (
          <h2 className="text-xs tracking-[0.2em] uppercase text-foreground-muted text-center mb-16">
            {title}
          </h2>
        )}

        {/* Data grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {data.map((item, idx) => (
            <div key={idx} className="text-center">
              {/* Oversized number - thin weight */}
              <div
                className="text-5xl md:text-6xl lg:text-7xl font-light text-foreground leading-none mb-3"
                style={{ fontWeight: 200 }}
              >
                {item.value}
              </div>

              {/* Label - tiny, high-density */}
              <div className="text-xs tracking-[0.1em] uppercase text-foreground-muted">
                {item.label}
              </div>

              {/* Sublabel - even smaller */}
              {item.sublabel && (
                <div className="text-[10px] tracking-wide text-foreground-muted/60 mt-1">
                  {item.sublabel}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Horizontal variant for inline use
interface DataCalloutInlineProps {
  value: string
  label: string
  className?: string
}

export function DataCalloutInline({ value, label, className = '' }: DataCalloutInlineProps) {
  return (
    <div className={`flex items-baseline gap-3 ${className}`}>
      <span className="text-4xl md:text-5xl font-light text-foreground" style={{ fontWeight: 200 }}>
        {value}
      </span>
      <span className="text-xs tracking-[0.1em] uppercase text-foreground-muted">
        {label}
      </span>
    </div>
  )
}
