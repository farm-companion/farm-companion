// Flat config. ESLint 9 dropped .eslintrc, and this package had the v9 packages
// installed but no config file, so `npm run lint` failed before linting anything.
import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      // Params kept for signature/API symmetry are prefixed with _.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
]
