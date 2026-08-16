import { useState } from 'react'

import type { FinalSummaryViewModel, FinalSummaryWeek } from '@ui/review/types.ts'
import { FinalSummaryScreen } from '@ui/review/FinalSummaryScreen.tsx'
import { ProgrammeSummaryScreen } from '@ui/review/ProgrammeSummaryScreen.tsx'
import type { ProgrammeSummary } from '@ui/review/toProgrammeSummary.ts'
import { WeekSummaryScreen } from '@ui/review/WeekSummaryScreen.tsx'

interface FinalSummaryFlowProps {
  summary: FinalSummaryViewModel
  /** The same data laid out as a month grid, for the programme overview. */
  programme: ProgrammeSummary
  onExport: () => void
}

type View = { kind: 'list' } | { kind: 'week'; week: FinalSummaryWeek } | { kind: 'programme' }

export function FinalSummaryFlow({ summary, programme, onExport }: FinalSummaryFlowProps) {
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
        setView({ kind: 'week', week })
      }}
      onOpenProgramme={() => {
        setView({ kind: 'programme' })
      }}
      onExport={onExport}
    />
  )
}
