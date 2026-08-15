import { type ButtonHTMLAttributes, type ReactNode } from 'react'

import { cn } from '@ui/lib/cn.ts'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

// Pill button (Figma "Button"): brand pine / warm tonal / text-only / terracotta.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-on-brand hover:brightness-[0.96] active:brightness-90',
  secondary: 'bg-sunken text-ink hover:brightness-[0.98] active:brightness-95',
  ghost: 'text-brand-ink hover:bg-brand-subtle active:brightness-95',
  danger: 'bg-danger text-on-brand hover:brightness-95 active:brightness-90',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: 'h-11 px-6',
  lg: 'h-12 px-6',
}

export function Button({
  children,
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'type-label-lg inline-flex items-center justify-center gap-2 rounded-full transition select-none',
        'focus-visible:ring-brand focus-visible:ring-offset-canvas focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
