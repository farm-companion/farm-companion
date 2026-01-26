'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2, CheckCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PostcodeResult {
  postcode: string
  admin_county: string | null
  admin_district: string
  parish: string | null
  latitude: number
  longitude: number
  region: string
  country: string
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    postcode: string
    county: string
    latitude: number
    longitude: number
    region: string
  }) => void
  initialPostcode?: string
  error?: boolean
  className?: string
}

/**
 * UK Address Autocomplete using Postcodes.io (free, no API key required)
 * Provides postcode lookup with auto-fill for county and coordinates
 */
export function AddressAutocomplete({
  onAddressSelect,
  initialPostcode = '',
  error = false,
  className,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(initialPostcode)
  const [suggestions, setSuggestions] = useState<PostcodeResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPostcode, setSelectedPostcode] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch postcode suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      // Use postcodes.io autocomplete endpoint
      const response = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(searchQuery)}/autocomplete`
      )
      const data = await response.json()

      if (data.status === 200 && data.result) {
        // Fetch full details for each suggested postcode
        const detailsPromises = data.result.slice(0, 5).map(async (postcode: string) => {
          const detailRes = await fetch(
            `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`
          )
          const detailData = await detailRes.json()
          return detailData.status === 200 ? detailData.result : null
        })

        const details = await Promise.all(detailsPromises)
        setSuggestions(details.filter(Boolean) as PostcodeResult[])
      } else {
        // Try direct lookup if autocomplete fails
        const directRes = await fetch(
          `https://api.postcodes.io/postcodes/${encodeURIComponent(searchQuery)}`
        )
        const directData = await directRes.json()
        if (directData.status === 200 && directData.result) {
          setSuggestions([directData.result])
        } else {
          setSuggestions([])
        }
      }
    } catch {
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query && query !== selectedPostcode) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(query)
        setIsOpen(true)
      }, 300)
    } else {
      setSuggestions([])
      setIsOpen(false)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, selectedPostcode, fetchSuggestions])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (result: PostcodeResult) => {
    setQuery(result.postcode)
    setSelectedPostcode(result.postcode)
    setIsOpen(false)
    setSuggestions([])

    onAddressSelect({
      postcode: result.postcode,
      county: result.admin_county || result.admin_district || result.region,
      latitude: result.latitude,
      longitude: result.longitude,
      region: result.region,
    })
  }

  const handleClear = () => {
    setQuery('')
    setSelectedPostcode(null)
    setSuggestions([])
    inputRef.current?.focus()
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value.toUpperCase())
            setSelectedPostcode(null)
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true)
          }}
          placeholder="Enter postcode (e.g. SW1A 1AA)"
          className={cn(
            'w-full rounded-lg border pl-10 pr-10 py-3 bg-background-canvas text-text-body',
            'focus:outline-none focus:ring-2 focus:ring-serum focus:border-serum transition-colors',
            error ? 'border-red-500' : 'border-border-default',
            selectedPostcode && 'border-green-500 bg-green-50/50 dark:bg-green-950/20'
          )}
          aria-label="Postcode search"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="w-4 h-4 text-text-muted animate-spin" />}
          {selectedPostcode && !isLoading && (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-background-surface rounded"
                aria-label="Clear postcode"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background-surface border border-border-default rounded-lg shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((result, index) => (
            <button
              key={result.postcode}
              type="button"
              onClick={() => handleSelect(result)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-background-canvas transition-colors',
                'focus:outline-none focus:bg-background-canvas',
                index !== suggestions.length - 1 && 'border-b border-border-default'
              )}
              role="option"
              aria-selected={false}
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-serum mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-text-heading">{result.postcode}</div>
                  <div className="text-caption text-text-muted">
                    {result.admin_district}
                    {result.admin_county && `, ${result.admin_county}`}
                    {result.region && ` - ${result.region}`}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && !isLoading && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background-surface border border-border-default rounded-lg shadow-lg p-4 text-center text-text-muted text-caption">
          No postcodes found. Try a different search.
        </div>
      )}
    </div>
  )
}
