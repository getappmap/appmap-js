const FIXME = [
  '@typescript-eslint/no-unsafe-member-access',
  '@typescript-eslint/no-unsafe-call',
  '@typescript-eslint/no-unsafe-assignment',
  '@typescript-eslint/no-unsafe-return',
  '@typescript-eslint/no-unsafe-argument',
  '@typescript-eslint/no-explicit-any',
  '@typescript-eslint/no-unused-vars',
  '@typescript-eslint/require-await',
  '@typescript-eslint/no-var-requires',
  '@typescript-eslint/prefer-nullish-coalescing',
  '@typescript-eslint/no-misused-promises',
  '@typescript-eslint/restrict-template-expressions',
  '@typescript-eslint/no-floating-promises',
  '@typescript-eslint/no-empty-function',
  '@typescript-eslint/class-literal-property-style',
  'no-param-reassign',
  'prefer-const',
  '@typescript-eslint/dot-notation',
];

module.exports = {
  root: true,
  ignorePatterns: [
    'src/telemetry.ts', // symlink to a separate "package"
  ],
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'prettier',
  ],
  parserOptions: {
    project: 'tsconfig.lint.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    'no-param-reassign': ['error', { props: false }],
    'no-underscore-dangle': ['error', { allowAfterThis: true }],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    '@typescript-eslint/no-redundant-type-constituents': 'off', // we use these for doc purposes
    '@typescript-eslint/consistent-type-definitions': 'off',

    ...Object.fromEntries(FIXME.map((rule) => [rule, 'warn'])),
  },
  overrides: [
    {
      files: ['**/__tests__/*.{j,t}s?(x)', '**/tests/**/*.spec.{j,t}s?(x)'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/unbound-method': 'off', // this is commonly used when setting up mocks
      },
    },
  ],
};
