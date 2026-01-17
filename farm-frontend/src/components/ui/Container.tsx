import { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const containerVariants = cva('mx-auto px-4 sm:px-6', {
  variants: {
    maxWidth: {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      '2xl': 'max-w-screen-2xl',
      full: 'max-w-full'
    },
    padding: {
      none: 'px-0',
      sm: 'px-4',
      md: 'px-4 sm:px-6',
      lg: 'px-4 sm:px-6 lg:px-8'
    }
  },
  defaultVariants: {
    maxWidth: 'xl',
    padding: 'md'
  }
})

interface ContainerProps extends VariantProps<typeof containerVariants> {
  children: ReactNode
  as?: 'div' | 'section' | 'article' | 'main'
  className?: string
}

/**
 * Responsive container component with configurable max-width and padding
 *
 * @example
 * ```tsx
 * // Default container (max-w-screen-xl)
 * <Container>
 *   <h1>Content</h1>
 * </Container>
 *
 * // Small container with custom padding
 * <Container maxWidth="sm" padding="lg">
 *   <p>Narrow content</p>
 * </Container>
 *
 * // Full width container
 * <Container maxWidth="full" padding="none">
 *   <div>Full width content</div>
 * </Container>
 *
 * // Semantic HTML
 * <Container as="main">
 *   <h1>Main Content</h1>
 * </Container>
 * ```
 */
export function Container({
  children,
  maxWidth,
  padding,
  as: Component = 'div',
  className
}: ContainerProps) {
  return (
    <Component className={containerVariants({ maxWidth, padding, className })}>
      {children}
    </Component>
  )
}
