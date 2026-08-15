/** Czech is the source of truth — see CLAUDE.md. Every user-facing string lives here. */
export const cs = {
  'app.title': 'NUDZ Gamble',
  'app.subtitle':
    'Bootstrap běží: React, TypeScript, Vite, Tailwind, Dexie, ESLint, Prettier, Vitest.',
} as const

export type TranslationKey = keyof typeof cs
