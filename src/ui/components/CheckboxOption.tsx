import { Check } from 'lucide-react'

import { cn } from '@ui/lib/cn.ts'

interface CheckboxOptionProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** A full-width, tappable checkbox row (Figma "Option"). Tinted when checked. */
export function CheckboxOption({ label, description, checked, onChange }: CheckboxOptionProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => {
        onChange(!checked)
      }}
      className={cn(
        'focus-visible:ring-brand flex w-full items-start gap-3 rounded-md border px-4 py-3.5 text-left transition focus-visible:ring-2 focus-visible:outline-none',
        checked ? 'bg-brand-subtle border-brand' : 'bg-surface border-sunken',
      )}
    >
      <span
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-sm border-[1.5px]',
          checked ? 'bg-brand border-brand text-on-brand' : 'bg-surface border-line-strong',
        )}
      >
        {checked ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : null}
      </span>
      <span className="flex flex-1 flex-col gap-[3px]">
        <span className="type-title-card text-ink">{label}</span>
        {description === undefined ? null : (
          <span className="text-muted text-sm leading-[1.125rem]">{description}</span>
        )}
      </span>
    </button>
  )
}
