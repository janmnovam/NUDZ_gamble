import type { Config } from 'jest'

/**
 * Jest owns `tests/jest/**` only.
 *
 * Vitest keeps `src/**` (it reuses the Vite transform and aliases), so the two
 * runners never see each other's files and their globals never collide — the
 * Jest tests compile against `tests/jest/tsconfig.json`, which is the only
 * tsconfig pulling in `@types/jest`.
 */
const config: Config = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests/jest'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest/setup.ts'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true, tsconfig: '<rootDir>/tests/jest/tsconfig.json' }],
  },
  // Path aliases must be restated here — Jest does not read Vite's resolver.
  moduleNameMapper: {
    '^@/(.*)\\.ts$': '<rootDir>/src/$1.ts',
    '^@ui/(.*)\\.tsx?$': '<rootDir>/src/ui/$1',
    '^@domain/(.*)\\.ts$': '<rootDir>/src/domain/$1.ts',
    '^@data/(.*)\\.ts$': '<rootDir>/src/data/$1.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@data/(.*)$': '<rootDir>/src/data/$1',
  },
  clearMocks: true,
}

export default config
