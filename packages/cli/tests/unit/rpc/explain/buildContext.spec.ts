import buildContext from '../../../../src/rpc/explain/buildContext';
import { handler as sequenceDiagramHandler } from '../../../../src/rpc/appmap/sequenceDiagram';
import lookupSourceCode from '../../../../src/rpc/explain/lookupSourceCode';

jest.mock('../../../../src/rpc/appmap/sequenceDiagram');
jest.mock('../../../../src/rpc/explain/lookupSourceCode');

describe('buildContext', () => {
  beforeEach(() => jest.mocked(sequenceDiagramHandler).mockResolvedValue('the diagram'));
  afterEach(() => jest.resetAllMocks());

  describe('sequence diagram', () => {
    it('includes location', async () => {
      const context = await buildContext([
        {
          appmap: 'appmap1',
          directory: 'a',
          score: 1,
          events: [],
        },
      ]);
      expect(context).toEqual([
        {
          location: 'appmap1.appmap.json',
          type: 'sequence-diagram',
          content: 'the diagram',
          score: 1,
        },
      ]);
      expect(lookupSourceCode).not.toHaveBeenCalled();
    });
  });

  describe('function call', () => {
    it('is emitted with source code', async () => {
      jest.mocked(lookupSourceCode).mockResolvedValue(['the code']);

      const context = await buildContext([
        {
          appmap: 'appmap1',
          directory: 'a',
          score: 1,
          events: [
            { fqid: 'function:1', location: 'app/models/user.rb', score: 1, eventIds: [1, 2] },
          ],
        },
      ]);
      expect(context.filter((item) => item.type !== 'sequence-diagram')).toEqual([
        {
          location: 'app/models/user.rb',
          type: 'code-snippet',
          score: 1,
          content: 'the code',
        },
      ]);
    });
  });

  describe('data request', () => {
    it('includes location', async () => {
      const context = await buildContext([
        {
          appmap: 'appmap1',
          directory: 'a',
          score: 1,
          events: [{ fqid: 'query:SELECT * FROM users', score: 1, eventIds: [1, 2] }],
        },
      ]);
      expect(context.filter((item) => item.type !== 'sequence-diagram')).toEqual([
        {
          location: 'appmap1.appmap.json:1',
          type: 'data-request',
          score: 1,
          content: 'query:SELECT * FROM users',
        },
      ]);
      expect(lookupSourceCode).not.toHaveBeenCalled();
    });
  });
});
