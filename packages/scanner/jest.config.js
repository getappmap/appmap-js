/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: parseInt(process.env.TEST_TIMEOUT, 10) || 5000,
  testRegex: '(/tests/.*|(\\.|/)(test|spec))\\.ts?$',
  setupFilesAfterEnv: ['./test/setup.ts'],
};
