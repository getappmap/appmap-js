/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

module.exports = {
  plugins: ['@typescript-eslint', 'eslint-comments', 'jest', 'promise', 'unicorn'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:eslint-comments/recommended',
    'plugin:jest/recommended',
    'plugin:promise/recommended',
    'prettier',
  ],
  env: {
    node: true,
    browser: true,
    jest: true,
  },
  parserOptions: {
    project: path.join(__dirname, 'tsconfig.json'),
  },
  root: true,
  rules: {
    'eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],
    'no-param-reassign': ['error', { props: false }],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    '@typescript-eslint/lines-between-class-members': 'off',
    'no-restricted-syntax': 'off',
    'import/no-cycle': 'off',
    'max-classes-per-file': 'off',
  },
  overrides: [
    {
      files: ['*.js'],
      extends: ['eslint:recommended', 'prettier'],
      parserOptions: {
        project: path.join(__dirname, 'jsconfig.json'),
      },
      rules: {
        'unicorn/prefer-module': 'off',
      },
    },
  ],
};
