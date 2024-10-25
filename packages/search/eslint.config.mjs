import typescriptEslint from '@typescript-eslint/eslint-plugin';
import eslintComments from 'eslint-plugin-eslint-comments';
import jest from 'eslint-plugin-jest';
import promise from 'eslint-plugin-promise';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends(
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:eslint-comments/recommended',
    'plugin:jest/recommended',
    'plugin:promise/recommended',
    'plugin:prettier/recommended'
  ),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'eslint-comments': eslintComments,
      jest,
      promise,
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.jest,
      },

      ecmaVersion: 5,
      sourceType: 'commonjs',

      parserOptions: {
        project: '/home/db/dev/applandinc/appmap-js/packages/search/tsconfig.json',
      },
    },

    rules: {
      'no-param-reassign': [
        'error',
        {
          props: false,
        },
      ],

      'no-console': 'off',
      'no-debugger': 'off',
      '@typescript-eslint/lines-between-class-members': 'off',
      'no-restricted-syntax': 'off',
      'import/no-cycle': 'off',
      'prettier/prettier': ['error'],
      'max-classes-per-file': 'off',
    },
  },
];
