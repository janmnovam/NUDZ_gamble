import { Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { useAdminStore } from '@ui/admin/adminStore.ts'
import { Button } from '@ui/components/Button.tsx'
import { TextField } from '@ui/components/TextField.tsx'
import { useTranslation } from '@ui/i18n/context.ts'

/** Programme length in days — the reachable range of the time machine. */
const MAX_DAY = 28

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
  const closePanel = useAdminStore((s) => s.closePanel)
  const simulateDay = useAdminStore((s) => s.simulateDay)
  const wipeData = useAdminStore((s) => s.wipeData)
  const interventionStartDate = useAdminStore((s) => s.interventionStartDate)

  const [dayInput, setDayInput] = useState(() => String(Math.max(currentDay, 1)))

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
  // Without a known day 1 (e.g. onboarding not completed this device) we can't
  // map a day number to an instant, so the jump is disabled.
  const canConfirm = dayValid && interventionStartDate !== null

  const confirm = () => {
    if (canConfirm) simulateDay(parsedDay)
  }

  const wipe = () => {
    if (window.confirm(t('admin.timeMachine.wipeConfirm'))) {
      void wipeData()
    }
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

        <Button size="md" fullWidth onClick={confirm} disabled={!canConfirm}>
          {t('admin.timeMachine.confirm')}
        </Button>

        <button
          type="button"
          onClick={wipe}
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
