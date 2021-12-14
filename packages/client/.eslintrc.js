const path = require('path');

module.exports = {
  plugins: [
    '@typescript-eslint',
    'eslint-comments',
    'jest',
    'promise',
    'unicorn',
  ],
  extends: [
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
    'unicorn/no-array-for-each': 'off',
    'unicorn/prevent-abbreviations': 'warn',
    '@typescript-eslint/lines-between-class-members': 'off',
  },
  overrides: [
    {
      files: ['**/*.js'],
      extends: ['eslint:recommended', 'airbnb-base', 'prettier'],
      parser: 'babel-eslint',
      parserOptions: {
        parser: 'babel-eslint',
        ecmaVersion: 11,
      },
      plugins: ['prettier'],
      rules: {
        'no-param-reassign': ['error', { props: false }],
        'no-underscore-dangle': ['error', { allowAfterThis: true }],
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'prettier/prettier': ['error'],
      },
    },
  ],
};
