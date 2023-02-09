module.exports = {
  setupFilesAfterEnv: ['jest-extended'],
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  transformIgnorePatterns: ['../../node_modules/(?!dom-to-svg)'],
  transform: {
    '^.+\\.svg$': '<rootDir>/tests/unit/support/svgTransform.js',
  },
};
