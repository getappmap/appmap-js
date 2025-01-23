import assert from 'node:assert';

import { AgentOptions } from '../../src/agent';
import ContextService from '../../src/services/context-service';
import VectorTermsService from '../../src/services/vector-terms-service';
import LookupContextService from '../../src/services/lookup-context-service';
import ApplyContextService from '../../src/services/apply-context-service';
import { UserOptions } from '../../src/lib/parse-options';
import { SEARCH_CONTEXT } from '../fixture';
import { ContextV2 } from '../../src/context';
import InteractionHistory, {
  ContextItemEvent,
  ContextItemRequestor,
} from '../../src/interaction-history';

describe('ContextService', () => {
  let history: InteractionHistory;
  let vectorTermsService: VectorTermsService;
  let lookupContextService: LookupContextService;
  let applyContextService: ApplyContextService;
  let contextService: ContextService;

  const question = 'How does user management work?';
  const tokensAvailable = 1000;

  beforeEach(() => {
    history = new InteractionHistory();
    vectorTermsService = {
      suggestTerms: jest.fn(),
    } as unknown as VectorTermsService;
    lookupContextService = {
      lookupContext: jest.fn(),
      lookupHelp: jest.fn(),
    } as unknown as LookupContextService;
    applyContextService = {
      addSystemPrompts: jest.fn(),
      applyContext: jest.fn(),
    } as unknown as ApplyContextService;

    contextService = new ContextService(
      history,
      vectorTermsService,
      lookupContextService,
      applyContextService
    );
  });

  describe('searchContext', () => {
    const searchContext = SEARCH_CONTEXT;

    it('propagates context filters from user options', async () => {
      vectorTermsService.suggestTerms = jest.fn().mockResolvedValue(['user', 'management']);
      lookupContextService.lookupContext = jest.fn().mockResolvedValue(searchContext);
      lookupContextService.lookupHelp = jest.fn();

      const options = new AgentOptions(
        question,
        question,
        new UserOptions(new Map(Object.entries({ include: 'test', exclude: '\\.md' }))),
        [],
        []
      );

      await contextService.searchContext(options, () => tokensAvailable);

      expect(lookupContextService.lookupContext).toHaveBeenCalledWith(
        ['user', 'management'],
        tokensAvailable,
        {
          include: ['test'],
          exclude: ['\\.md'],
        }
      );
    });

    it('applies optional vector terms', async () => {
      vectorTermsService.suggestTerms = jest.fn().mockResolvedValue(['user', 'management']);
      lookupContextService.lookupContext = jest.fn().mockResolvedValue(searchContext);
      lookupContextService.lookupHelp = jest.fn();

      const options = new AgentOptions(
        question,
        question,
        new UserOptions(new Map(Object.entries({}))),
        [],
        []
      );

      await contextService.searchContext(options, () => tokensAvailable, ['test']);

      expect(lookupContextService.lookupContext).toHaveBeenCalledWith(
        ['user', 'management', 'test'],
        tokensAvailable,
        {}
      );
    });

    describe('when the context response is malformed', () => {
      it('treats the response as empty', async () => {
        vectorTermsService.suggestTerms = jest.fn().mockResolvedValue(['user', 'management']);
        lookupContextService.lookupContext = jest.fn().mockResolvedValue({
          name: 'what?',
        });
        lookupContextService.lookupHelp = jest.fn();

        const options = new AgentOptions(
          question,
          question,
          new UserOptions(new Map(Object.entries({}))),
          [],
          []
        );

        await contextService.searchContext(options, () => tokensAvailable);

        expect(applyContextService.applyContext).toHaveBeenCalledWith(
          ContextItemRequestor.Terms,
          [],
          [],
          3000
        );
      });
    });
  });

  describe('locationContext', () => {
    const locationContext: ContextV2.ContextResponse = [
      {
        type: ContextV2.ContextItemType.CodeSnippet,
        location: 'file1',
        content: 'the file 1',
      },
      {
        type: ContextV2.ContextItemType.CodeSnippet,
        location: 'file2',
        content: 'the file 2',
      },
    ];

    it('retrieves context for files', async () => {
      lookupContextService.lookupContext = jest.fn().mockResolvedValue(locationContext);

      await contextService.locationContext(ContextItemRequestor.Terms, ['file1', 'file2']);

      expect(lookupContextService.lookupContext).toHaveBeenCalledWith([], 0, {
        locations: ['file1', 'file2'],
      });
      expect(history.events.map((event) => event.metadata)).toEqual([
        {
          location: 'file1',
          promptType: 'codeSnippets',
          type: 'contextItem',
        },
        {
          location: 'file2',
          promptType: 'codeSnippets',
          type: 'contextItem',
        },
      ]);
    });

    it('sets the directory and requestor on ContextItemEvent', async () => {
      const locationContextWithDirectory = [
        {
          type: ContextV2.ContextItemType.CodeSnippet,
          location: 'file1',
          content: 'the file 1',
          directory: 'dir1',
        },
      ];
      lookupContextService.lookupContext = jest
        .fn()
        .mockResolvedValue(locationContextWithDirectory);

      await contextService.locationContext(ContextItemRequestor.Terms, ['file1']);

      const event = history.events[0];
      assert(event instanceof ContextItemEvent);
      expect(event.directory).toEqual('dir1');
      expect(event.requestor).toEqual(ContextItemRequestor.Terms);
    });
  });
});
