'use client'

/**
 * Toast Notification Component
 *
 * A beautiful, accessible toast notification system powered by Sonner.
 * Supports multiple variants, custom actions, and rich content.
 *
 * @example
 * ```tsx
 * import { toast } from '@/components/ui/Toast'
 *
 * // Simple usage
 * toast.success('Farm added successfully!')
 * toast.error('Failed to save changes')
 * toast.info('New features available')
 *
 * // With description
 * toast.success('Farm added!', {
 *   description: 'Manor Farm is now live on the platform'
 * })
 *
 * // With action button
 * toast.success('Changes saved', {
 *   action: {
 *     label: 'Undo',
 *     onClick: () => console.log('Undo clicked')
 *   }
 * })
 *
 * // Loading state
 * const toastId = toast.loading('Saving...')
 * // Later...
 * toast.success('Saved!', { id: toastId })
 *
 * // Promise-based
 * toast.promise(saveFarm(), {
 *   loading: 'Saving farm...',
 *   success: 'Farm saved!',
 *   error: 'Failed to save'
 * })
 * ```
 */

import { Toaster as Sonner, toast as sonnerToast } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Toaster Component
 *
 * Add this once in your root layout to enable toasts throughout your app.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { Toaster } from '@/components/ui/Toast'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <Toaster />
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-slate-950 dark:group-[.toaster]:text-slate-50 dark:group-[.toaster]:border-slate-800',
          description: 'group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400',
          actionButton:
            'group-[.toast]:bg-slate-900 group-[.toast]:text-slate-50 dark:group-[.toast]:bg-slate-50 dark:group-[.toast]:text-slate-900',
          cancelButton:
            'group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 dark:group-[.toast]:bg-slate-800 dark:group-[.toast]:text-slate-400',
        },
      }}
      {...props}
    />
  )
}

/**
 * Toast API
 *
 * Convenience wrapper around Sonner's toast function with TypeScript support.
 */
export const toast = {
  /**
   * Display a success toast
   */
  success: sonnerToast.success,

  /**
   * Display an error toast
   */
  error: sonnerToast.error,

  /**
   * Display an info toast
   */
  info: sonnerToast.info,

  /**
   * Display a warning toast
   */
  warning: sonnerToast.warning,

  /**
   * Display a loading toast
   * Returns an ID that can be used to update the toast later
   */
  loading: sonnerToast.loading,

  /**
   * Display a promise-based toast
   * Automatically updates based on promise state
   */
  promise: sonnerToast.promise,

  /**
   * Display a custom toast
   */
  custom: sonnerToast.custom,

  /**
   * Display a default toast
   */
  message: sonnerToast.message,

  /**
   * Dismiss a toast by ID
   */
  dismiss: sonnerToast.dismiss,
}
