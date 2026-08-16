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

const ACTION_FOCUS_CLASSES =
  'focus-visible:ring-brand focus-visible:ring-offset-canvas focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
const PHONE_ACTION_CLASSES = `type-label-lg bg-status-exceeded-subtle text-status-exceeded flex h-12 flex-1 items-center justify-center rounded-full px-6 text-center transition hover:brightness-[0.98] active:brightness-95 ${ACTION_FOCUS_CLASSES}`
const WEB_ACTION_CLASSES = `type-label-lg text-brand-ink hover:bg-brand-subtle inline-flex min-h-12 items-center justify-center rounded-sm px-3 py-3 text-center transition active:brightness-95 ${ACTION_FOCUS_CLASSES}`

export function ContactCard({ contact }: ContactCardProps) {
  return (
    <article className="bg-surface border-sunken flex flex-col gap-1.5 rounded-md border p-4">
      <h2 className="type-title-card">{contact.title}</h2>
      <p className="type-body-sm text-muted">{contact.purpose}</p>
      {contact.meta === undefined ? null : (
        <p className="text-faint text-xs leading-4">{contact.meta}</p>
      )}

      <div className="mt-1 flex items-center gap-3">
        {contact.phone === undefined ? null : (
          <a
            href={`tel:${contact.phone}`}
            aria-label={`Zavolat na ${contact.title}`}
            className={PHONE_ACTION_CLASSES}
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
            className={WEB_ACTION_CLASSES}
          >
            Otevřít web
          </a>
        )}
      </div>
    </article>
  )
}
