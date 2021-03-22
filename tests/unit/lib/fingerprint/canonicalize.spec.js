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
    expect(Object.keys(algorithms)).toInclude('trace_v1');
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
