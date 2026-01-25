'use client'

import { useMemo } from 'react'

interface NutritionData {
  kcal: number
  protein: number
  carbs: number
  sugars?: number
  fiber?: number
  fat?: number
}

interface NutritionRadialProps {
  nutrition: NutritionData
  size?: number
  variant?: 'full' | 'compact'
  className?: string
}

// Max values for normalization (per 100g, based on typical produce ranges)
const MAX_VALUES = {
  kcal: 120,
  protein: 10,
  carbs: 25,
  sugars: 15,
  fiber: 8,
  fat: 5,
}

// Colors for each nutrient
const NUTRIENT_COLORS = {
  kcal: { stroke: '#FF6B6B', fill: '#FF6B6B20', label: 'Calories' },
  protein: { stroke: '#4ECDC4', fill: '#4ECDC420', label: 'Protein' },
  carbs: { stroke: '#FFE66D', fill: '#FFE66D20', label: 'Carbs' },
  sugars: { stroke: '#FF9F43', fill: '#FF9F4320', label: 'Sugars' },
  fiber: { stroke: '#2ECC71', fill: '#2ECC7120', label: 'Fiber' },
  fat: { stroke: '#9B59B6', fill: '#9B59B620', label: 'Fat' },
}

/**
 * NutritionRadial Component
 *
 * Displays nutrition data in a radial/polar chart format.
 * Shows relative values compared to typical produce ranges.
 */
