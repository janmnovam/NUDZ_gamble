import { cn } from '@ui/lib/cn.ts'

export interface StrategyContactItem {
  id: string
  title: string
  purpose: string
  meta?: string
  phone?: string
  url?: string
}

interface ContactCardProps {
  contact: StrategyContactItem
}

const ACTION_BASE_CLASSES =
  'type-label-lg focus-visible:ring-brand focus-visible:ring-offset-canvas flex h-12 flex-1 items-center justify-center rounded-full px-6 text-center transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'

export function ContactCard({ contact }: ContactCardProps) {
  const hasTwoActions = contact.phone !== undefined && contact.url !== undefined

  return (
    <article className="bg-surface border-sunken flex flex-col gap-1.5 rounded-md border p-4">
      <h2 className="type-title-card">{contact.title}</h2>
      <p className="type-body-sm text-muted">{contact.purpose}</p>
      {contact.meta === undefined ? null : (
        <p className="text-faint text-xs leading-4">{contact.meta}</p>
      )}

      <div className="mt-1 flex gap-2">
        {contact.phone === undefined ? null : (
          <a
            href={`tel:${contact.phone}`}
            aria-label={`Zavolat na ${contact.title}`}
            className={cn(ACTION_BASE_CLASSES, 'bg-sunken text-ink')}
          >
            Zavolat
          </a>
        )}

        {contact.url === undefined ? null : (
          <a
            href={contact.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Otevřít web služby ${contact.title}`}
            className={cn(
              ACTION_BASE_CLASSES,
              hasTwoActions ? 'text-brand-ink' : 'bg-sunken text-ink',
            )}
          >
            Otevřít web
          </a>
        )}
      </div>
    </article>
  )
}
