import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
  { ignores: ['built/', 'node_modules/', 'jest.config.js', 'test/fixtures'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
];
