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
    expect(Object.keys(algorithms)).toContain('trace_v1');
  });

  test('UPDATE level', async () => {
    const normalForm = await canonicalize('update_v1', apiKeyAppMap);
    expect(
      JSON.parse(
        readFileSync(
          `tests/unit/fixtures/canonicalize/revoke_api_key.update.json`
        )
      )
    ).toEqual(normalForm);
  });

  test('INFO level', async () => {
    const normalForm = await canonicalize('info_v1', apiKeyAppMap);
    expect(
      JSON.parse(
        readFileSync(
          `tests/unit/fixtures/canonicalize/revoke_api_key.info.json`
        )
      )
    ).toEqual(normalForm);
  });

  test('TRACE level', async () => {
    const normalForm = await canonicalize('trace_v1', apiKeyAppMap);
    expect(
      JSON.parse(
        readFileSync(
          `tests/unit/fixtures/canonicalize/revoke_api_key.trace.json`
        )
      )
    ).toEqual(normalForm);
  });
});
