module.exports = {
  setupFilesAfterEnv: ['jest-extended'],
  preset: '@vue/cli-plugin-unit-jest',
  transformIgnorePatterns: ['/node_modules/(?!d3-flame-graph)'],
  transform: {
    '^.+\\.svg$': '<rootDir>/tests/unit/support/svgTransform.js',
  },
};
