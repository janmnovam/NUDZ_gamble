import { CircleAlert, CircleCheck, Clock, TriangleAlert, type LucideIcon } from 'lucide-react'

import { type Status } from '@domain/config.ts'
import { useTranslation } from '@ui/i18n/context.ts'
import { type TranslationKey } from '@ui/i18n/types.ts'
import { cn } from '@ui/lib/cn.ts'

/**
 * Limit verdicts plus two week-lifecycle states. They share the pill because
 * they occupy the same slot in a week row — but only one of them is ever a
 * verdict, so a running week never reads as a result.
 */
export type ChipStatus = Status | 'NEUPLNE' | 'PROBIHA' | 'CHYBI_UZAVRENI'

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
  PROBIHA: 'bg-brand-subtle text-brand-ink',
  CHYBI_UZAVRENI: 'bg-status-caution-subtle text-status-caution',
}

const STATUS_ICONS: Record<ChipStatus, LucideIcon> = {
  OK: CircleCheck,
  POZOR: TriangleAlert,
  PREKROCENO: CircleAlert,
  NEUPLNE: TriangleAlert,
  PROBIHA: Clock,
  CHYBI_UZAVRENI: TriangleAlert,
}

const STATUS_KEYS = {
  OK: 'status.OK',
  POZOR: 'status.POZOR',
  PREKROCENO: 'status.PREKROCENO',
  NEUPLNE: 'status.NEUPLNE',
  PROBIHA: 'status.PROBIHA',
  CHYBI_UZAVRENI: 'status.CHYBI_UZAVRENI',
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
