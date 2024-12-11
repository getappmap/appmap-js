/* eslint @typescript-eslint/no-unsafe-assignment: 0 */
import { navieMetadataV1, navieMetadataV2 } from '../../../../src/rpc/navie/metadata';

describe('navieMetadataV1', () => {
  it('provides expected fields', () =>
    expect(navieMetadataV1().handler({})).toStrictEqual({
      welcomeMessage: expect.any(String),
      inputPlaceholder: expect.any(String),
      commands: expect.any(Array),
    }));
});

describe('navieMetadataV2', () => {
  it('provides expected fields', () =>
    expect(navieMetadataV2().handler({})).toStrictEqual({
      inputPlaceholder: expect.any(String),
      commands: expect.any(Array),
    }));
});
