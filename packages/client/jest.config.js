/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: Number.parseInt(process.env.TEST_TIMEOUT, 10) || 5000,
};
