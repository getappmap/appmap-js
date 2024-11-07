import { ContextCollector } from '../../../../src/rpc/explain/collectContext';
import * as SearchContextCollector from '../../../../src/rpc/explain/SearchContextCollector';
import * as LocationContextCollector from '../../../../src/rpc/explain/LocationContextCollector';
import * as navie from '@appland/navie';
import Location from '../../../../src/rpc/explain/location';

jest.mock('@appland/navie');
jest.mock('../../../../src/rpc/explain/SearchContextCollector');
jest.mock('../../../../src/rpc/explain/LocationContextCollector');

describe('ContextCollector', () => {
  const charLimit = 5000;

  beforeEach(() => {
    jest.mocked(navie.applyContext).mockImplementation((context) => context);
  });
  afterEach(() => jest.restoreAllMocks());

  describe('vector term search', () => {
    describe('with empty vector terms', () => {
      it('returns an empty context', async () => {
        const emptyVectorTerms = ['', '  '];

        const contextCollector = new ContextCollector(
          ['example'],
          ['src'],
          emptyVectorTerms,
          charLimit
        );
        const result = await contextCollector.collectContext();
        expect(result).toStrictEqual({
          searchResponse: {
            results: [],
            numResults: 0,
          },
          context: [],
        });

        expect(SearchContextCollector.default).not.toHaveBeenCalled();
        expect(LocationContextCollector.default).not.toHaveBeenCalled();
      });
    });
  });

  describe('with non-empty vector terms', () => {
    it('invokes SearchContextCollector', async () => {
      const vectorTerms = ['login', 'user'];
      const contextCollector = new ContextCollector(['example'], ['src'], vectorTerms, charLimit);

      const searchConstructorSpy = jest.spyOn(SearchContextCollector, 'default');
      searchConstructorSpy.mockImplementation(
        () =>
          ({
            collectContext: jest.fn().mockResolvedValue({
              searchResponse: {
                results: [],
                numResults: 0,
              },
              context: [],
            }),
          } as unknown as SearchContextCollector.default)
      );

      await contextCollector.collectContext();
      expect(searchConstructorSpy).toHaveBeenCalledWith(
        ['example'],
        ['src'],
        undefined,
        vectorTerms,
        charLimit
      );
    });
  });
  describe('with locations specified', () => {
    it('invokes LocationContextCollector', async () => {
      const locations = ['file1.py'];
      const contextCollector = new ContextCollector(['example'], ['src'], [], 0);
      contextCollector.locations = locations.map((l) => Location.parse(l)) as Location[];

      const locationConstructorSpy = jest.spyOn(LocationContextCollector, 'default');
      locationConstructorSpy.mockImplementation(
        () =>
          ({
            collectContext: jest.fn().mockResolvedValue({
              searchResponse: {
                results: [],
                numResults: 0,
              },
              context: [],
            }),
          } as unknown as LocationContextCollector.default)
      );

      await contextCollector.collectContext();
      expect(locationConstructorSpy).toHaveBeenCalledWith(['src'], contextCollector.locations);
    });
  });
});
