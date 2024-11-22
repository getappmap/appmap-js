import { SearchRpc } from '@appland/rpc';
import { join } from 'path';

import { textSearchResultToRpcSearchResult } from '../../../../src/rpc/explain/textSearchResultToRpcSearchResult';
import buildContext from '../../../../src/rpc/explain/buildContext';
import { SearchResponse as AppMapSearchResponse } from '../../../../src/fulltext/appmap-match';
import FindEvents, {
  SearchResponse as EventSearchResponse,
} from '../../../../src/fulltext/FindEvents';
import EventCollector from '../../../../src/rpc/explain/EventCollector';

jest.mock('../../../../src/fulltext/FindEvents');
jest.mock('../../../../src/rpc/explain/buildContext');

describe('EventCollector', () => {
  const mockFindEventsResponses: EventSearchResponse[] = [
    {
      type: 'event',
      numResults: 1,
      results: [
        {
          appmap: 'appMapId1',
          fqid: 'testFqid1',
          score: 1,
          eventIds: [1, 2, 3],
        },
      ],
    },
    {
      type: 'event',
      numResults: 1,
      results: [
        {
          appmap: 'appMapId2',
          fqid: 'testFqid2',
          score: 1,
          eventIds: [2, 3, 4],
        },
      ],
    },
  ];

  const oneSearchResponse: AppMapSearchResponse = {
    type: 'appmap',
    numResults: 1,
    stats: { max: 1, mean: 1, median: 1, stddev: 0 },
    results: [{ appmap: 'appMapId1', directory: 'a', score: 1 }],
  };

  const multiSearchResponse: AppMapSearchResponse = {
    type: 'appmap',
    numResults: 2, // Indicating two appmaps are present
    stats: { max: 1, mean: 1, median: 1, stddev: 0 },
    results: [
      { appmap: 'appMapId1', directory: 'a', score: 1 },
      { appmap: 'appMapId2', directory: 'b', score: 1 },
    ],
  };

  beforeEach(() => {
    jest.mocked(FindEvents).prototype.initialize.mockResolvedValue();
    let mockFindEventsResponsesCopy = [...mockFindEventsResponses];
    jest
      .mocked(FindEvents)
      .prototype.search.mockImplementation(() => mockFindEventsResponsesCopy.shift()!);
    jest.mocked(buildContext).mockResolvedValue([]);
  });
  afterEach(() => jest.resetAllMocks());

  it('correctly initializes and indexes app maps', async () => {
    const collector = new EventCollector('query', oneSearchResponse);
    await collector.collectEvents(10);

    const appmap = join('a', 'appMapId1');
    expect(FindEvents).toHaveBeenCalledWith(appmap);
    expect(FindEvents.prototype.initialize).toHaveBeenCalled();
    expect(collector.appmapIndexes.has(appmap)).toBe(true);
  });

  it('collects events based on provided maxEvents', async () => {
    const maxEvents = 10;
    const collector = new EventCollector('query', oneSearchResponse);
    const collectedData = await collector.collectEvents(maxEvents);

    expect(FindEvents.prototype.search).toHaveBeenCalledWith('query', { maxResults: maxEvents });
    expect(buildContext).toHaveBeenCalled();
    expect(collectedData.results[0].events).toEqual(
      mockFindEventsResponses[0].results.map(textSearchResultToRpcSearchResult)
    );
  });

  it('collects events from multiple appmaps', async () => {
    const maxEvents = 10;
    const collector = new EventCollector('query', multiSearchResponse);
    const collectedData = await collector.collectEvents(maxEvents);

    // Assume the findEvents method provides merged results from multiple appmaps
    const expectedResponse: SearchRpc.SearchResponse = {
      numResults: 2,
      results: [
        {
          appmap: join('a', 'appMapId1'),
          directory: 'a',
          score: 1,
          events: mockFindEventsResponses[0].results.map(textSearchResultToRpcSearchResult),
        },
        {
          appmap: join('b', 'appMapId2'),
          directory: 'b',
          score: 1,
          events: mockFindEventsResponses[1].results.map(textSearchResultToRpcSearchResult),
        },
      ],
    };

    expect(FindEvents.prototype.search).toHaveBeenCalledTimes(multiSearchResponse.numResults);
    expect(collectedData.results).toEqual(expectedResponse.results);
  });
});
