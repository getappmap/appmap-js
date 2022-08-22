/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  setupFilesAfterEnv: ['./jest-setup'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: parseInt(process.env.TEST_TIMEOUT, 10) || 5000,
};
