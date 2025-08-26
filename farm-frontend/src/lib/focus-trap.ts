export function trapFocus(container: HTMLElement) {
  const focusable = container.querySelectorAll<HTMLElement>(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  function onKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      ;(last || first)?.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      ;(first || last)?.focus()
    }
  }

  container.addEventListener('keydown', onKey)
  
  return () => container.removeEventListener('keydown', onKey)
}