export function NutritionRadial({
  nutrition,
  size = 200,
  variant = 'full',
  className = '',
}: NutritionRadialProps) {
  // Build data points with normalized values
  const dataPoints = useMemo(() => {
    const points: Array<{
      key: keyof typeof NUTRIENT_COLORS
      value: number
      normalized: number
      unit: string
    }> = []

    if (nutrition.kcal !== undefined) {
      points.push({
        key: 'kcal',
        value: nutrition.kcal,
        normalized: Math.min(1, nutrition.kcal / MAX_VALUES.kcal),
        unit: 'kcal',
      })
    }
    if (nutrition.protein !== undefined) {
      points.push({
        key: 'protein',
        value: nutrition.protein,
        normalized: Math.min(1, nutrition.protein / MAX_VALUES.protein),
        unit: 'g',
      })
    }
    if (nutrition.carbs !== undefined) {
      points.push({
        key: 'carbs',
        value: nutrition.carbs,
        normalized: Math.min(1, nutrition.carbs / MAX_VALUES.carbs),
        unit: 'g',
      })
    }
    if (nutrition.fiber !== undefined) {
      points.push({
        key: 'fiber',
        value: nutrition.fiber,
        normalized: Math.min(1, nutrition.fiber / MAX_VALUES.fiber),
        unit: 'g',
      })
    }
    if (nutrition.sugars !== undefined) {
      points.push({
        key: 'sugars',
        value: nutrition.sugars,
        normalized: Math.min(1, nutrition.sugars / MAX_VALUES.sugars),
        unit: 'g',
      })
    }
    if (nutrition.fat !== undefined) {
      points.push({
        key: 'fat',
        value: nutrition.fat,
        normalized: Math.min(1, nutrition.fat / MAX_VALUES.fat),
        unit: 'g',
      })
    }

    return points
  }, [nutrition])

  // Calculate polygon points
  const polygonPoints = useMemo(() => {
    const centerX = size / 2
    const centerY = size / 2
    const maxRadius = (size / 2) - 30

    return dataPoints.map((point, index) => {
      const angle = (index * 360 / dataPoints.length - 90) * (Math.PI / 180)
      const radius = maxRadius * point.normalized
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        labelX: centerX + (maxRadius + 15) * Math.cos(angle),
        labelY: centerY + (maxRadius + 15) * Math.sin(angle),
        ...point,
      }
    })
  }, [dataPoints, size])

  if (variant === 'compact') {
    return <NutritionBars nutrition={nutrition} className={className} />
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto"
      >
        {/* Background circles */}
        {[0.25, 0.5, 0.75, 1].map((level) => (
          <circle
            key={level}
            cx={size / 2}
            cy={size / 2}
            r={((size / 2) - 30) * level}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-slate-200 dark:text-slate-700"
            strokeDasharray="4 4"
          />
        ))}

        {/* Axis lines */}
        {polygonPoints.map((point, index) => {
          const angle = (index * 360 / dataPoints.length - 90) * (Math.PI / 180)
          const endX = size / 2 + ((size / 2) - 30) * Math.cos(angle)
          const endY = size / 2 + ((size / 2) - 30) * Math.sin(angle)
          return (
            <line
              key={`axis-${index}`}
              x1={size / 2}
              y1={size / 2}
              x2={endX}
              y2={endY}
              stroke="currentColor"
              strokeWidth="1"
              className="text-slate-200 dark:text-slate-700"
            />
          )
        })}

        {/* Data polygon */}
        <polygon
          points={polygonPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="rgba(0, 194, 178, 0.2)"
          stroke="#00C2B2"
          strokeWidth="2"
          className="transition-all duration-500"
        />

        {/* Data points */}
        {polygonPoints.map((point) => (
          <g key={point.key}>
            <circle
              cx={point.x}
              cy={point.y}
              r={5}
              fill={NUTRIENT_COLORS[point.key].stroke}
              stroke="white"
              strokeWidth="2"
            />
          </g>
        ))}

        {/* Labels */}
        {polygonPoints.map((point) => (
          <text
            key={`label-${point.key}`}
            x={point.labelX}
            y={point.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] fill-slate-600 dark:fill-slate-400 font-medium"
          >
            {NUTRIENT_COLORS[point.key].label}
          </text>
        ))}

        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2 - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[20px] fill-slate-900 dark:fill-slate-100 font-bold"
        >
          {nutrition.kcal}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[10px] fill-slate-500 dark:fill-slate-400"
        >
          kcal/100g
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-small">
        {dataPoints.map((point) => (
          <div key={point.key} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: NUTRIENT_COLORS[point.key].stroke }}
            />
            <span className="text-slate-600 dark:text-slate-400">
              {NUTRIENT_COLORS[point.key].label}: {point.value}{point.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Alternative bar chart view for compact spaces
 */
function NutritionBars({
  nutrition,
  className = '',
}: {
  nutrition: NutritionData
  className?: string
}) {
  const bars = [
    { key: 'kcal', value: nutrition.kcal, max: MAX_VALUES.kcal, unit: 'kcal', ...NUTRIENT_COLORS.kcal },
    { key: 'protein', value: nutrition.protein, max: MAX_VALUES.protein, unit: 'g', ...NUTRIENT_COLORS.protein },
    { key: 'carbs', value: nutrition.carbs, max: MAX_VALUES.carbs, unit: 'g', ...NUTRIENT_COLORS.carbs },
    ...(nutrition.fiber !== undefined ? [{ key: 'fiber', value: nutrition.fiber, max: MAX_VALUES.fiber, unit: 'g', ...NUTRIENT_COLORS.fiber }] : []),
    ...(nutrition.fat !== undefined ? [{ key: 'fat', value: nutrition.fat, max: MAX_VALUES.fat, unit: 'g', ...NUTRIENT_COLORS.fat }] : []),
  ]

  return (
    <div className={`space-y-2 ${className}`}>
      {bars.map((bar) => (
        <div key={bar.key} className="flex items-center gap-2">
          <span className="w-16 text-small text-slate-600 dark:text-slate-400">
            {bar.label}
          </span>
          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (bar.value / bar.max) * 100)}%`,
                backgroundColor: bar.stroke,
              }}
            />
          </div>
          <span className="w-14 text-right text-small text-slate-700 dark:text-slate-300">
            {bar.value}{bar.unit}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Simple nutrition pills for inline display
 */
export function NutritionPills({
  nutrition,
  className = '',
}: {
  nutrition: NutritionData
  className?: string
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-full text-small font-medium">
        {nutrition.kcal} kcal
      </span>
      <span className="px-2 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-full text-small font-medium">
        {nutrition.protein}g protein
      </span>
      <span className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-full text-small font-medium">
        {nutrition.carbs}g carbs
      </span>
      {nutrition.fiber !== undefined && (
        <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-small font-medium">
          {nutrition.fiber}g fiber
        </span>
      )}
    </div>
  )
}
