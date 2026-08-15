import type { Config } from 'jest'

/**
 * All unit tests live in `tests/jest/**`, mirroring the `src/` structure.
 *
 * They compile against `tests/jest/tsconfig.json` — the only tsconfig pulling
 * in `@types/jest` — so the app tsconfig stays free of test globals.
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
  coverageProvider: 'v8',
  collectCoverageFrom: ['src/domain/**/*.ts', 'src/data/**/*.ts'],
}

export default config
