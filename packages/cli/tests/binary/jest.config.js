/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: parseInt(process.env.TEST_TIMEOUT, 10) || 30000,
  silent: true,
  restoreMocks: true,
  maxWorkers: 1,
  testRegex: '.bin-spec.ts$',
  setupFilesAfterEnv: ['./helpers/setup.ts'],
  globalSetup: './helpers/setup.ts',
};
