import { type ReactNode } from 'react'

import { cn } from '@ui/lib/cn.ts'

interface ScreenProps {
  children: ReactNode
  /** Optional top bar (e.g. a back arrow / step progress). */
  header?: ReactNode
  /** Optional pinned bottom area, typically the primary CTA. */
  footer?: ReactNode
  /** Extra classes for the scrolling content wrapper. Defaults to `gap-5`. */
  contentClassName?: string
}

/**
 * Mobile screen scaffold: a centered, phone-width column that fills the viewport.
 * Content scrolls; the footer stays pinned. Device safe areas are respected via
 * `pt-safe` / `pb-safe` instead of drawing a mock status bar.
 */
export function Screen({ children, header, footer, contentClassName }: ScreenProps) {
  return (
    <div className="pt-safe bg-canvas mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {header}
      <div className={cn('flex flex-1 flex-col overflow-y-auto p-4', contentClassName ?? 'gap-5')}>
        {children}
      </div>
      {footer ? <div className="pb-safe px-4 pt-1">{footer}</div> : null}
    </div>
  )
}
