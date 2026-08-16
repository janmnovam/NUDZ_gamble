import { cn } from '@ui/lib/cn.ts'

/**
 * The cell's own visual vocabulary, deliberately not the domain's `DayState`:
 * `backfilled` has no separate look (backfill is never shown to the user —
 * CLAUDE.md) and `today` is a presentation state the read model doesn't carry.
 * The screen maps `DayCellDto` onto this.
 */
export type DayCellState = 'completed' | 'missing' | 'today' | 'future'

interface DayCellStyle {
  container: string
  weekday: string
  day: string
  dot: string
}

/**
 * Every state carries a border so the 2px ring on `today` doesn't make that
 * cell taller than its neighbours.
 */
const STATE_STYLES: Record<DayCellState, DayCellStyle> = {
  completed: {
    container: 'bg-status-ok-subtle border-2 border-transparent',
    weekday: 'text-faint',
    day: 'text-ink',
    dot: 'bg-status-ok-fill',
  },
  missing: {
    container: 'bg-status-caution-subtle border-2 border-transparent',
    weekday: 'text-status-caution',
    day: 'text-status-caution',
    dot: 'bg-status-caution-fill',
  },
  today: {
    container: 'bg-brand-subtle border-2 border-brand',
    weekday: 'text-brand',
    day: 'text-brand',
    dot: 'bg-brand',
  },
  future: {
    container: 'bg-sunken border-2 border-transparent',
    weekday: 'text-disabled',
    day: 'text-faint',
    dot: 'bg-line-strong',
  },
}

interface DayCellProps {
  /** Localised weekday abbreviation, e.g. "út". Uppercased by `.type-overline`. */
  weekday: string
  /** Day of the month shown in the cell. */
  day: number
  state: DayCellState
  /** Full description for screen readers, e.g. "út 3 — chybí záznam". */
  ariaLabel: string
  /** Only `missing` days are actionable — they click through to backfill. */
  onClick?: () => void
}

/** One day of the current week's strip (Figma "DayCell"). */
export function DayCell({ weekday, day, state, ariaLabel, onClick }: DayCellProps) {
  const style = STATE_STYLES[state]
  const content = (
    <>
      <span className={cn('type-overline', style.weekday)}>{weekday}</span>
      <span className={cn('type-label', style.day)}>{day}</span>
      <span aria-hidden className={cn('size-1.5 rounded-full', style.dot)} />
    </>
  )
  const shared = cn(
    'flex h-[62px] flex-col items-center justify-center gap-0.5 rounded-md',
    style.container,
  )

  if (!onClick) {
    return (
      <div className={shared} aria-label={ariaLabel} role="img">
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        shared,
        'focus-visible:ring-brand transition focus-visible:ring-2 focus-visible:outline-none',
      )}
    >
      {content}
    </button>
  )
}
