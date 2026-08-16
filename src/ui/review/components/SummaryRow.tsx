import { cn } from '@ui/lib/cn.ts'

interface SummaryRowProps {
  label: string
  value: string
  /** Colours the value as a limit overshoot (used for exceeded stakes). */
  danger?: boolean
}

/** A label/value line in the week and programme summary cards. */
export function SummaryRow({ label, value, danger }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted text-[14px] leading-5">{label}</span>
      <span className={cn('type-label text-right', danger ? 'text-status-exceeded' : 'text-ink')}>
        {value}
      </span>
    </div>
  )
}
