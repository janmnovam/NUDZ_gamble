import type { TranslationKey } from './cs.ts'

/**
 * English mirrors cs.ts key-for-key. `Record<TranslationKey, string>` makes a
 * missing or extra key a type error, so the mirror can't silently drift.
 */
export const en: Record<TranslationKey, string> = {
  'app.title': 'NUDZ Gamble',
  'app.subtitle':
    'Bootstrap running: React, TypeScript, Vite, Tailwind, Dexie, ESLint, Prettier, Vitest.',
}
