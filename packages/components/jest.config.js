module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.svg$': '<rootDir>/tests/unit/support/svgTransform.js',
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // d3's entry file is native module which jest doesn't support.
    // So we map it instead to bundled version.
    // https://github.com/jestjs/jest/issues/12036
    'd3-flame-graph': 'd3-flame-graph',
    '^d3-(.*)$': '<rootDir>/../../node_modules/d3-$1/dist/d3-$1.js',
    mermaid: '<rootDir>/tests/unit/support/mockMermaid.js',
    '\\.(gif|png|jpg|jpeg|webp)$': '<rootDir>/tests/unit/support/fileMock.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'vue', 'json'],
  transformIgnorePatterns: ['../../node_modules/(?!dom-to-svg)'],
  setupFilesAfterEnv: ['<rootDir>/tests/unit/support/polyfills.js', 'jest-extended/all'],
};
