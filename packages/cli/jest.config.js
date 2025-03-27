/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: parseInt(process.env.TEST_TIMEOUT, 10) || 5000,
  silent: process.env.TEST_SILENT !== 'false',
  restoreMocks: true,
  // There are test cases that change the process working directory, and that does
  // not work with multiple workers.
  maxWorkers: 1,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
