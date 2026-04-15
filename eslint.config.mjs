// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // ── Ignored paths ─────────────────────────────────────────────────────────
  {
    ignores: [
      'eslint.config.mjs',
      'dist/**',
      'node_modules/**',
      'coverage/**',
    ],
  },

  // ── Base rule sets ─────────────────────────────────────────────────────────
  eslint.configs.recommended,

  // strictTypeChecked = recommendedTypeChecked + extra type-aware rules
  // stylisticTypeChecked = consistent style rules backed by type info
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // ── Prettier (must be last to override formatting rules) ──────────────────
  eslintPluginPrettierRecommended,

  // ── Parser / language options ─────────────────────────────────────────────
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ── Strict type-safety rules ───────────────────────────────────────────────
  {
    rules: {
      // ── 🚫 any — zero tolerance ───────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // ── Return types — every public boundary must be explicit ─────────────
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,              // arrow fn in variable assignments
          allowTypedFunctionExpressions: true, // typed callbacks
          allowHigherOrderFunctions: true,     // factory functions
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      // ── Null / undefined safety ───────────────────────────────────────────
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        { ignoreTernaryTests: false, ignoreConditionalTests: false },
      ],
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',

      // ── Promises ──────────────────────────────────────────────────────────
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/promise-function-async': 'error',

      // ── Type assertions & imports ─────────────────────────────────────────
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'never', // no `{} as Foo` escape hatch
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',

      // ── Exhaustiveness ────────────────────────────────────────────────────
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // ── Variables ────────────────────────────────────────────────────────
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // ── NestJS-aware overrides ────────────────────────────────────────────
      // Modules / controllers / providers are empty classes with decorators
      '@typescript-eslint/no-extraneous-class': [
        'error',
        { allowWithDecorator: true },
      ],
      // Decorators legitimately use parameter properties
      '@typescript-eslint/parameter-properties': [
        'error',
        { prefer: 'parameter-property' },
      ],

      // ── Style ─────────────────────────────────────────────────────────────
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
);
