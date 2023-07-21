import { serializeFilter, deserializeFilter, AppMapFilter } from '@appland/models';

const TEST_STATE = {
  hideElapsedTimeUnder: 1,
  hideMediaRequests: false,
  hideName: ['package:activesupport'],
  hideUnlabeled: true,
  limitRootEvents: false,
  hideExternalPaths: ['vendor', 'node_modules'],
};

const TEST_STATE_BOOL = {
  hideElapsedTimeUnder: 1,
  hideMediaRequests: false,
  hideName: ['package:activesupport'],
  hideUnlabeled: true,
  limitRootEvents: false,
  hideExternal: true,
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

  describe('non-default values', () => {
    function testFilter(
      description,
      expectedState,
      prepareFilterFn,
      prepareDeserializedExpectationFn
    ) {
      return it(description, () => {
        const filter = new AppMapFilter();
        prepareFilterFn(filter);
        const serialized = serializeFilter(filter);
        expect(serialized).toStrictEqual(expectedState);

        const restored = deserializeFilter(serialized);
        const expectedRestored = prepareDeserializedExpectationFn
          ? prepareDeserializedExpectationFn(new AppMapFilter())
          : filter;
        expect(restored).toStrictEqual(expectedRestored);
      });
    }

    testFilter(
      'limitRootEvents can be disabled',
      { limitRootEvents: false },
      (filter) => (filter.declutter.limitRootEvents.on = false)
    );

    testFilter(
      'hideMediaRequests can be disabled',
      { hideMediaRequests: false },
      (filter) => (filter.declutter.hideMediaRequests.on = false)
    );

    testFilter(
      'hideUnlabeled can be enabled',
      { hideUnlabeled: true },
      (filter) => (filter.declutter.hideUnlabeled.on = true)
    );

    testFilter(
      'hideElapsedTimeUnder can be enabled',
      { hideElapsedTimeUnder: 1 },
      (filter) => (filter.declutter.hideElapsedTimeUnder.on = true)
    );

    testFilter(
      'hideElapsedTimeUnder can have a different time threshold',
      { hideElapsedTimeUnder: 10 },
      (filter) => (
        (filter.declutter.hideElapsedTimeUnder.on = true),
        (filter.declutter.hideElapsedTimeUnder.time = 10)
      )
    );

    testFilter(
      'hideElapsedTimeUnder can have a different time threshold but still be disabled',
      {},
      (filter) => (filter.declutter.hideElapsedTimeUnder.time = 10),
      (filter) => filter
    );

    testFilter(
      'hideName can be enabled',
      { hideName: ['foo'] },
      (filter) => (
        (filter.declutter.hideName.on = true), (filter.declutter.hideName.names = ['foo'])
      )
    );

    testFilter(
      'hideName can be enabled with an empty name list',
      { hideName: [] },
      (filter) => ((filter.declutter.hideName.on = true), (filter.declutter.hideName.names = []))
    );

    testFilter(
      'hideName is ignored if disabled with an non-empty name list',
      {},
      (filter) => (filter.declutter.hideName.names = ['foo']),
      (filter) => filter
    );

    testFilter(
      'hideExternalPaths can be disabled',
      { hideExternalPaths: false },
      (filter) => (filter.declutter.hideExternalPaths.on = false)
    );

    testFilter(
      'hideExternalPaths can be enabled and the dependency folder list can be different',
      { hideExternalPaths: ['foo'] },
      (filter) => (filter.declutter.hideExternalPaths.dependencyFolders = ['foo'])
    );

    testFilter(
      'hideExternalPaths can be enabled and the dependency folder list can be empty',
      { hideExternalPaths: [] },
      (filter) => (filter.declutter.hideExternalPaths.dependencyFolders = [])
    );
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
    expectedFilter.declutter.hideExternalPaths.dependencyFolders = ['vendor', 'node_modules'];

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
    expectedFilter.declutter.hideExternalPaths.dependencyFolders = ['vendor', 'node_modules'];

    expect(deserialized).toStrictEqual(expectedFilter);
  });

  it('can deserialise when hideExternal is a boolean value', () => {
    const base64Encoded = stateObjectToBase64(TEST_STATE_BOOL);
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
    expectedFilter.declutter.hideExternalPaths.dependencyFolders = ['vendor', 'node_modules'];

    expect(deserialized).toStrictEqual(expectedFilter);
  });
});
