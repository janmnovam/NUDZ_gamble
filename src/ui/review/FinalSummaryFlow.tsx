import { useState } from 'react'

import type { FinalSummaryViewModel, FinalSummaryWeek } from '@ui/review/types.ts'
import { FinalSummaryScreen } from '@ui/review/FinalSummaryScreen.tsx'
import { WeekSummaryScreen } from '@ui/review/WeekSummaryScreen.tsx'

interface FinalSummaryFlowProps {
  summary: FinalSummaryViewModel
  onExport: () => void
}

export function FinalSummaryFlow({ summary, onExport }: FinalSummaryFlowProps) {
  const [selectedWeek, setSelectedWeek] = useState<FinalSummaryWeek | null>(null)

  if (selectedWeek) {
    return (
      <WeekSummaryScreen
        week={selectedWeek}
        onBack={() => {
          setSelectedWeek(null)
        }}
        onExport={onExport}
      />
    )
  }

  return <FinalSummaryScreen summary={summary} onOpenWeek={setSelectedWeek} onExport={onExport} />
}
