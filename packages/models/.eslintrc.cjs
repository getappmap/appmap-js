module.exports = {
  env: {
    es2021: true,
    'shared-node-browser': true
  },
  extends: [
    '../../eslintrc.js',
    'plugin:import/recommended',
    'plugin:import/typescript'
  ],
  ignorePatterns: ['**/*.cjs'],
  rules: {
    'no-param-reassign': ['error', { props: false }],
    'no-underscore-dangle': ['error', { allowAfterThis: true }],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
  overrides: [
    {
      files: ['**/__tests__/*.{j,t}s?(x)', '**/tests/unit/**/*.spec.{j,t}s?(x)'],
      env: {
        jest: true,
      },
    },
    {
      files: ['**/*.js'],
      rules: {
        // TODO: fix these and remove this override
        '@typescript-eslint/adjacent-overload-signatures': 'warn',
        '@typescript-eslint/ban-ts-comment': 'warn',
        '@typescript-eslint/explicit-module-boundary-types': 'warn',
        '@typescript-eslint/no-empty-function': 'warn',
        '@typescript-eslint/no-this-alias': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',
        '@typescript-eslint/restrict-plus-operands': 'warn',
        '@typescript-eslint/restrict-template-expressions': 'warn',
      }
    },
  ],
};
