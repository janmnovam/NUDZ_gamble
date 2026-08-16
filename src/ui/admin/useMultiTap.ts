import { useCallback, useRef } from 'react'

/**
 * Returns a tap handler that fires `onActivate` after `count` taps land within
 * `windowMs` of each other — the hidden gesture that opens the admin overlay
 * (tap the day heading 7×). The counter resets on any pause longer than the
 * window, so ordinary taps never trigger it.
 */
export function useMultiTap(count: number, onActivate: () => void, windowMs = 2000): () => void {
  const taps = useRef(0)
  const timer = useRef<number | undefined>(undefined)

  return useCallback(() => {
    taps.current += 1
    window.clearTimeout(timer.current)
    if (taps.current >= count) {
      taps.current = 0
      onActivate()
      return
    }
    timer.current = window.setTimeout(() => {
      taps.current = 0
    }, windowMs)
  }, [count, onActivate, windowMs])
}
