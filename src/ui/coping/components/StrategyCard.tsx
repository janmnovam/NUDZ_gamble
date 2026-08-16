import { MoreVertical } from 'lucide-react'

interface CommonStrategyCardProps {
  title: string
  onOpen: () => void
  onMore: (trigger: HTMLButtonElement) => void
}

type StrategyCardProps = CommonStrategyCardProps &
  ({ kind: 'catalog'; sub: string } | { kind: 'custom'; sub?: string })

export function StrategyCard({ kind, title, sub, onOpen, onMore }: StrategyCardProps) {
  return (
    <article className="bg-surface border-line flex overflow-hidden rounded-md border">
      <button
        type="button"
        className="flex min-w-0 flex-1 flex-col items-start gap-1 py-3.5 pl-4 text-left"
        aria-label={`Otevřít detail strategie „${title}“`}
        onClick={onOpen}
      >
        <span className="flex items-center gap-1.5">
          <span className="type-title-card">{title}</span>
          {kind === 'custom' ? (
            <span className="bg-sunken text-muted rounded-full px-2 py-0.5 text-xs">Vlastní</span>
          ) : null}
        </span>
        {sub ? <span className="type-body-sm text-muted">{sub}</span> : null}
      </button>

      <button
        type="button"
        className="text-muted flex size-11 shrink-0 items-center justify-center self-center rounded-full"
        aria-label={`Další možnosti pro strategii „${title}“`}
        onClick={(event) => {
          onMore(event.currentTarget)
        }}
      >
        <MoreVertical aria-hidden="true" size={24} />
      </button>
    </article>
  )
}
