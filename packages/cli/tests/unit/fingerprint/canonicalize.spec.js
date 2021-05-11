/* eslint-disable no-restricted-syntax */
const { buildAppMap } = require('@appland/models');
const {
  algorithms,
  canonicalize,
} = require('../../../src/fingerprint/canonicalize.js');
const apiKeyScenario = require('../fixtures/revoke_api_key.appmap.json');

const apiKeyAppMap = buildAppMap().source(apiKeyScenario).normalize().build();

describe('Canonicalize', () => {
  test('lists available algorithms', () => {
    expect(Object.keys(algorithms)).toContain('trace_v1');
  });

  test('UPDATE level', async () => {
    const normalForm = await canonicalize('update_v1', apiKeyAppMap);
    console.log(JSON.stringify(normalForm, null, 2));
  });

  test('INFO level', async () => {
    const normalForm = await canonicalize('info_v1', apiKeyAppMap);
    console.log(JSON.stringify(normalForm, null, 2));
  });

  test('TRACE level', async () => {
    const normalForm = await canonicalize('trace_v1', apiKeyAppMap);
    console.log(JSON.stringify(normalForm, null, 2));
  });
});
