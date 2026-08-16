import { useEffect, useState } from 'react'
import { Circle, CircleAlert, CircleCheck, History } from 'lucide-react'

import type { AxisDto, DashboardResponse, DayCellDto } from '@/app/dto/dashboard.ts'
import type { Status } from '@domain/config.ts'
import type { PendingAction } from '@domain/guards.ts'
import { Card } from '@ui/components/Card.tsx'
import { Screen } from '@ui/components/Screen.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import { pluralCategory, type PluralCategory } from '@ui/i18n/plural.ts'
import { type TranslationKey } from '@ui/i18n/types.ts'
import { app } from '@ui/services.ts'
import { cn } from '@ui/lib/cn.ts'
import { formatHoursMinutes } from '@ui/lib/duration.ts'
import { groupThousands } from '@ui/lib/money.ts'

const STATUS_TEXT_CLASS: Record<Status, string> = {
  OK: 'text-status-ok',
  POZOR: 'text-status-caution',
  PREKROCENO: 'text-status-exceeded',
}
const STATUS_BG_CLASS: Record<Status, string> = {
  OK: 'bg-status-ok/10',
  POZOR: 'bg-status-caution/10',
  PREKROCENO: 'bg-status-exceeded/10',
}
const STATUS_BAR_CLASS: Record<Status, string> = {
  OK: 'bg-status-ok',
  POZOR: 'bg-status-caution',
  PREKROCENO: 'bg-status-exceeded',
}
const STATUS_LABEL_KEY: Record<Status, TranslationKey> = {
  OK: 'dashboard.status.OK',
  POZOR: 'dashboard.status.POZOR',
  PREKROCENO: 'dashboard.status.PREKROCENO',
}

const DAY_STATE_ICON: Record<DayCellDto['state'], typeof CircleCheck> = {
  completed: CircleCheck,
  backfilled: History,
  missing: CircleAlert,
  future: Circle,
}
const DAY_STATE_LABEL_KEY: Record<DayCellDto['state'], TranslationKey> = {
  completed: 'dashboard.week.day.completed',
  backfilled: 'dashboard.week.day.backfilled',
  missing: 'dashboard.week.day.missing',
  future: 'dashboard.week.day.future',
}

const MISSING_COUNT_KEYS = {
  one: 'dashboard.missing.one',
  few: 'dashboard.missing.few',
  other: 'dashboard.missing.other',
} as const satisfies Record<PluralCategory, TranslationKey>

const PENDING_ACTION_KEY: Partial<Record<PendingAction, TranslationKey>> = {
  checkin_due: 'dashboard.pending.checkinDue',
  review_available: 'dashboard.pending.reviewAvailable',
  final_summary: 'dashboard.pending.finalSummary',
}

interface AxisCardProps {
  axis: AxisDto
  label: string
  formatUsed: (used: number, limit: number) => string
  formatRemaining: (value: number) => string
}

function AxisCard({ axis, label, formatUsed, formatRemaining }: AxisCardProps) {
  const { t } = useTranslation()
  const barWidth = axis.percent === null ? 0 : Math.min(100, Math.max(0, axis.percent))

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="type-body-emphasis text-ink">{label}</span>
        <span
          className={cn(
            'type-body-sm rounded-full px-2 py-0.5',
            STATUS_TEXT_CLASS[axis.status],
            STATUS_BG_CLASS[axis.status],
          )}
        >
          {t(STATUS_LABEL_KEY[axis.status])}
        </span>
      </div>

      <span className="type-metric text-ink">{formatUsed(axis.used, axis.limit)}</span>

      <div className="bg-sunken h-2 overflow-hidden rounded-full">
        <div
          className={cn('h-full rounded-full', STATUS_BAR_CLASS[axis.status])}
          style={{ width: `${String(barWidth)}%` }}
        />
      </div>

      <span className="text-muted type-body-sm">{formatRemaining(axis.remaining)}</span>
    </Card>
  )
}

