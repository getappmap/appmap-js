/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

module.exports = {
  plugins: ['@typescript-eslint', 'eslint-comments', 'jest', 'promise', 'unicorn'],
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:eslint-comments/recommended',
    'plugin:jest/recommended',
    'plugin:promise/recommended',
    'plugin:unicorn/recommended',
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
    'unicorn/filename-case': ['error', { case: 'camelCase' }],
    'no-param-reassign': ['error', { props: false }],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'unicorn/no-array-for-each': 'off',
    'unicorn/prevent-abbreviations': 'warn',
    'unicorn/prefer-node-protocol': 'off',
    '@typescript-eslint/lines-between-class-members': 'off',
    'no-restricted-syntax': 'off',
    'import/no-cycle': 'off',
    'prettier/prettier': ['error'],
  },
  overrides: [
    {
      files: ['*.js'],
      extends: ['eslint:recommended', 'airbnb-base', 'prettier'],
      parserOptions: {
        project: path.join(__dirname, 'jsconfig.json'),
      },
      plugins: ['prettier'],
      rules: {
        'unicorn/prefer-module': 'off',
      },
    },
  ],
};
