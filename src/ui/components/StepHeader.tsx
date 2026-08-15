import { ArrowLeft } from 'lucide-react'

import { StepProgress } from '@ui/components/StepProgress.tsx'
import { useTranslation } from '@ui/i18n/context.ts'

interface StepHeaderProps {
  current: number
  total: number
  onBack: () => void
}

/** Top bar for a multi-step flow: back arrow + segmented progress. */
export function StepHeader({ current, total, onBack }: StepHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <button
        type="button"
        onClick={onBack}
        aria-label={t('common.back')}
        className="text-ink hover:bg-sunken focus-visible:ring-brand -m-1 rounded-full p-1 transition focus-visible:ring-2 focus-visible:outline-none"
      >
        <ArrowLeft className="size-6" aria-hidden />
      </button>
      <StepProgress current={current} total={total} />
    </div>
  )
}
