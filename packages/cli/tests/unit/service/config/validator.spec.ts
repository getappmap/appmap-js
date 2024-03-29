import { validateConfig } from '../../../../src/service/config/validator';

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['name'],
  properties: {
    name: {
      type: 'string',
    },
  },
};

describe('Config validation service', () => {
  it('returns no errors for a valid config', () => {
    const config = {
      name: 'a-config',
    };

    const result = validateConfig(schema, config);
    expect(result.valid).toBeTruthy();
    expect(result.errors).toBeUndefined();
  });

  it('returns errors for an invalid config', () => {
    const config = {
      name: 'a-config',
      extraProp: true,
    };

    const result = validateConfig(schema, config);
    expect(result.valid).toBeFalsy();
    expect(result.errors!.js[0].error).toMatch(/extraProp is not expected/);
  });
});
