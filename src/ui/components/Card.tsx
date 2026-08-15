import { type ReactNode } from 'react'

import { cn } from '@ui/lib/cn.ts'

type CardTone = 'default' | 'sunken' | 'brand' | 'warning' | 'info'

const TONE_CLASSES: Record<CardTone, string> = {
  default: 'bg-surface border border-line',
  sunken: 'bg-sunken',
  brand: 'bg-brand-subtle',
  warning: 'bg-warning-subtle',
  info: 'bg-info-subtle',
}

interface CardProps {
  children: ReactNode
  tone?: CardTone
  /** Padding utility for the card. Defaults to `p-4`. */
  padding?: string
  className?: string
}

/** Rounded surface container. `tone` selects the tint from the design system. */
export function Card({ children, tone = 'default', padding = 'p-4', className }: CardProps) {
  return <div className={cn('rounded-lg', padding, TONE_CLASSES[tone], className)}>{children}</div>
}
