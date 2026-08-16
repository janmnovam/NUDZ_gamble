import { useId } from 'react'

import { cn } from '@ui/lib/cn.ts'

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  required?: boolean
  hint?: string
  error?: string
}

/** A labelled single-line text input (Figma "Input"). */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  required,
  hint,
  error,
}: TextFieldProps) {
  const inputId = useId()
  const hintId = useId()
  const errorId = useId()
  const describedBy = [
    hint === undefined ? undefined : hintId,
    error === undefined ? undefined : errorId,
  ]
    .filter((id) => id !== undefined)
    .join(' ')

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={inputId} className="type-label text-ink">
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={describedBy || undefined}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        className={cn(
          'bg-surface text-ink placeholder:text-faint focus-visible:ring-brand w-full rounded-xs border px-4 py-3 text-base leading-6 focus-visible:ring-2 focus-visible:outline-none',
          error === undefined ? 'border-line' : 'border-danger',
        )}
      />
      {hint === undefined ? null : (
        <p id={hintId} className="type-body-sm text-faint">
          {hint}
        </p>
      )}
      {error === undefined ? null : (
        <p id={errorId} className="type-body-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
