import { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const stackVariants = cva('flex', {
  variants: {
    direction: {
      row: 'flex-row',
      column: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'column-reverse': 'flex-col-reverse'
    },
    spacing: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      '2xl': 'gap-12'
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline'
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly'
    },
    wrap: {
      wrap: 'flex-wrap',
      nowrap: 'flex-nowrap',
      'wrap-reverse': 'flex-wrap-reverse'
    }
  },
  defaultVariants: {
    direction: 'column',
    spacing: 'md',
    align: 'stretch',
    justify: 'start',
    wrap: 'nowrap'
  }
})

interface StackProps extends VariantProps<typeof stackVariants> {
  children: ReactNode
  as?: 'div' | 'section' | 'article' | 'ul' | 'ol'
  className?: string
}

/**
 * Flexbox stack utility for consistent spacing and layout
 *
 * @example
 * ```tsx
 * // Vertical stack with default spacing
 * <Stack>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Stack>
 *
 * // Horizontal stack with center alignment
 * <Stack direction="row" align="center" spacing="lg">
 *   <Button>Left</Button>
 *   <Button>Right</Button>
 * </Stack>
 *
 * // Justify between with wrap
 * <Stack
 *   direction="row"
 *   justify="between"
 *   wrap="wrap"
 *   spacing="md"
 * >
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Stack>
 * ```
 */
export function Stack({
  children,
  direction,
  spacing,
  align,
  justify,
  wrap,
  as: Component = 'div',
  className
}: StackProps) {
  return (
    <Component
      className={stackVariants({
        direction,
        spacing,
        align,
        justify,
        wrap,
        className
      })}
    >
      {children}
    </Component>
  )
}
