import { cn } from '@ui/lib/cn.ts'

interface StepProgressProps {
  /** 1-based index of the current step. */
  current: number
  /** Total number of steps (segments). */
  total: number
}

/** Segmented progress bar (Figma "StepProgress"). Filled segments = completed/current. */
export function StepProgress({ current, total }: StepProgressProps) {
  return (
    <div
      className="flex h-1 w-full items-center gap-1.5"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn('h-1 flex-1 rounded-full', index < current ? 'bg-brand' : 'bg-sunken')}
        />
      ))}
    </div>
  )
}
