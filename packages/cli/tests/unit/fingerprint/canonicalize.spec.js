/* eslint-disable no-restricted-syntax */
const { buildAppMap } = require('@appland/models');
const { readFileSync } = require('fs-extra');
const {
  algorithms,
  canonicalize,
} = require('../../../src/fingerprint/canonicalize');
const apiKeyScenario = require('../fixtures/revoke_api_key.appmap.json');

const apiKeyAppMap = buildAppMap().source(apiKeyScenario).normalize().build();

describe('Canonicalize', () => {
  test('lists available algorithms', () => {
    expect(Object.keys(algorithms)).toContain('trace');
  });

  test('UPDATE level', async () => {
    const normalForm = await canonicalize('update', apiKeyAppMap);
    expect(
      JSON.parse(
        readFileSync(
          `tests/unit/fixtures/canonicalize/revoke_api_key.update.json`
        )
      )
    ).toEqual(normalForm);
  });

  test('INFO level', async () => {
    const normalForm = await canonicalize('info', apiKeyAppMap);
    expect(
      JSON.parse(
        readFileSync(
          `tests/unit/fixtures/canonicalize/revoke_api_key.info.json`
        )
      )
    ).toEqual(normalForm);
  });

  test('TRACE level', async () => {
    const normalForm = await canonicalize('trace', apiKeyAppMap);
    expect(
      JSON.parse(
        readFileSync(
          `tests/unit/fixtures/canonicalize/revoke_api_key.trace.json`
        )
      )
    ).toEqual(normalForm);
  });
});
