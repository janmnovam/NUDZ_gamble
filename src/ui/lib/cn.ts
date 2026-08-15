/** Join class names, dropping falsy values. Keeps conditional Tailwind readable. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
