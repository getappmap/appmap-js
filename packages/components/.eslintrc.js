module.exports = {
  root: true,
  env: {
    es2020: true,
    browser: true,
  },
  extends: ['plugin:vue/essential', '@vue/eslint-config-typescript', 'prettier'],
  plugins: ['prettier'],
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  rules: {
    'no-param-reassign': ['error', { props: false }],
    'no-underscore-dangle': ['error', { allowAfterThis: true }],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'prettier/prettier': ['error'],
  },
  overrides: [
    {
      files: ['**/__tests__/*.{j,t}s?(x)', '**/tests/unit/**/*.spec.{j,t}s?(x)'],
      env: {
        jest: true,
      },
    },
  ],
};
