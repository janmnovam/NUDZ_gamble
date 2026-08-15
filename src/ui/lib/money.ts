/** Group a whole number with non-breaking spaces every three digits (Czech style). */
export function groupThousands(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/** Extract a whole number from free-form input, keeping digits only. */
export function digitsToNumber(input: string): number {
  const digits = input.replace(/\D/g, '')
  return digits === '' ? 0 : Number(digits)
}
