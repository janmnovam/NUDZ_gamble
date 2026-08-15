import { useEffect, useState } from 'react'

/**
 * Pixels of the layout viewport currently hidden by the on-screen keyboard,
 * read from the visual viewport.
 *
 * iOS Safari overlays the keyboard on top of the page without shrinking the
 * layout viewport (or `100dvh`), so an input near the bottom of the screen gets
 * covered and there is nothing to scroll to. Callers pad their scroll area by
 * this amount to open up room, then bring the focused field back into view.
 *
 * Returns 0 where the API is missing (desktop browsers with no soft keyboard,
 * jsdom in tests) — a safe no-op.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const update = () => {
      // How much of the layout viewport sits below the (shrunk) visual viewport.
      const hidden = window.innerHeight - viewport.height - viewport.offsetTop
      setInset(Math.max(0, Math.round(hidden)))
    }

    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [])

  return inset
}
