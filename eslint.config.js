import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist', 'dev-dist', 'coverage', 'node_modules', 'playwright-report', 'test-results'],
  },

  // Application + test sources: type-aware linting.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      // `configs.recommended` is still the legacy eslintrc shape in v7.
      reactHooks.configs.flat['recommended-latest'],
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Layer boundaries: the intervention logic stays pure and storage-agnostic,
  // so it can be re-pointed at a server without rewriting it.
  {
    files: ['src/domain/**/*.ts'],
    ignores: ['src/domain/**/*.{test,spec}.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@data/*',
                '@ui/*',
                '../data/*',
                '../ui/*',
                'dexie',
                'react',
                'react-dom',
                'zustand',
              ],
              message:
                'src/domain is the intervention-logic layer: keep it free of UI and storage dependencies.',
            },
          ],
        },
      ],
    },
  },

  // Config files run in Node and are outside the app tsconfig.
  {
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },

  prettier,
)
