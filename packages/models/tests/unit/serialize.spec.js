import { serializeFilter, deserializeFilter } from '../../src/serialize';
import AppMapFilter from '../../src/appMapFilter';

const TEST_STATE = {
  hideElapsedTimeUnder: 1,
  hideMediaRequests: false,
  hideName: ['package:activesupport'],
  hideUnlabeled: true,
  limitRootEvents: false,
  hideExternalPaths: ['vendor', 'node_modules'],
};

function stateObjectToBase64(stateObject) {
  return Buffer.from(JSON.stringify(stateObject), 'utf-8').toString('base64url');
}

describe('serializeFilter', () => {
  it('handles default values', () => {
    const filter = new AppMapFilter();
    const serialized = serializeFilter(filter);
    expect(serialized).toStrictEqual({});
  });

  it('handles non-default values', () => {
    const filter = new AppMapFilter();

    filter.declutter.limitRootEvents.on = false;
    filter.declutter.hideMediaRequests.on = false;
    filter.declutter.hideUnlabeled.on = true;
    filter.declutter.hideElapsedTimeUnder.on = true;
    filter.declutter.hideElapsedTimeUnder.time = 1;
    filter.declutter.hideName.on = true;
    filter.declutter.hideName.names = ['package:activesupport'];
    filter.declutter.hideExternalPaths.on = true;

    const serialized = serializeFilter(filter);
    expect(serialized).toStrictEqual(TEST_STATE);
  });
});

describe('deserializeFilter', () => {
  it('handles default values', () => {
    const deserialized = deserializeFilter({});
    const expectedFilter = new AppMapFilter();
    expect(deserialized).toStrictEqual(expectedFilter);
  });

  it('handles non-default values', () => {
    const deserialized = deserializeFilter(TEST_STATE);

    const expectedFilter = new AppMapFilter();

    expectedFilter.declutter.limitRootEvents.on = false;
    expectedFilter.declutter.hideMediaRequests.on = false;
    expectedFilter.declutter.hideUnlabeled.on = true;
    expectedFilter.declutter.hideElapsedTimeUnder.on = true;
    expectedFilter.declutter.hideElapsedTimeUnder.time = 1;
    expectedFilter.declutter.hideName.on = true;
    expectedFilter.declutter.hideName.names = ['package:activesupport'];
    expectedFilter.declutter.hideExternalPaths.on = true;

    expect(deserialized).toStrictEqual(expectedFilter);
  });

  it('handles base64-encoded strings', () => {
    const base64Encoded = stateObjectToBase64(TEST_STATE);
    const deserialized = deserializeFilter(base64Encoded);

    const expectedFilter = new AppMapFilter();

    expectedFilter.declutter.limitRootEvents.on = false;
    expectedFilter.declutter.hideMediaRequests.on = false;
    expectedFilter.declutter.hideUnlabeled.on = true;
    expectedFilter.declutter.hideElapsedTimeUnder.on = true;
    expectedFilter.declutter.hideElapsedTimeUnder.time = 1;
    expectedFilter.declutter.hideName.on = true;
    expectedFilter.declutter.hideName.names = ['package:activesupport'];
    expectedFilter.declutter.hideExternalPaths.on = true;

    expect(deserialized).toStrictEqual(expectedFilter);
  });
});
