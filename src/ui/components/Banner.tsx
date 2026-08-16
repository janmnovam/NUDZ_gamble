import { ChevronRight, type LucideIcon } from 'lucide-react'

import { cn } from '@ui/lib/cn.ts'

interface BannerProps {
  icon: LucideIcon
  title: string
  /** Optional second line. Omitted for the compact, single-line form. */
  body?: string
  /**
   * Makes the whole banner a button and reveals the chevron. Left out when the
   * banner is purely informational, so there is no affordance without a target.
   */
  onClick?: () => void
}

/**
 * The app's in-page notification surface (Figma "Banner") — it stands in for
 * Web Push, so a reminder, a missing-day prompt and a neutral notice all render
 * here rather than as a system notification.
 */
export function Banner({ icon: Icon, title, body, onClick }: BannerProps) {
  const content = (
    <>
      <Icon className="text-muted mt-0.5 size-5 shrink-0" aria-hidden />
      <span className="flex flex-1 flex-col gap-0.5 text-left">
        <span className="type-label text-ink">{title}</span>
        {body === undefined ? null : <span className="type-body-sm text-muted">{body}</span>}
      </span>
      {onClick ? <ChevronRight className="text-muted mt-0.5 size-4 shrink-0" aria-hidden /> : null}
    </>
  )
  const shared = 'bg-sunken flex w-full items-start gap-2.5 rounded-md p-3'

  if (!onClick) {
    return <div className={shared}>{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        shared,
        'focus-visible:ring-brand transition hover:brightness-[0.98] focus-visible:ring-2 focus-visible:outline-none',
      )}
    >
      {content}
    </button>
  )
}
