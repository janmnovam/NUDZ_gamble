import { digitsToNumber, groupThousands } from '@ui/lib/money.ts'

interface MoneyFieldProps {
  /** Whole-currency amount. */
  value: number
  onChange: (value: number) => void
  ariaLabel: string
  /** Currency mark shown after the amount, e.g. `Kč`. */
  currencySuffix: string
  maxValue?: number
}

const DEFAULT_MAX = 100_000_000

/**
 * A whole-number money field. The big, formatted value is a display; a hidden
 * numeric input sits on top so tapping it opens the native number keypad
 * (`inputMode="numeric"` — digits only, no decimals).
 */
export function MoneyField({
  value,
  onChange,
  ariaLabel,
  currencySuffix,
  maxValue = DEFAULT_MAX,
}: MoneyFieldProps) {
  return (
    <label className="focus-within:ring-brand relative block cursor-text rounded-md py-1 focus-within:ring-2">
      <span aria-hidden className="type-display text-ink block text-center whitespace-nowrap">
        {`${groupThousands(value)}\u00A0${currencySuffix}`}
      </span>
      <input
        type="text"
        inputMode="numeric"
        aria-label={ariaLabel}
        value={value === 0 ? '' : String(value)}
        onChange={(event) => {
          onChange(Math.min(digitsToNumber(event.target.value), maxValue))
        }}
        className="absolute inset-0 h-full w-full opacity-0 outline-none"
      />
    </label>
  )
}
