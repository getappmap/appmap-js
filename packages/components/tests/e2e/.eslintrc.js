export default {
  plugins: ['cypress'],
  env: {
    mocha: true,
    'cypress/globals': true,
  },
  rules: {
    strict: 'off',
  },
};
