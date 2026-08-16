import { type Status } from '@domain/config.ts'
import { cn } from '@ui/lib/cn.ts'

const TEXT_CLASSES: Record<Status, string> = {
  OK: 'text-status-ok',
  POZOR: 'text-status-caution',
  PREKROCENO: 'text-status-exceeded',
}

const FILL_CLASSES: Record<Status, string> = {
  OK: 'bg-status-ok-fill',
  POZOR: 'bg-status-caution-fill',
  PREKROCENO: 'bg-status-exceeded-fill',
}

interface LimitBarProps {
  /** Axis name, e.g. "Čas za týden". */
  label: string
  /**
   * Percent of the **weekly limit** used — not of the reference week. `null`
   * when the limit is 0, which hides the percentage entirely (CLAUDE.md).
   */
  percent: number | null
  /** Translated percentage, e.g. "88 %". Not rendered when `percent` is null. */
  percentLabel: string
  status: Status
  /** Where the OK/POZOR threshold tick sits, as a percent of the track. */
  thresholdPercent: number
  /** Read-back under the bar, e.g. "zbývá 8 h z 8 h". */
  note: string
}

/**
 * One limit's progress for the current week (Figma "LimitBar"): label + percent,
 * a track with the threshold tick, and a plain-language read-back.
 *
 * The fill is clamped at 100 % so an exceeded limit fills the track rather than
 * overflowing it; the percentage above still shows the true value (e.g. 108 %).
 */
export function LimitBar({
  label,
  percent,
  percentLabel,
  status,
  thresholdPercent,
  note,
}: LimitBarProps) {
  const fillPercent = percent === null ? 0 : Math.min(Math.max(percent, 0), 100)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="type-label text-muted">{label}</span>
        {percent === null ? null : (
          <span className={cn('type-label-lg', TEXT_CLASSES[status])}>{percentLabel}</span>
        )}
      </div>

      <div
        className="bg-sunken relative h-3 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent ?? 0}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {fillPercent > 0 ? (
          <div
            className={cn('absolute inset-y-0 left-0 rounded-full', FILL_CLASSES[status])}
            style={{ width: `${String(fillPercent)}%` }}
          />
        ) : null}
        <span
          aria-hidden
          className="bg-line-strong absolute inset-y-0 w-0.5"
          style={{ left: `${String(thresholdPercent)}%` }}
        />
      </div>

      <p className="type-body-sm text-faint">{note}</p>
    </div>
  )
}
