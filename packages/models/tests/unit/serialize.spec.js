import { serializeFilter, deserializeFilter, AppMapFilter } from '@appland/models';

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
    filter.declutter.hideExternalPaths.dependencyFolders = ['vendor', 'node_modules'];

    const serialized = serializeFilter(filter);
    expect(serialized).toStrictEqual(TEST_STATE);
  });

  it(`populates 'context' key'`, () => {
    const filter = new AppMapFilter();
    filter.declutter.context.on = true;
    filter.declutter.context.names = ['package:app/controllers'];

    const serialized = serializeFilter(filter);
    expect(serialized).toStrictEqual({
      context: ['package:app/controllers'],
    });
  });
  it(`populates 'contextDepth' key'`, () => {
    const filter = new AppMapFilter();
    filter.declutter.context.on = true;
    filter.declutter.context.names = ['package:app/controllers'];
    filter.declutter.context.depth = 3;

    const serialized = serializeFilter(filter);
    expect(serialized).toStrictEqual({
      context: ['package:app/controllers'],
      contextDepth: 3,
    });
  });
});

describe('deserializeFilter', () => {
  it('handles default values', () => {
    const deserialized = deserializeFilter({});
    const expectedFilter = new AppMapFilter();
    expect(deserialized).toStrictEqual(expectedFilter);
  });

  it('handles rootObjects', () => {
    const deserialized = deserializeFilter({ rootObjects: ['a', 'b'] });
    const expectedFilter = new AppMapFilter();
    expectedFilter.rootObjects = ['a', 'b'];
    expect(deserialized).toStrictEqual(expectedFilter);
  });

  it(`doesn't treat undefined as false`, () => {
    {
      const deserialized = deserializeFilter({ limitRootEvents: false, hideMediaRequests: false });
      const expectedFilter = new AppMapFilter();
      expectedFilter.declutter.limitRootEvents.on = false;
      expectedFilter.declutter.hideMediaRequests.on = false;
      expect(deserialized).toStrictEqual(expectedFilter);
    }
    {
      const deserialized = deserializeFilter({
        limitRootEvents: undefined,
        hideMediaRequests: undefined,
      });
      const expectedFilter = new AppMapFilter();
      expect(deserialized).toStrictEqual(expectedFilter);
    }
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

  describe('context', () => {
    it(`names can be specified via 'context' key`, () => {
      const serialized = stateObjectToBase64({
        context: ['package:app/controllers'],
      });

      const expectedFilter = new AppMapFilter();
      expectedFilter.declutter.context.on = true;
      expectedFilter.declutter.context.names = ['package:app/controllers'];
      expectedFilter.declutter.context.depth = 1;

      const deserialized = deserializeFilter(serialized);
      expect(deserialized).toStrictEqual(expectedFilter);
    });
    it(`depth can be specified via 'contextDepth' key`, () => {
      const serialized = stateObjectToBase64({
        context: ['package:app/controllers'],
        contextDepth: 3,
      });

      const expectedFilter = new AppMapFilter();
      expectedFilter.declutter.context.on = true;
      expectedFilter.declutter.context.names = ['package:app/controllers'];
      expectedFilter.declutter.context.depth = 3;

      const deserialized = deserializeFilter(serialized);
      expect(deserialized).toStrictEqual(expectedFilter);
    });
    it(`depth is ignored without 'context' key`, () => {
      const serialized = stateObjectToBase64({
        contextDepth: 3,
      });

      const expectedFilter = new AppMapFilter();

      const deserialized = deserializeFilter(serialized);
      expect(deserialized).toStrictEqual(expectedFilter);
    });
  });

  describe('hideExternal', () => {
    describe('is a boolean value', () => {
      const testState = {
        hideElapsedTimeUnder: 1,
        hideMediaRequests: false,
        hideName: ['package:activesupport'],
        hideUnlabeled: true,
        limitRootEvents: false,
        hideExternal: true,
      };

      it('can deserialise', () => {
        const base64Encoded = stateObjectToBase64(testState);
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
  });
});
