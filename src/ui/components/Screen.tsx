import { useEffect, useRef, type ReactNode } from 'react'

import { cn } from '@ui/lib/cn.ts'
import { useKeyboardInset } from '@ui/lib/useKeyboardInset.ts'

interface ScreenProps {
  children: ReactNode
  /** Optional top bar (e.g. a back arrow / step progress). */
  header?: ReactNode
  /** Optional pinned bottom area, typically the primary CTA. */
  footer?: ReactNode
  /** Optional bottom navigation, pinned below the footer (e.g. the tab bar). */
  nav?: ReactNode
  /** Extra classes for the scrolling content wrapper. Defaults to `gap-5`. */
  contentClassName?: string
}

/** Breathing room kept between the focused field and the top of the keyboard. */
const KEYBOARD_GAP = 100

/**
 * Mobile screen scaffold: a centered, phone-width column that fills the viewport.
 * Content scrolls; the footer and nav stay pinned. Device safe areas are respected
 * via `pt-safe` / `pb-safe` instead of drawing a mock status bar.
 *
 * Whichever element is bottom-most owns the bottom safe-area inset: with a `nav`
 * the footer falls back to plain spacing, so the two don't both pad for the notch.
 */
export function Screen({ children, header, footer, nav, contentClassName }: ScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const keyboardInset = useKeyboardInset()

  // iOS overlays the keyboard on top of the layout without resizing it, so a
  // field near the bottom ends up hidden behind it. The extra bottom padding
  // (below) grows the page so there is room to scroll; here, once the keyboard
  // is up, we scroll the page by exactly the number of pixels the focused field
  // is hidden, so it lands just above the keyboard. Scrolling the window (the
  // real scroller, since the shell is `min-h-dvh`) by an exact delta is both
  // reliable and instant — `scrollIntoView`'s centering under-scrolls on iOS,
  // and `behavior: 'smooth'` stutters as the keyboard animation re-fires this.
  useEffect(() => {
    const container = scrollRef.current
    const active = document.activeElement
    if (keyboardInset <= 0 || !container || !(active instanceof HTMLElement)) return
    if (!container.contains(active)) return

    const viewport = window.visualViewport
    const visibleBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight
    const hidden = active.getBoundingClientRect().bottom - (visibleBottom - KEYBOARD_GAP)
    if (hidden > 0) {
      window.scrollBy({ top: hidden })
    }
  }, [keyboardInset])

  return (
    <div
      className={cn(
        'pt-safe bg-canvas mx-auto flex w-full max-w-md flex-col',
        // With a nav to pin, the shell needs a definite height so the content
        // can shrink and scroll inside it. Without one, keep `min-h-dvh` so the
        // window stays the scroller for the keyboard handling above.
        nav ? 'h-dvh' : 'min-h-dvh',
      )}
    >
      {header}
      <div
        ref={scrollRef}
        className={cn(
          'flex flex-1 flex-col overflow-y-auto p-4',
          // A flex child defaults to `min-height: auto`, so without this it
          // refuses to shrink below its content and pushes the nav off the
          // bottom on short viewports. Only applied when there is a nav to
          // pin: elsewhere the window must stay the scroller for the
          // keyboard handling above.
          nav ? 'min-h-0' : null,
          contentClassName ?? 'gap-5',
        )}
        style={keyboardInset > 0 ? { paddingBottom: keyboardInset + KEYBOARD_GAP } : undefined}
      >
        {children}
      </div>
      {footer ? <div className={cn('px-4 pt-1', nav ? 'pb-5' : 'pb-safe')}>{footer}</div> : null}
      {nav ? <div className="pb-safe-inset">{nav}</div> : null}
    </div>
  )
}
