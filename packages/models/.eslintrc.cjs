module.exports = {
  env: {
    es2021: true,
    'shared-node-browser': true,
  },
  extends: ['../../eslintrc.js', 'plugin:import/recommended'],
  ignorePatterns: ['**/*.cjs'],
  rules: {
    'no-undef': ['warn'],
    'no-param-reassign': ['warn', { props: false }],
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
    // typescript
    {
      files: ['*.ts'],
      excludedFiles: ['*.test.js'],
      plugins: ['@typescript-eslint'],
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/member-delimiter-style': 0,
        '@typescript-eslint/interface-name-prefix': 0,
        '@typescript-eslint/no-use-before-define': 0,
        'react/prop-types': 0,
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
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',
        '@typescript-eslint/restrict-plus-operands': 'warn',
        '@typescript-eslint/restrict-template-expressions': 'warn',
      },
    },
  ],
};
