import { Lock } from 'lucide-react'

import { cn } from '@ui/lib/cn.ts'

/**
 * The cell's own visual vocabulary, deliberately not the domain's `DayState`:
 * `backfilled` has no separate look (backfill is never shown to the user —
 * CLAUDE.md) and `today` is a presentation state the read model doesn't carry.
 * The screen maps `DayCellDto` onto this.
 */
export type DayCellState =
  | 'completed'
  | 'missing'
  | 'today'
  | 'future'
  /** Calendar day before the programme started — shown with a lock, no dot. */
  | 'locked'
  /** Calendar day after the programme ended; padding in the month grid. */
  | 'outside'

interface DayCellStyle {
  container: string
  /**
   * Border colour, kept separate from `container` so it is the *only*
   * border-colour class on the cell: the `ring` highlight swaps it for
   * `border-brand` outright. Appending `border-brand` alongside a
   * `border-transparent` container instead would lose to it in the cascade
   * (Tailwind emits `.border-transparent` after `.border-brand`), leaving the
   * current-day ring invisible.
   */
  border: string
  weekday: string
  day: string
  dot: string
}

/** Every state carries a 2px border (added in the base) so `ring` never changes the cell's height. */
const STATE_STYLES: Record<DayCellState, DayCellStyle> = {
  completed: {
    container: 'bg-status-ok-subtle',
    border: 'border-transparent',
    weekday: 'text-faint',
    day: 'text-ink',
    dot: 'bg-status-ok-fill',
  },
  missing: {
    container: 'bg-status-caution-subtle',
    border: 'border-status-caution-fill',
    weekday: 'text-status-caution',
    day: 'text-status-caution',
    dot: 'bg-status-caution-fill',
  },
  // Today has no record of its own — a check-in always covers the previous day
  // — so it must not borrow the filled-in look. The ring marks where you are;
  // the neutral fill says there is nothing here yet.
  today: {
    container: 'bg-sunken',
    border: 'border-brand',
    weekday: 'text-brand',
    day: 'text-brand',
    dot: 'bg-line-strong',
  },
  locked: {
    container: '',
    border: 'border-transparent',
    weekday: 'text-faint',
    day: 'text-faint',
    dot: '',
  },
  outside: {
    container: 'bg-sunken',
    border: 'border-transparent',
    weekday: 'text-faint',
    day: 'text-faint',
    dot: '',
  },
  future: {
    container: 'bg-sunken',
    border: 'border-transparent',
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
  /**
   * Rings the cell as the current day. Separate from `state` because in the
   * month grid today usually already *has* a state — a filled-in day that
   * happens to be today keeps its fill and gains the ring.
   */
  ring?: boolean
  /** Full description for screen readers, e.g. "út 3 — chybí záznam". */
  ariaLabel: string
  /** Only `missing` days are actionable — they click through to backfill. */
  onClick?: () => void
}

/** One day of the current week's strip (Figma "DayCell"). */
export function DayCell({ weekday, day, state, ring, ariaLabel, onClick }: DayCellProps) {
  const style = STATE_STYLES[state]
  const content = (
    <>
      <span className={cn('type-overline', style.weekday)}>{weekday}</span>
      <span className={cn('type-label', ring ? 'text-brand' : style.day)}>{day}</span>
      {state === 'locked' ? (
        <Lock className="text-muted size-3" aria-hidden />
      ) : (
        <span aria-hidden className={cn('size-1.5 rounded-full', style.dot || 'bg-transparent')} />
      )}
    </>
  )
  const shared = cn(
    'flex h-[62px] flex-col items-center justify-center gap-0.5 rounded-md border-2',
    style.container,
    // Exactly one border-colour class, so the ring wins outright instead of
    // fighting the container's border in the cascade.
    ring ? 'border-brand' : style.border,
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
