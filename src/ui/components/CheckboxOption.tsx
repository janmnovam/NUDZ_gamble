import { Check } from 'lucide-react'

import { cn } from '@ui/lib/cn.ts'

interface CheckboxOptionProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** A full-width, tappable checkbox row (Figma "Option"). Tinted when checked. */
export function CheckboxOption({ label, checked, onChange }: CheckboxOptionProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => {
        onChange(!checked)
      }}
      className={cn(
        'focus-visible:ring-brand flex w-full items-center gap-3 rounded-md p-3 text-left transition focus-visible:ring-2 focus-visible:outline-none',
        checked ? 'bg-brand-subtle' : 'bg-surface border-line border',
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
      <span className="text-ink flex-1 text-[14px] leading-5">{label}</span>
    </button>
  )
}
