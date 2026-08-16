import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react'

import type { ReviewStatus } from '@ui/review/types.ts'
import { useTranslation } from '@ui/i18n/context.ts'
import { cn } from '@ui/lib/cn.ts'

const STATUS_STYLES: Record<ReviewStatus, string> = {
  OK: 'bg-brand-subtle text-brand-ink',
  POZOR: 'bg-warning-subtle text-warning',
  PREKROCENO: 'bg-[#fdf1ec] text-[#9e4224]',
  NEUPLNE: 'bg-warning-subtle text-warning',
}

function StatusIcon({ status }: { status: ReviewStatus }) {
  if (status === 'OK') return <CircleCheck className="size-3.5" aria-hidden />
  if (status === 'PREKROCENO') return <CircleAlert className="size-3.5" aria-hidden />
  return <TriangleAlert className="size-3.5" aria-hidden />
}

export function StatusChip({ status, className }: { status: ReviewStatus; className?: string }) {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1',
        'type-label text-[12px] leading-4',
        STATUS_STYLES[status],
        className,
      )}
    >
      <StatusIcon status={status} />
      {t(`review.status.${status}`)}
    </span>
  )
}
