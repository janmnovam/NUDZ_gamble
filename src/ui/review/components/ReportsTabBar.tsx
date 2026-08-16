import { ChartNoAxesCombined, Home, LifeBuoy } from 'lucide-react'

import { useTranslation } from '@ui/i18n/context.ts'
import { cn } from '@ui/lib/cn.ts'

const tabs = [
  { key: 'home', icon: Home, labelKey: 'review.tabs.home' },
  { key: 'coping', icon: LifeBuoy, labelKey: 'review.tabs.coping' },
  { key: 'reports', icon: ChartNoAxesCombined, labelKey: 'review.tabs.reports' },
] as const

export function ReportsTabBar() {
  const { t } = useTranslation()

  return (
    <nav
      aria-label={t('review.tabs.aria')}
      className="border-line bg-surface grid h-16 grid-cols-3 border-t"
    >
      {tabs.map((tab) => {
        const active = tab.key === 'reports'
        const Icon = tab.icon
        return (
          <div key={tab.key} className="flex min-w-0 flex-col items-center justify-center gap-1">
            {active ? <span className="bg-brand h-[3px] w-14 rounded-t-full" /> : null}
            <Icon
              className={cn('size-6', active ? 'text-brand' : 'text-muted')}
              strokeWidth={1.9}
              aria-hidden
            />
            <span className={cn('text-[12px] leading-4', active ? 'text-brand' : 'text-muted')}>
              {t(tab.labelKey)}
            </span>
          </div>
        )
      })}
    </nav>
  )
}
