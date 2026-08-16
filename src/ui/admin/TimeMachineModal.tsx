import { Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { useAdminStore } from '@ui/admin/adminStore.ts'
import { useAdminService } from '@ui/app/AppContext.ts'
import { useCurrentUser } from '@ui/app/currentUser.ts'
import { Button } from '@ui/components/Button.tsx'
import { TextField } from '@ui/components/TextField.tsx'
import { useTranslation } from '@ui/i18n/context.ts'
import * as gateway from '@ui/notifications/notificationGateway.ts'

/** Programme length in days — the reachable range of the time machine. */
const MAX_DAY = 28

/**
 * Preselected time-of-day, matching `config.ts`'s `REMINDER_TIMES` — jumping
 * to a day with this default already lands on the configured reminder slot,
 * so confirming without touching the time field is enough to test a popup.
 */
const DEFAULT_TIME = '15:30'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

interface TimeMachineModalProps {
  /** The study day currently on screen; used to prefill the input. */
  currentDay: number
}

/**
 * Hidden demo console (Figma "Stroj času"): jump to any intervention day to
 * simulate the passage of time, or wipe all local data to start over. Opened by
 * the secret tap gesture on the dashboard; rendered in a portal so its scrim
 * covers the whole viewport regardless of the dashboard's layout.
 */
export function TimeMachineModal({ currentDay }: TimeMachineModalProps) {
  const { t } = useTranslation()
  const admin = useAdminService()
  const userId = useCurrentUser((s) => s.userId)
  const clearCurrentUser = useCurrentUser((s) => s.clear)
  const closePanel = useAdminStore((s) => s.closePanel)
  const simulateDay = useAdminStore((s) => s.simulateDay)
  const forgetInterventionStart = useAdminStore((s) => s.forgetInterventionStart)
  const interventionStartDate = useAdminStore((s) => s.interventionStartDate)

  const [dayInput, setDayInput] = useState(() => String(Math.max(currentDay, 1)))
  const [timeInput, setTimeInput] = useState(DEFAULT_TIME)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [closePanel])

  const parsedDay = Number.parseInt(dayInput, 10)
  const dayValid = Number.isInteger(parsedDay) && parsedDay >= 1 && parsedDay <= MAX_DAY
  const timeValid = TIME_PATTERN.test(timeInput)
  // Without a known day 1 (e.g. onboarding not completed this device) we can't
  // map a day number to an instant, so the jump is disabled.
  const canConfirm = dayValid && timeValid && interventionStartDate !== null

  const confirm = () => {
    if (!canConfirm) return
    // Forget any earlier "last fired" bookkeeping so jumping to a reminder
    // slot (e.g. the default 15:30) always re-arms the popup for testing,
    // instead of staying quiet because some unrelated earlier instant already
    // fired it "today".
    gateway.clearLastFiredAt()
    simulateDay(parsedDay, timeInput)
  }

  // Wipe through the AdminService inbound port (drops the current user's data,
  // keeping the seeded contacts directory), then forget the local session state
  // and reload into a fresh onboarding.
  const wipe = async () => {
    if (userId === null) {
      console.error('[admin] no current user to wipe')
      return
    }
    if (!window.confirm(t('admin.timeMachine.wipeConfirm'))) return
    const result = await admin.dropUserData(userId)
    if (result.error) {
      console.error('[admin] dropUserData failed', result.error)
      return
    }
    forgetInterventionStart()
    clearCurrentUser()
    window.location.reload()
  }

  return createPortal(
    <div
      className="bg-ink/40 fixed inset-0 z-50 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t('admin.timeMachine.title')}
      onClick={closePanel}
    >
      <div
        className="bg-surface flex w-full max-w-sm flex-col gap-4 rounded-md p-5 shadow-xl"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="type-h2 text-ink">{t('admin.timeMachine.title')}</h2>
          <button
            type="button"
            onClick={closePanel}
            aria-label={t('admin.timeMachine.close')}
            className="text-muted hover:text-ink focus-visible:ring-brand -m-1 rounded-full p-1 focus-visible:ring-2 focus-visible:outline-none"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <TextField
          label={t('admin.timeMachine.dayLabel')}
          value={dayInput}
          onChange={setDayInput}
          placeholder="1"
        />

        <TextField
          label={t('admin.timeMachine.timeLabel')}
          value={timeInput}
          onChange={setTimeInput}
          placeholder={DEFAULT_TIME}
        />

        <Button size="md" fullWidth onClick={confirm} disabled={!canConfirm}>
          {t('admin.timeMachine.confirm')}
        </Button>

        <button
          type="button"
          onClick={() => {
            void wipe()
          }}
          className="text-danger focus-visible:ring-danger inline-flex items-center justify-center gap-1.5 self-center rounded-sm px-2 py-1 text-sm font-medium hover:brightness-90 focus-visible:ring-2 focus-visible:outline-none"
        >
          <Trash2 className="size-4" aria-hidden />
          {t('admin.timeMachine.wipe')}
        </button>
      </div>
    </div>,
    document.body,
  )
}
