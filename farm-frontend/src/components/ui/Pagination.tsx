'use client'

/**
 * Pagination Component
 *
 * Accessible pagination controls with customizable display.
 *
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={page}
 *   totalPages={50}
 *   onPageChange={setPage}
 * />
 *
 * // With page size selector
 * <Pagination
 *   currentPage={page}
 *   totalPages={totalPages}
 *   totalItems={1299}
 *   pageSize={pageSize}
 *   onPageChange={setPage}
 *   onPageSizeChange={setPageSize}
 *   pageSizeOptions={[10, 20, 50, 100]}
 * />
 *
 * // Compact mode (for mobile)
 * <Pagination
 *   currentPage={page}
 *   totalPages={50}
 *   onPageChange={setPage}
 *   showPageNumbers={false}
 * />
 * ```
 */

import * as React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  showPageNumbers?: boolean
  showFirstLast?: boolean
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  showPageNumbers = true,
  showFirstLast = true,
  className,
}: PaginationProps) {
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  // Generate page numbers to display
  const getPageNumbers = () => {
    const delta = 2 // Number of pages to show on each side of current page
    const pages: (number | 'ellipsis')[] = []

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // First page
        i === totalPages || // Last page
        (i >= currentPage - delta && i <= currentPage + delta) // Pages around current
      ) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis')
      }
    }

    return pages
  }

  const pageNumbers = showPageNumbers ? getPageNumbers() : []

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {/* Info text */}
      {totalItems && pageSize && (
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to{' '}
          {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* First page button */}
        {showFirstLast && (
          <button
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200',
              'bg-white text-sm font-medium transition-colors',
              'hover:bg-slate-100 hover:text-slate-900',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950',
              'disabled:pointer-events-none disabled:opacity-50',
              'dark:border-slate-800 dark:bg-slate-950',
              'dark:hover:bg-slate-800 dark:hover:text-slate-50'
            )}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}

        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200',
            'bg-white text-sm font-medium transition-colors',
            'hover:bg-slate-100 hover:text-slate-900',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950',
            'disabled:pointer-events-none disabled:opacity-50',
            'dark:border-slate-800 dark:bg-slate-950',
            'dark:hover:bg-slate-800 dark:hover:text-slate-50'
          )}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        {showPageNumbers && (
          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) =>
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="inline-flex h-9 w-9 items-center justify-center text-slate-500"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={cn(
                    'inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md border',
                    'px-3 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950',
                    page === currentPage
                      ? 'border-slate-900 bg-slate-900 text-slate-50 dark:border-slate-50 dark:bg-slate-50 dark:text-slate-900'
                      : 'border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50'
                  )}
                  aria-label={`Go to page ${page}`}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              )
            )}
          </div>
        )}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200',
            'bg-white text-sm font-medium transition-colors',
            'hover:bg-slate-100 hover:text-slate-900',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950',
            'disabled:pointer-events-none disabled:opacity-50',
            'dark:border-slate-800 dark:bg-slate-950',
            'dark:hover:bg-slate-800 dark:hover:text-slate-50'
          )}
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last page button */}
        {showFirstLast && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext}
            className={cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200',
              'bg-white text-sm font-medium transition-colors',
              'hover:bg-slate-100 hover:text-slate-900',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950',
              'disabled:pointer-events-none disabled:opacity-50',
              'dark:border-slate-800 dark:bg-slate-950',
              'dark:hover:bg-slate-800 dark:hover:text-slate-50'
            )}
            aria-label="Go to last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Page size selector */}
      {onPageSizeChange && pageSize && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Show</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className={cn(
              'h-9 rounded-md border border-slate-200 bg-white px-2 text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950',
              'dark:border-slate-800 dark:bg-slate-950'
            )}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-500 dark:text-slate-400">per page</span>
        </div>
      )}
    </div>
  )
}
