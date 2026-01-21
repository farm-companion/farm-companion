'use client'

export default function ClientMonthSelector({ currentMonth }: { currentMonth: number }) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-caption font-medium text-gray-600 dark:text-gray-400">Currently viewing:</span>
      <span className="text-heading font-semibold text-gray-900 dark:text-gray-100">{months[currentMonth - 1]}</span>
    </div>
  )
}
