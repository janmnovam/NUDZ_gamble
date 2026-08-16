import { useState } from 'react'

import { type FinalSummaryViewModel, type FinalSummaryWeek } from '@ui/review/types.ts'
import { FinalSummaryScreen } from '@ui/review/FinalSummaryScreen.tsx'
import { ProgrammeSummaryScreen } from '@ui/review/ProgrammeSummaryScreen.tsx'
import { type ProgrammeSummary } from '@ui/review/toProgrammeSummary.ts'
import { WeekSummaryScreen } from '@ui/review/WeekSummaryScreen.tsx'

interface FinalSummaryFlowProps {
  summary: FinalSummaryViewModel
  /**
   * Opens the running week. There is no read-only detail for it — the dashboard
   * already *is* the live view of the current week, and the week detail is
   * framed as a closed, read-only record.
   */
  onOpenCurrentWeek: () => void
  /** The same data laid out as a month grid, for the programme overview. */
  programme: ProgrammeSummary
  onExport: () => void
}

type View = { kind: 'list' } | { kind: 'week'; week: FinalSummaryWeek } | { kind: 'programme' }

export function FinalSummaryFlow({
  summary,
  programme,
  onOpenCurrentWeek,
  onExport,
}: FinalSummaryFlowProps) {
  const [view, setView] = useState<View>({ kind: 'list' })
  const back = () => {
    setView({ kind: 'list' })
  }

  if (view.kind === 'week') {
    return <WeekSummaryScreen week={view.week} onBack={back} onExport={onExport} />
  }

  if (view.kind === 'programme') {
    return <ProgrammeSummaryScreen summary={programme} onBack={back} onExport={onExport} />
  }

  return (
    <FinalSummaryScreen
      summary={summary}
      onOpenWeek={(week) => {
        if (week.state === 'running') onOpenCurrentWeek()
        else setView({ kind: 'week', week })
      }}
      onOpenProgramme={() => {
        setView({ kind: 'programme' })
      }}
      onExport={onExport}
    />
  )
}
