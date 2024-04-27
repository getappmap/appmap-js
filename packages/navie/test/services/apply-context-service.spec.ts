import { ContextV2 } from '../../src/context';
import { HelpProvider, HelpRequest, HelpResponse } from '../../src/help';
import InteractionHistory, { ContextItemEvent } from '../../src/interaction-history';
import ApplyContextService from '../../src/services/apply-context-service';
import LookupContextService from '../../src/services/lookup-context-service';
import { HELP_CONTEXT, SEARCH_CONTEXT } from '../fixture';

describe('ApplyContextService', () => {
  describe('applyContext', () => {
    let interactionHistory: InteractionHistory;
    let applyContextService: ApplyContextService;
    let context: ContextV2.ContextResponse;
    let help: HelpResponse;

    beforeEach(() => {
      interactionHistory = new InteractionHistory();
      applyContextService = new ApplyContextService(interactionHistory);
      context = SEARCH_CONTEXT;
      help = HELP_CONTEXT;
    });
    afterEach(() => jest.resetAllMocks());

    const collect = (characterLimit: number, maxContentLength = characterLimit / 5) =>
      applyContextService.applyContext(context, help, characterLimit, maxContentLength);

    it('collects samples of context into the output', () => {
      collect(1000 * 1000);
      expect(
        interactionHistory.events
          .filter((e) => e.type === 'contextItem')
          .map((e) => ({ ...e.metadata, ...{ content: (e as ContextItemEvent).content } }))
      ).toEqual([
        {
          content: `diagram-1`,
          promptType: 'sequenceDiagrams',
          type: 'contextItem',
        },
        {
          content: `class User < ApplicationRecord; end`,
          promptType: 'codeSnippets',
          location: 'app/user.rb',
          type: 'contextItem',
        },
        {
          content: `class Post < ApplicationRecord; end`,
          promptType: 'codeSnippets',
          location: 'app/post.rb',
          type: 'contextItem',
        },
        {
          content: `SELECT "users".* FROM "users" WHERE "users"."id" = $1 LIMIT 1`,
          promptType: 'dataRequest',
          type: 'contextItem',
        },
        {
          content: `SELECT "posts".* FROM "posts" WHERE "posts"."user_id" = $1`,
          promptType: 'dataRequest',
          type: 'contextItem',
        },
        {
          content: `AppMap Java reference`,
          promptType: 'helpDoc',
          type: 'contextItem',
        },
        {
          content: `diagram-2`,
          promptType: 'sequenceDiagrams',
          type: 'contextItem',
        },
      ]);
    });

    it('limits the output to the character limit', () => {
      collect(10, 50);
      expect(
        interactionHistory.events.map((e) => ({
          ...e.metadata,
          ...{ content: (e as ContextItemEvent).content },
        }))
      ).toEqual([
        {
          content: `diagram-1`,
          promptType: 'sequenceDiagrams',
          type: 'contextItem',
        },
        {
          content: `class User < ApplicationRecord; end`,
          promptType: 'codeSnippets',
          location: 'app/user.rb',
          type: 'contextItem',
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
      const contextFn = jest.fn().mockImplementation((request: ContextV2.ContextRequest) => {
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
      const contextFn = jest.fn().mockResolvedValue([]);
      const helpFn = jest.fn().mockResolvedValue([]);
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
            promptType: 'sequenceDiagrams',
          },
          {
            type: 'contextItem',
            promptType: 'codeSnippets',
            location: 'app/user.rb',
          },
          {
            type: 'contextItem',
            promptType: 'codeSnippets',
            location: 'app/post.rb',
          },
          {
            type: 'contextItem',
            promptType: 'dataRequest',
          },
          {
            type: 'contextItem',
            promptType: 'dataRequest',
          },
          {
            type: 'contextItem',
            promptType: 'helpDoc',
          },
          {
            type: 'contextItem',
            promptType: 'sequenceDiagrams',
          },
        ]);
      });
    });
  });
});
