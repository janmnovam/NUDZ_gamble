import { useEffect, useRef } from 'react'

import { Button } from '@ui/components/Button.tsx'
import { Screen } from '@ui/components/Screen.tsx'

interface RestrictionOption {
  id: string
  title: string
  description: string
  linkLabel: string
  href: string
}

export interface CatalogStrategyDetail {
  id: string
  title: string
  whatToDo: string
  whyItCanHelp: string
  howTo: string
  whenUseful: string
  note: string
  restrictionOptions?: {
    intro: string
    items: readonly RestrictionOption[]
  }
}

interface CatalogStrategyDetailScreenProps {
  detail: CatalogStrategyDetail
  onBack: () => void
}

interface DetailSectionProps {
  label: string
  children: string
}

function DetailSection({ label, children }: DetailSectionProps) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="type-overline text-faint">{label}</h2>
      <p className="type-body text-ink">{children}</p>
    </section>
  )
}

export function CatalogStrategyDetailScreen({ detail, onBack }: CatalogStrategyDetailScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <Screen contentClassName="gap-4 pb-6">
      <header className="flex flex-col gap-1.5">
        <button
          type="button"
          aria-label="Zpět do knihovny"
          className="type-label text-brand-ink -my-3 min-h-11 self-start py-3 text-left"
          onClick={onBack}
        >
          ← Zpět do knihovny
        </button>
        <h1 ref={headingRef} tabIndex={-1} className="type-display focus:outline-none">
          {detail.title}
        </h1>
      </header>

      <DetailSection label="CO UDĚLAT">{detail.whatToDo}</DetailSection>
      <DetailSection label="PROČ TO MŮŽE POMOCI">{detail.whyItCanHelp}</DetailSection>
      <DetailSection label="JAK NA TO">{detail.howTo}</DetailSection>
      <DetailSection label="KDY SE MŮŽE HODIT">{detail.whenUseful}</DetailSection>
      <DetailSection label="POZNÁMKA">{detail.note}</DetailSection>

      {detail.restrictionOptions !== undefined ? (
        <section className="bg-sunken flex flex-col gap-2.5 rounded-md p-4">
          <h2 className="type-overline text-faint">MOŽNOSTI OMEZENÍ HRANÍ</h2>
          <p className="type-body-sm text-muted">{detail.restrictionOptions.intro}</p>

          {detail.restrictionOptions.items.map((option) => (
            <article key={option.id} className="flex flex-col gap-1 pt-1.5">
              <h3 className="type-body-emphasis text-ink">{option.title}</h3>
              <p className="type-body-sm text-muted">{option.description}</p>
              <a
                href={option.href}
                target="_blank"
                rel="noreferrer"
                className="type-label text-brand-ink min-h-11 self-start py-3"
              >
                {option.linkLabel}
              </a>
            </article>
          ))}
        </section>
      ) : null}

      <div className="pt-2">
        <Button fullWidth onClick={onBack}>
          Zpět do knihovny
        </Button>
      </div>
    </Screen>
  )
}
