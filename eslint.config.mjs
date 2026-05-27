import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import obsidianmd from 'eslint-plugin-obsidianmd';

export default [
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'main.js',
      'test/test.test.js',
      '.analysis-repos/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...obsidianmd.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        // Browser
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        createFragment: 'readonly',
        // Node
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        // Jest
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-prototype-builtins': 'off',
      'no-useless-escape': 'off',
      indent: ['error', 2, { SwitchCase: 1 }],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],

      // The no-unsafe-* family of type-aware rules fires on every JSON.parse,
      // RequestUrlResponse.json access, and similar boundary points where the
      // typing genuinely is `any` until we adopt runtime validation (e.g. zod).
      // The signal-to-noise is poor for this codebase: nearly every flagged
      // line is a known-trusted API boundary, not a real bug. Disabling at
      // the project level until we add response schema validation.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',

      // Sentence-case warning is an Obsidian convention but applying it to
      // existing UI strings is a user-visible behaviour change with subtle
      // proper-noun handling. Deferring to a dedicated UI-text PR.
      'obsidianmd/ui/sentence-case': 'off',
    },
  },

  {
    // Test files relax a few rules so we can mock with `any`/`unknown` casts
    // and use `global` (a Node fixture pattern).
    files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.test.js'],
    languageOptions: {
      globals: {
        global: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'obsidianmd/no-global-this': 'off',
    },
  },
];
