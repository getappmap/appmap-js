module.exports = {
  setupFilesAfterEnv: ['jest-extended'],
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  transformIgnorePatterns: ['../../node_modules/(?!dom-to-svg)'],
  transform: {
    '^.+\\.svg$': '<rootDir>/tests/unit/support/svgTransform.js',
  },
  // d3's entry file is native module which jest doesn't support.
  // So we map it instead to bundled version.
  // https://github.com/jestjs/jest/issues/12036
  moduleNameMapper: {
    'd3-flame-graph': 'd3-flame-graph',
    '^d3-(.*)$': 'd3-$1/dist/d3-$1',
  },
};
