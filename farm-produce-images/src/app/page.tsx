'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ProduceImage } from '@/types/produce'

interface MonthData {
  month: number
  monthName: string
  images: ProduceImage[]
  produceTypes: string[]
}

export default function Home() {
  const [months, setMonths] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  useEffect(() => {
    fetchAllMonthData()
  }, [])

  const fetchAllMonthData = async () => {
    try {
      setLoading(true)
      const monthPromises = Array.from({ length: 12 }, (_, i) => 
        fetch(`/api/images?month=${i + 1}`).then(res => res.json())
      )
      
      const monthResponses = await Promise.all(monthPromises)
      const monthData: MonthData[] = monthResponses.map((response, index) => {
        const month = index + 1
        const images = response.success ? response.data.images : []
        const produceTypes = [...new Set(images.map((img: ProduceImage) => img.produceSlug))]
        
        return {
          month,
          monthName: monthNames[index],
          images,
          produceTypes
        }
      })
      
      setMonths(monthData)
    } catch (error) {
      console.error('Error fetching month data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMonthColor = (month: number) => {
    // Seasonal color scheme
    if (month >= 3 && month <= 5) return 'bg-green-100 border-green-300' // Spring
    if (month >= 6 && month <= 8) return 'bg-yellow-100 border-yellow-300' // Summer
    if (month >= 9 && month <= 11) return 'bg-orange-100 border-orange-300' // Autumn
    return 'bg-blue-100 border-blue-300' // Winter
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your produce images...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">🌾 Farm Produce Images</h1>
          <p className="mt-2 text-gray-600">Browse seasonal produce by month</p>
        </div>
      </header>

      {/* Month Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {months.map((monthData) => (
            <div
              key={monthData.month}
              className={`${getMonthColor(monthData.month)} rounded-lg border-2 p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-lg`}
              onClick={() => setSelectedMonth(selectedMonth === monthData.month ? null : monthData.month)}
            >
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {monthData.monthName}
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  {monthData.images.length} image{monthData.images.length !== 1 ? 's' : ''}
                </p>
                
                {monthData.produceTypes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                      In Season:
                    </p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {monthData.produceTypes.map((produce) => (
                        <span
                          key={produce}
                          className="px-2 py-1 bg-white/70 rounded-full text-xs font-medium text-gray-700"
                        >
                          {produce.replace('-', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {monthData.images.length === 0 && (
                  <p className="text-xs text-gray-500 italic">
                    No produce images yet
                  </p>
                )}
              </div>

              {/* Expanded Month View */}
              {selectedMonth === monthData.month && monthData.images.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-300">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                    {monthData.monthName} Produce
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {monthData.images.slice(0, 6).map((image) => (
                      <div key={image.id} className="relative group">
                        <Image
                          src={image.url}
                          alt={image.alt}
                          width={120}
                          height={90}
                          className="rounded-lg object-cover w-full h-20"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs text-center px-2">
                            {image.produceSlug.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                    {monthData.images.length > 6 && (
                      <div className="col-span-2 text-center">
                        <p className="text-sm text-gray-600">
                          +{monthData.images.length - 6} more images
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {months.reduce((sum, month) => sum + month.images.length, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Images</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {months.filter(month => month.images.length > 0).length}
              </p>
              <p className="text-sm text-gray-600">Months with Images</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {new Set(months.flatMap(month => month.produceTypes)).size}
              </p>
              <p className="text-sm text-gray-600">Produce Types</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {months.filter(month => month.images.length > 0).map(month => month.monthName).join(', ')}
              </p>
              <p className="text-sm text-gray-600">Active Months</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
