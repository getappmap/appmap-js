module.exports = {
  setupFilesAfterEnv: ['jest-extended'],
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  transformIgnorePatterns: ['../../node_modules/(?!dom-to-svg)'],
  // d3's entry file is native module which jest doesn't support.
  // So we map it instead to bundled version.
  // https://github.com/jestjs/jest/issues/12036
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/tests/unit/support/svgMock.js',
    'd3-flame-graph': 'd3-flame-graph',
    '^d3-(.*)$': 'd3-$1/dist/d3-$1',
    mermaid: '<rootDir>/tests/unit/support/mockMermaid.js',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/unit/support/polyfills.js', 'jest-extended/all'],
};
