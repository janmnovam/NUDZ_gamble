interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/** A labelled single-line text input (Figma "Input"). */
export function TextField({ label, value, onChange, placeholder }: TextFieldProps) {
  return (
    <label className="flex w-full flex-col gap-1.5">
      <span className="type-label text-ink">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        className="bg-surface border-line text-ink placeholder:text-faint focus-visible:ring-brand w-full rounded-xs border px-4 py-3 text-base leading-6 focus-visible:ring-2 focus-visible:outline-none"
      />
    </label>
  )
}