/** Dashboard screen (doc 08) — the current week's cumulative status, fetched fresh from `DashboardService`. */
export function Dashboard() {
  const { t, locale } = useTranslation()
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void app.dashboard
      .getDashboard()
      .then((res) => {
        if (active) setDashboard(res)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      active = false
    }
  }, [])

  if (error) {
    return (
      <Screen>
        <Card tone="warning">
          <p className="type-body-sm text-ink">{error}</p>
        </Card>
      </Screen>
    )
  }

  if (!dashboard) {
    return <Screen>{null}</Screen>
  }

  const formatTimeUsed = (used: number, limit: number) =>
    t('dashboard.axis.used', {
      used: formatHoursMinutes(used, t('checkin.time.unitHour'), t('checkin.time.unitMinute')),
      limit: formatHoursMinutes(limit, t('checkin.time.unitHour'), t('checkin.time.unitMinute')),
    })
  const formatTimeRemaining = (value: number) =>
    t(value < 0 ? 'dashboard.axis.overBy' : 'dashboard.axis.remaining', {
      value: formatHoursMinutes(
        Math.abs(value),
        t('checkin.time.unitHour'),
        t('checkin.time.unitMinute'),
      ),
    })
  const formatStakesUsed = (used: number, limit: number) =>
    t('dashboard.axis.usedMoney', { used: groupThousands(used), limit: groupThousands(limit) })
  const formatStakesRemaining = (value: number) =>
    t(value < 0 ? 'dashboard.axis.overByMoney' : 'dashboard.axis.remainingMoney', {
      value: groupThousands(Math.abs(value)),
    })

  const missingCount = dashboard.missingDays.length
  const pendingKey =
    dashboard.pendingAction === 'none' ? undefined : PENDING_ACTION_KEY[dashboard.pendingAction]

  return (
    <Screen>
      <div className="flex flex-col gap-1">
        <span className="type-overline text-muted">
          {dashboard.studyDay > 0
            ? t('dashboard.header.day', { day: dashboard.studyDay, week: dashboard.weekNo })
            : t('dashboard.header.beforeStart')}
        </span>
        <span
          className={cn(
            'type-label-lg inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1',
            STATUS_TEXT_CLASS[dashboard.overallStatus],
            STATUS_BG_CLASS[dashboard.overallStatus],
          )}
        >
          {t(STATUS_LABEL_KEY[dashboard.overallStatus])}
        </span>
      </div>

      {pendingKey && (
        <Card tone="warning">
          <p className="type-body-emphasis text-ink">{t(pendingKey)}</p>
        </Card>
      )}

      <AxisCard
        axis={dashboard.time}
        label={t('dashboard.axis.time.label')}
        formatUsed={formatTimeUsed}
        formatRemaining={formatTimeRemaining}
      />
      <AxisCard
        axis={dashboard.stakes}
        label={t('dashboard.axis.stakes.label')}
        formatUsed={formatStakesUsed}
        formatRemaining={formatStakesRemaining}
      />

      <div className="flex flex-col gap-2">
        <span className="type-body-emphasis text-ink">{t('dashboard.week.title')}</span>
        <div className="flex justify-between gap-1">
          {dashboard.days.map((day) => {
            const Icon = DAY_STATE_ICON[day.state]
            return (
              <div
                key={day.date}
                className="flex flex-1 flex-col items-center gap-1"
                title={t(DAY_STATE_LABEL_KEY[day.state])}
              >
                <Icon
                  className={cn(
                    'size-5',
                    day.state === 'missing'
                      ? 'text-status-exceeded'
                      : day.state === 'future'
                        ? 'text-line-strong'
                        : 'text-status-ok',
                  )}
                  aria-hidden
                />
                <span className="type-body-sm text-faint">{day.studyDay}</span>
              </div>
            )
          })}
        </div>
      </div>

      {missingCount > 0 && (
        <Card tone="info">
          <p className="type-body-sm text-ink">
            {t(MISSING_COUNT_KEYS[pluralCategory(locale, missingCount)], { count: missingCount })}
          </p>
        </Card>
      )}
    </Screen>
  )
}
