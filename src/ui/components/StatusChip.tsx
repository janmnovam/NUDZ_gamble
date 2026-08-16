import { CircleAlert, CircleCheck, TriangleAlert, type LucideIcon } from 'lucide-react'

import { type Status } from '@domain/config.ts'
import { useTranslation } from '@ui/i18n/context.ts'
import { type TranslationKey } from '@ui/i18n/types.ts'
import { cn } from '@ui/lib/cn.ts'

/**
 * The three limit states plus `NEUPLNE`, which reports a missing check-in in
 * the week rather than a limit outcome (Figma "StatusChip").
 */
export type ChipStatus = Status | 'NEUPLNE'

/**
 * Figma note on this component: "Barva nikdy nenese význam sama — vždy s
 * ikonou a slovem." Colour never carries the meaning on its own, so the icon
 * and the word are not optional.
 */
const STATUS_CLASSES: Record<ChipStatus, string> = {
  OK: 'bg-status-ok-subtle text-status-ok',
  POZOR: 'bg-status-caution-subtle text-status-caution',
  PREKROCENO: 'bg-status-exceeded-subtle text-status-exceeded',
  NEUPLNE: 'bg-status-caution-subtle text-status-caution',
}

const STATUS_ICONS: Record<ChipStatus, LucideIcon> = {
  OK: CircleCheck,
  POZOR: TriangleAlert,
  PREKROCENO: CircleAlert,
  NEUPLNE: TriangleAlert,
}

const STATUS_KEYS = {
  OK: 'status.OK',
  POZOR: 'status.POZOR',
  PREKROCENO: 'status.PREKROCENO',
  NEUPLNE: 'status.NEUPLNE',
} as const satisfies Record<ChipStatus, TranslationKey>

interface StatusChipProps {
  status: ChipStatus
  className?: string
}

/** Pill showing a limit state as icon + word. Shared by the dashboard and the reviews. */
export function StatusChip({ status, className }: StatusChipProps) {
  const { t } = useTranslation()
  const Icon = STATUS_ICONS[status]

  return (
    <span
      className={cn(
        'type-label-compact inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1',
        STATUS_CLASSES[status],
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {t(STATUS_KEYS[status])}
    </span>
  )
}
