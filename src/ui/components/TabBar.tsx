import { ChartNoAxesCombined, Home, LifeBuoy } from 'lucide-react'

import { useTranslation } from '@ui/i18n/context.ts'
import { cn } from '@ui/lib/cn.ts'
import { useAppView, type AppView } from '@ui/app/appView.ts'

const tabs = [
  { key: 'home', icon: Home, labelKey: 'nav.tabs.home' },
  { key: 'coping', icon: LifeBuoy, labelKey: 'nav.tabs.coping' },
  { key: 'reports', icon: ChartNoAxesCombined, labelKey: 'nav.tabs.reports' },
] as const

export type TabKey = (typeof tabs)[number]['key']

/** Which app view each tab opens. Absent = no screen built yet. */
const TAB_VIEWS: Partial<Record<TabKey, AppView>> = {
  home: 'dashboard',
  coping: 'coping',
  reports: 'reports',
}

interface TabBarProps {
  /** Which tab reads as current. Defaults to `reports` — the review screens' tab. */
  active?: TabKey
}

/**
 * The app's bottom navigation, shared by every screen that shows chrome
 * (dashboard, reviews, …). It lives here rather than in a feature folder
 * because no single feature owns it.
 */
export function TabBar({ active: activeKey = 'reports' }: TabBarProps = {}) {
  const { t } = useTranslation()
  const navigate = useAppView((state) => state.navigate)

  return (
    <nav
      aria-label={t('nav.tabs.aria')}
      className="border-line bg-surface grid h-16 grid-cols-3 border-t"
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey
        const Icon = tab.icon
        // A tab is only a control when there is somewhere to go — a future
        // tab with no screen yet stays static chrome rather than a dead-end tap.
        const target = TAB_VIEWS[tab.key]
        const reachable = !active && target !== undefined
        const content = (
          <>
            {/* Always rendered so switching tabs doesn't shift icons/labels. */}
            <span
              aria-hidden
              className={cn('h-[3px] w-14 rounded-t-full', active ? 'bg-brand' : 'bg-transparent')}
            />
            <Icon
              className={cn('size-6', active ? 'text-brand' : 'text-muted')}
              strokeWidth={1.9}
              aria-hidden
            />
            <span className={cn('text-[12px] leading-4', active ? 'text-brand' : 'text-muted')}>
              {t(tab.labelKey)}
            </span>
          </>
        )
        const layout = 'flex min-w-0 flex-col items-center justify-center gap-1'

        if (!reachable) {
          return (
            <div key={tab.key} className={layout} {...(active && { 'aria-current': 'page' })}>
              {content}
            </div>
          )
        }

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              navigate(target)
            }}
            className={cn(
              layout,
              'focus-visible:ring-brand focus-visible:ring-2 focus-visible:-outline-offset-2 focus-visible:outline-none',
            )}
          >
            {content}
          </button>
        )
      })}
    </nav>
  )
}
