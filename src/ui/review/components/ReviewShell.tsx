import { type ReactNode } from 'react'

import { Button } from '@ui/components/Button.tsx'
import { TabBar } from '@ui/components/TabBar.tsx'

interface ReviewShellProps {
  children: ReactNode
  footerLabel: string
  onExport: () => void
}

export function ReviewShell({ children, footerLabel, onExport }: ReviewShellProps) {
  return (
    <div className="pt-safe bg-canvas mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto px-4 pt-2 pb-4">{children}</div>
      {/* Same split as <Screen>: the CTA carries its own spacing and the tab
          bar sits flush on the bottom edge, owning only the safe-area inset.
          Padding the whole block instead lifts the bar off the edge. */}
      <div className="px-4 pt-1 pb-5">
        <Button size="md" fullWidth onClick={onExport}>
          {footerLabel}
        </Button>
      </div>
      <div className="pb-safe-inset">
        <TabBar />
      </div>
    </div>
  )
}
