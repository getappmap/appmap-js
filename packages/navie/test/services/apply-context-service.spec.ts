import InteractionHistory from '../../src/interaction-history';
import ApplyContextService from '../../src/services/apply-context-service';
import LookupContextService from '../../src/services/lookup-context-service';
import {
  CODE_OBJECTS,
  CODE_SNIPPETS,
  SEQUENCE_DIAGRAMS,
  providesContext,
  providesNoContext,
} from '../fixture';

describe('ApplyContextService', () => {
  describe('collectContext', () => {
    let interactionHistory: InteractionHistory;
    let applyContextService: ApplyContextService;

    beforeEach(() => {
      interactionHistory = new InteractionHistory();
      applyContextService = new ApplyContextService(interactionHistory);
    });
    afterEach(() => jest.resetAllMocks());

    const collect = (characterLimit: number) =>
      applyContextService.applyContext(
        {
          sequenceDiagrams: SEQUENCE_DIAGRAMS,
          codeSnippets: CODE_SNIPPETS,
          codeObjects: CODE_OBJECTS,
        },
        characterLimit
      );

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

  describe('lookupAndApplyContext', () => {
    let interactionHistory: InteractionHistory;
    let lookupContextService: LookupContextService;
    let applyContextService: ApplyContextService;
    const vectorTerms = ['user', 'management'];
    const tokensAvailable = 1000;

    beforeEach(() => {
      interactionHistory = new InteractionHistory();
      applyContextService = new ApplyContextService(interactionHistory);
    });

    async function lookupAndApplyContext() {
      return await LookupContextService.lookupAndApplyContext(
        lookupContextService,
        applyContextService,
        vectorTerms,
        tokensAvailable
      );
    }

    describe('when no context is obtained', () => {
      beforeEach(() => (lookupContextService = providesNoContext(interactionHistory)));

      it('invokes the lookup context service', async () => {
        await lookupAndApplyContext();
        expect(lookupContextService.contextFn).toHaveBeenCalled();
      });

      it('applies the agent and question system prompts only', async () => {
        await lookupAndApplyContext();
        expect(interactionHistory.events.map((event) => event.metadata)).toEqual([
          {
            type: 'contextLookup',
            contextAvailable: false,
          },
        ]);
      });
    });

    describe('when context is obtained', () => {
      beforeEach(
        () => (lookupContextService = providesContext(interactionHistory, tokensAvailable))
      );

      it('applies the agent, question, and data system prompts as well as the context items', async () => {
        await lookupAndApplyContext();

        expect(lookupContextService.contextFn).toHaveBeenCalled();
        expect(interactionHistory.events.map((event) => event.metadata)).toEqual([
          {
            type: 'contextLookup',
            contextAvailable: true,
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
            name: 'Sequence diagram',
          },
        ]);
      });
    });
  });
});
