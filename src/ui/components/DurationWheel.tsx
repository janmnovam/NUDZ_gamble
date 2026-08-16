import { useEffect, useMemo, useRef, type KeyboardEvent } from 'react'

const ITEM_HEIGHT = 44
const VISIBLE_ROWS = 5
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS
const PAD = (ITEM_HEIGHT * (VISIBLE_ROWS - 1)) / 2
// Fade the rows toward the top/bottom so the centered value reads as selected.
const FADE_MASK = 'linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent)'

const DEFAULT_MAX_MINUTES = 40 * 60

interface WheelColumnProps {
  value: number
  options: number[]
  onChange: (value: number) => void
  ariaLabel: string
  format: (value: number) => string
}

/** A single scroll-snapping column of numbers (one drum of the picker). */
function WheelColumn({ value, options, onChange, ariaLabel, format }: WheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const settleRef = useRef<number | undefined>(undefined)

  // Keep the scroll position in sync when the value changes from outside.
  useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const index = options.indexOf(value)
    if (index < 0) return
    const target = index * ITEM_HEIGHT
    if (Math.abs(element.scrollTop - target) > 1) {
      element.scrollTop = target
    }
  }, [value, options])

  // Cancel a pending scroll-settle on unmount. A programmatic scrollTop sync
  // fires a scroll event that schedules `settleRef`; if the drum unmounts before
  // it runs (e.g. navigating away right after a keyboard/scroll change), the
  // timeout would read a detached element's scrollTop (0) and emit onChange(0),
  // clobbering the committed value.
  useEffect(() => {
    return () => {
      window.clearTimeout(settleRef.current)
    }
  }, [])

  const handleScroll = () => {
    const element = scrollRef.current
    if (!element) return
    window.clearTimeout(settleRef.current)
    settleRef.current = window.setTimeout(() => {
      const index = Math.round(element.scrollTop / ITEM_HEIGHT)
      const clamped = Math.min(Math.max(index, 0), options.length - 1)
      const next = options[clamped]
      if (next !== undefined && next !== value) {
        onChange(next)
      }
    }, 90)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = options.indexOf(value)
    if (index < 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const next = options[Math.min(index + 1, options.length - 1)]
      if (next !== undefined) onChange(next)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      const next = options[Math.max(index - 1, 0)]
      if (next !== undefined) onChange(next)
    }
  }

  return (
    <div
      ref={scrollRef}
      role="listbox"
      aria-label={ariaLabel}
      tabIndex={0}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      className="hide-scrollbar focus-visible:ring-brand flex-1 snap-y snap-mandatory overflow-y-scroll rounded-sm outline-none focus-visible:ring-2"
      style={{ height: CONTAINER_HEIGHT, maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
    >
      <div style={{ height: PAD }} aria-hidden />
      {options.map((option) => (
        <div
          key={option}
          role="option"
          aria-selected={option === value}
          className="text-ink font-display flex h-11 snap-center items-center justify-center text-[26px] font-semibold"
        >
          {format(option)}
        </div>
      ))}
      <div style={{ height: PAD }} aria-hidden />
    </div>
  )
}

interface DurationWheelProps {
  /** Total duration in minutes. */
  minutes: number
  onChange: (minutes: number) => void
  hoursLabel: string
  minutesLabel: string
  hourUnit: string
  minuteUnit: string
  /** Upper bound for the total duration, in minutes. Caps both drums. */
  maxMinutes?: number
}

/**
 * A duration picker built as two scroll-snapping wheels (hours + minutes). Feels
 * like the native iOS wheel but has no AM/PM. `maxMinutes` caps the total: the
 * hours drum derives from it, and the minutes drum shrinks at the top hour — so
 * a cap of 0 locks both drums at 0, and non-hour-aligned caps work too.
 */
export function DurationWheel({
  minutes,
  onChange,
  hoursLabel,
  minutesLabel,
  hourUnit,
  minuteUnit,
  maxMinutes = DEFAULT_MAX_MINUTES,
}: DurationWheelProps) {
  const safeMinutes = Math.min(Math.max(minutes, 0), maxMinutes)
  const hours = Math.floor(safeMinutes / 60)
  const mins = safeMinutes % 60

  const maxHours = Math.floor(maxMinutes / 60)
  // At the top hour only the remaining minutes are reachable; otherwise 0–59.
  const maxMinuteForHour = hours >= maxHours ? maxMinutes % 60 : 59

  const hourOptions = useMemo(
    () => Array.from({ length: maxHours + 1 }, (_, index) => index),
    [maxHours],
  )
  const minuteOptions = useMemo(
    () => Array.from({ length: maxMinuteForHour + 1 }, (_, index) => index),
    [maxMinuteForHour],
  )

  const commit = (total: number) => {
    onChange(Math.min(Math.max(total, 0), maxMinutes))
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="bg-sunken pointer-events-none absolute inset-x-0 top-1/2 h-11 -translate-y-1/2 rounded-lg"
      />
      <div className="relative flex items-stretch">
        <WheelColumn
          value={hours}
          options={hourOptions}
          onChange={(value) => {
            commit(value * 60 + mins)
          }}
          ariaLabel={hoursLabel}
          format={(value) => `${String(value)} ${hourUnit}`}
        />
        <span aria-hidden className="bg-line my-auto h-9 w-px shrink-0" />
        <WheelColumn
          value={mins}
          options={minuteOptions}
          onChange={(value) => {
            commit(hours * 60 + value)
          }}
          ariaLabel={minutesLabel}
          format={(value) => `${String(value)} ${minuteUnit}`}
        />
      </div>
    </div>
  )
}
