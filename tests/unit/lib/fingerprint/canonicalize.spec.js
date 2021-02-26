/* eslint-disable no-restricted-syntax */
import { buildAppMap } from '@/lib/models';
import {
  algorithms,
  canonicalize,
} from '../../../../src/lib/fingerprint/canonicalize';
import apiKeyScenario from '../../fixtures/revoke_api_key.appmap.json';

const apiKeyAppMap = buildAppMap().source(apiKeyScenario).normalize().build();

describe('Canonicalize', () => {
  test('lists available algorithms', () => {
    expect(algorithms).toBeArray();
  });

  test('ERROR level', async () => {
    const normalForm = await canonicalize('beta_v1_error', apiKeyAppMap);
    console.log(JSON.stringify(normalForm, null, 2));
  });

  test('INFO level', async () => {
    const normalForm = await canonicalize('beta_v1_info', apiKeyAppMap);
    console.log(JSON.stringify(normalForm, null, 2));
  });

  test('DEBUG level', async () => {
    const normalForm = await canonicalize('beta_v1_debug', apiKeyAppMap);
    console.log(JSON.stringify(normalForm, null, 2));
  });
});
