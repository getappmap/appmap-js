/* eslint-disable no-restricted-syntax */
const { buildAppMap } = require('@appland/models');
const { readFileSync, writeFileSync } = require('fs-extra');
const { algorithms, canonicalize } = require('../../../src/fingerprint/canonicalize');
const apiKeyScenario = require('../fixtures/ruby/revoke_api_key.appmap.json');

const apiKeyAppMap = buildAppMap().source(apiKeyScenario).normalize().build();

const doUpdateFixtures = () => process.env.UPDATE_FIXTURES === 'true';

describe('Canonicalize', () => {
  test('lists available algorithms', () => {
    expect(Object.keys(algorithms)).toContain('trace');
  });

  ['update', 'info', 'trace'].forEach((algorithmName) => {
    test(`${algorithmName.toUpperCase()} level`, async () => {
      const normalForm = await canonicalize(algorithmName, apiKeyAppMap);

      const updateFixtureFile = () => {
        writeFileSync(
          `tests/unit/fixtures/ruby/canonicalize/revoke_api_key.${algorithmName}.json`,
          JSON.stringify(normalForm, null, 2)
        );
      };

      if (doUpdateFixtures()) {
        updateFixtureFile();
      }
      expect(
        JSON.parse(
          readFileSync(`tests/unit/fixtures/ruby/canonicalize/revoke_api_key.${algorithmName}.json`)
        )
      ).toEqual(normalForm);
    });
  });
});
