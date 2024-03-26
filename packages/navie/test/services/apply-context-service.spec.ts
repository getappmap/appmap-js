import { ContextProvider, ContextRequest, ContextResponse } from '../../src/context';
import { HelpProvider, HelpRequest, HelpResponse } from '../../src/help';
import InteractionHistory from '../../src/interaction-history';
import ApplyContextService from '../../src/services/apply-context-service';
import LookupContextService from '../../src/services/lookup-context-service';
import { HELP_CONTEXT, SEARCH_CONTEXT } from '../fixture';

describe('ApplyContextService', () => {
  describe('applyContext', () => {
    let interactionHistory: InteractionHistory;
    let applyContextService: ApplyContextService;
    let context: ContextResponse;
    let help: HelpResponse;

    beforeEach(() => {
      interactionHistory = new InteractionHistory();
      applyContextService = new ApplyContextService(interactionHistory);
      context = SEARCH_CONTEXT;
      help = HELP_CONTEXT;
    });
    afterEach(() => jest.resetAllMocks());

    const collect = (characterLimit: number) =>
      applyContextService.applyContext(context, help, characterLimit);

    it('collects samples of context into the output', () => {
      collect(1000 * 1000);
      expect(
        interactionHistory.events.filter((e) => e.type === 'contextItem').map((e) => ({ ...e }))
      ).toEqual([
        {
          type: 'contextItem',
          contextItem: {
            content: `diagram-1`,
            name: 'Sequence diagram',
          },
          file: undefined,
        },
        {
          type: 'contextItem',
          contextItem: {
            content: `class User < ApplicationRecord; end`,
            name: 'Code snippet',
          },
          file: 'app/user.rb',
        },
        {
          type: 'contextItem',
          contextItem: {
            content: `class Post < ApplicationRecord; end`,
            name: 'Code snippet',
          },
          file: 'app/post.rb',
        },
        {
          type: 'contextItem',
          contextItem: {
            content: `SELECT "users".* FROM "users" WHERE "users"."id" = $1 LIMIT 1`,
            name: 'Data request',
          },
          file: undefined,
        },
        {
          type: 'contextItem',
          contextItem: {
            content: `SELECT "posts".* FROM "posts" WHERE "posts"."user_id" = $1`,
            name: 'Data request',
          },
          file: undefined,
        },
        {
          type: 'contextItem',
          contextItem: {
            content: `AppMap Java reference`,
            name: 'Help document',
          },
          file: 'appmap-java.md',
        },
        {
          type: 'contextItem',
          contextItem: {
            content: `diagram-2`,
            name: 'Sequence diagram',
          },
          file: undefined,
        },
      ]);
    });

    it('limits the output to the character limit', () => {
      collect(75);
      expect(
        interactionHistory.events.filter((e) => e.type === 'contextItem').map((e) => ({ ...e }))
      ).toEqual([
        {
          type: 'contextItem',
          contextItem: {
            content: `diagram-1`,
            name: 'Sequence diagram',
          },
          file: undefined,
        },
        {
          type: 'contextItem',
          contextItem: {
            content: `class User < ApplicationRecord; end`,
            name: 'Code snippet',
          },
          file: 'app/user.rb',
        },
      ]);
    });
  });

  describe('lookup and apply context', () => {
    let interactionHistory: InteractionHistory;
    let lookupContextService: LookupContextService;
    let applyContextService: ApplyContextService;
    const vectorTerms = ['user', 'management'];
    const tokensAvailable = 1000;

    beforeEach(() => {
      interactionHistory = new InteractionHistory();
      applyContextService = new ApplyContextService(interactionHistory);
    });

    function providesContext(
      interactionHistory: InteractionHistory,
      tokenCount: number
    ): LookupContextService {
      const contextFn: ContextProvider = jest.fn().mockImplementation((request: ContextRequest) => {
        expect(request.vectorTerms).toEqual(['user', 'management']);
        expect(request.tokenCount).toEqual(tokenCount);
        return Promise.resolve(SEARCH_CONTEXT);
      });
      const helpFn: HelpProvider = jest.fn().mockImplementation((request: HelpRequest) => {
        expect(request.vectorTerms).toEqual(['ruby', 'user', 'management']);
        expect(request.tokenCount).toEqual(tokenCount);
        return Promise.resolve(HELP_CONTEXT);
      });
      return new LookupContextService(interactionHistory, contextFn, helpFn);
    }

    function providesNoContext(interactionHistory: InteractionHistory): LookupContextService {
      const contextFn: ContextProvider = jest
        .fn()
        .mockResolvedValue({ sequenceDiagrams: [], codeSnippets: {}, codeObjects: [] });
      const helpFn: HelpProvider = jest.fn().mockResolvedValue([]);
      return new LookupContextService(interactionHistory, contextFn, helpFn);
    }

    async function lookupAndApplyContext() {
      const context = await lookupContextService.lookupContext(vectorTerms, tokensAvailable);
      const help = await lookupContextService.lookupHelp(['ruby'], vectorTerms, tokensAvailable);
      LookupContextService.applyContext(context, help, applyContextService, tokensAvailable);
    }

    describe('when no context is obtained', () => {
      beforeEach(() => (lookupContextService = providesNoContext(interactionHistory)));

      it('invokes the lookup context service', async () => {
        await lookupAndApplyContext();
        expect(lookupContextService.contextFn).toHaveBeenCalled();
        expect(lookupContextService.helpFn).toHaveBeenCalled();
      });

      it('reports no context or help available', async () => {
        await lookupAndApplyContext();
        expect(interactionHistory.events.map((event) => event.metadata)).toEqual([
          {
            type: 'contextLookup',
            contextAvailable: false,
          },
          {
            type: 'helpLookup',
            helpAvailable: false,
          },
        ]);
      });
    });

    describe('when context is obtained', () => {
      beforeEach(
        () => (lookupContextService = providesContext(interactionHistory, tokensAvailable))
      );

      it('applies the agent, question, data and help system prompts as well as the context items', async () => {
        await lookupAndApplyContext();

        expect(lookupContextService.contextFn).toHaveBeenCalled();
        expect(interactionHistory.events.map((event) => event.metadata)).toEqual([
          {
            type: 'contextLookup',
            contextAvailable: true,
          },
          {
            type: 'helpLookup',
            helpAvailable: true,
          },
          {
            type: 'prompt',
            role: 'system',
            name: 'sequenceDiagrams',
          },
          {
            type: 'prompt',
            role: 'system',
            name: 'codeSnippets',
          },
          {
            type: 'prompt',
            role: 'system',
            name: 'dataRequest',
          },
          {
            type: 'prompt',
            role: 'system',
            name: 'helpDoc',
          },
          {
            type: 'contextItem',
            name: 'Sequence diagram',
          },
          {
            type: 'contextItem',
            name: 'Code snippet',
            file: 'app/user.rb',
          },
          {
            type: 'contextItem',
            name: 'Code snippet',
            file: 'app/post.rb',
          },
          {
            type: 'contextItem',
            name: 'Data request',
          },
          {
            type: 'contextItem',
            name: 'Data request',
          },
          {
            type: 'contextItem',
            name: 'Help document',
            file: 'appmap-java.md',
          },
          {
            type: 'contextItem',
            name: 'Sequence diagram',
          },
        ]);
      });
    });
  });
});
