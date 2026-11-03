import js from '@eslint/js';
import globals from 'globals';

// Correctness rules only (no-undef, unreachable code, etc). Deliberately silent catches and
// minified-style legacy code are tolerated; this is a typo/undefined-symbol gate, not a style gate.
const rules = {
  'no-empty': ['error', { allowEmptyCatch: true }],
  'no-unused-vars': ['error', { caughtErrors: 'none', args: 'none' }],
  'no-useless-escape': 'off',
};

export default [
  { ignores: ['**/node_modules/**', '**/test-results/**', '**/playwright-report/**'] },
  {
    files: ['js/**/*.js'],
    ...js.configs.recommended,
    rules: { ...js.configs.recommended.rules, ...rules },
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.browser },
  },
  {
    files: ['worker/**/*.js'],
    ...js.configs.recommended,
    rules: { ...js.configs.recommended.rules, ...rules },
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.serviceworker, ...globals.node } },
  },
  {
    files: ['site-tests/*.js', 'site-tests/*.mjs'],
    ...js.configs.recommended,
    rules: { ...js.configs.recommended.rules, ...rules },
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node, ...globals.browser } },
  },
];
