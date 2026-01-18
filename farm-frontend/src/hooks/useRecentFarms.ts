'use client'

import { useState, useEffect, useCallback } from 'react'

export interface RecentFarm {
  id: string
  name: string
  slug: string
  county: string
  viewedAt: number
}

const STORAGE_KEY = 'farm-companion-recent-farms'
const MAX_RECENT_FARMS = 10

/**
 * Hook to track and retrieve recently viewed farms
 * Uses localStorage for persistence across sessions
 */
export function useRecentFarms() {
  const [recentFarms, setRecentFarms] = useState<RecentFarm[]>([])

  // Load recent farms from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as RecentFarm[]
        // Filter out farms older than 30 days
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
        const filtered = parsed.filter(f => f.viewedAt > thirtyDaysAgo)
        setRecentFarms(filtered)
      }
    } catch (error) {
      console.error('Error loading recent farms:', error)
    }
  }, [])

  // Add a farm to recent farms
  const addRecentFarm = useCallback((farm: { id: string; name: string; slug: string; county: string }) => {
    setRecentFarms(prev => {
      // Remove existing entry for this farm
      const filtered = prev.filter(f => f.id !== farm.id)

      // Add new entry at the beginning
      const newEntry: RecentFarm = {
        ...farm,
        viewedAt: Date.now()
      }

      // Keep only the most recent farms
      const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_FARMS)

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error('Error saving recent farms:', error)
      }

      return updated
    })
  }, [])

  // Clear all recent farms
  const clearRecentFarms = useCallback(() => {
    setRecentFarms([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing recent farms:', error)
    }
  }, [])

  return {
    recentFarms,
    addRecentFarm,
    clearRecentFarms
  }
}
