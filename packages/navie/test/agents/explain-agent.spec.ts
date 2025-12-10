import ExplainAgent from '../../src/agents/explain-agent';
import ApplyContextService from '../../src/services/apply-context-service';
import VectorTermsService from '../../src/services/vector-terms-service';
import LookupContextService from '../../src/services/lookup-context-service';
import { AgentOptions } from '../../src/agent';
import { SEARCH_CONTEXT, suggestsVectorTerms } from '../fixture';
import { CHARACTERS_PER_TOKEN } from '../../src/message';
import { UserOptions } from '../../src/lib/parse-options';
import ContextService from '../../src/services/context-service';
import MermaidFixerService from '../../src/services/mermaid-fixer-service';
import { ContextV2 } from '../../src/context';
import InteractionHistory, { ContextItemRequestor } from '../../src/interaction-history';

describe('@explain agent', () => {
  let interactionHistory: InteractionHistory;
  let vectorTermsService: VectorTermsService;
  let lookupContextService: LookupContextService;
  let applyContextService: ApplyContextService;
  let contextService: ContextService;
  let tokensAvailable: number;
  let mermaidFixerService: MermaidFixerService;

  beforeEach(async () => {
    tokensAvailable = 1000;
    interactionHistory = new InteractionHistory();
    lookupContextService = {
      lookupContext: jest.fn(),
      lookupHelp: jest.fn(),
      contextFn: jest.fn(),
    } as unknown as LookupContextService;
    vectorTermsService = suggestsVectorTerms('How does user management work?', undefined);
    applyContextService = {
      addSystemPrompts: jest.fn(),
      applyContext: jest.fn(),
    } as unknown as ApplyContextService;
    mermaidFixerService = {
      repairDiagram: jest.fn(),
    } as unknown as MermaidFixerService;
    contextService = new ContextService(
      interactionHistory,
      vectorTermsService,
      lookupContextService,
      applyContextService
    );
  });

  afterEach(() => jest.restoreAllMocks());

  function buildAgent(): ExplainAgent {
    return new ExplainAgent(interactionHistory, contextService, mermaidFixerService);
  }

  describe('#perform', () => {
    const initialQuestionOptions = new AgentOptions(
      'How does user management work?',
      'How does user management work?',
      new UserOptions(new Map()),
      [],
      [
        {
          directory: 'twitter',
          appmapConfig: { language: 'ruby' } as unknown as any,
          appmapStats: { numAppMaps: 1 } as unknown as any,
        },
      ]
    );

    it('invokes the vector terms service', async () => {
      await buildAgent().perform(initialQuestionOptions, () => tokensAvailable);

      expect(vectorTermsService.suggestTerms).toHaveBeenCalledWith(
        'How does user management work?'
      );
    });

    it('looks up code context (only)', async () => {
      const context = SEARCH_CONTEXT;
      lookupContextService.lookupContext = jest
        .fn()
        .mockImplementation((_, __, opts: ContextV2.ContextFilters) =>
          // If it's a location context, return an empty list of context items
          // otherwise, return the expected search context
          opts.locations ? Promise.resolve([]) : Promise.resolve(context)
        );
      lookupContextService.lookupHelp = jest.fn();

      await buildAgent().perform(initialQuestionOptions, () => tokensAvailable);

      expect(lookupContextService.lookupContext).toHaveBeenCalledWith(
        ['user', 'management'],
        tokensAvailable,
        {}
      );
      expect(lookupContextService.lookupHelp).not.toHaveBeenCalled();

      expect(applyContextService.applyContext).toHaveBeenCalledWith(
        ContextItemRequestor.Terms,
        context,
        [],
        tokensAvailable * CHARACTERS_PER_TOKEN
      );
    });

    it('applies the agent and question system prompts', async () => {
      await buildAgent().perform(initialQuestionOptions, () => tokensAvailable);

      expect(interactionHistory.events.map((event) => event.metadata)).toEqual([
        {
          type: 'prompt',
          role: 'system',
          name: 'agent',
        },
        {
          type: 'prompt',
          role: 'system',
          name: 'agent',
        },
        {
          type: 'prompt',
          role: 'system',
          name: 'question',
        },
      ]);
    });

    it('propagates context filters from user options', async () => {
      const options = new AgentOptions(
        'How does user management work?',
        'How does user management work?',
        new UserOptions(new Map(Object.entries({ include: 'test', exclude: '\\.md' }))),
        [],
        []
      );

      const context = SEARCH_CONTEXT;
      lookupContextService.lookupContext = jest
        .fn()
        .mockImplementation((_, __, opts: ContextV2.ContextFilters) =>
          // If it's a location context, return an empty list of context items
          // otherwise, return the expected search context
          opts.locations ? Promise.resolve([]) : Promise.resolve(context)
        );
      lookupContextService.lookupHelp = jest.fn();

      await buildAgent().perform(options, () => tokensAvailable);

      expect(lookupContextService.lookupContext).toHaveBeenCalledWith(
        ['user', 'management'],
        tokensAvailable,
        {
          include: ['test'],
          exclude: ['\\.md'],
        }
      );
    });

    it('applies pinned file context to the question during vector term generation', async () => {
      const context = SEARCH_CONTEXT;
      lookupContextService.lookupContext = jest
        .fn()
        .mockImplementation((_, __, opts: ContextV2.ContextFilters) =>
          // Return context on location lookup, otherwise return an empty list of context items on
          // search
          opts.locations ? Promise.resolve(context) : Promise.resolve([])
        );
      lookupContextService.lookupHelp = jest.fn();
      vectorTermsService.suggestTerms = jest.fn().mockResolvedValue(['test']);

      await buildAgent().perform(initialQuestionOptions, () => tokensAvailable);

      expect(vectorTermsService.suggestTerms).toHaveBeenCalledWith(
        ['How does user management work?', ...context.map(({ content }) => content)].join('\n\n')
      );
    });

    describe('when the question is classified as a generate-diagram', () => {
      it('applies the diagram agent prompt', async () => {
        const options = new AgentOptions(
          'How does user management work?',
          'How does user management work?',
          new UserOptions(new Map()),
          [],
          [],
          undefined,
          [
            {
              name: ContextV2.ContextLabelName.GenerateDiagram,
              weight: ContextV2.ContextLabelWeight.High,
            },
          ]
        );

        await buildAgent().perform(options, () => tokensAvailable);

        expect(interactionHistory.events.map((event) => event.metadata)).toEqual([
          {
            type: 'prompt',
            role: 'system',
            name: 'agent',
          },
          {
            type: 'prompt',
            role: 'system',
            name: 'agent',
          },
          {
            type: 'prompt',
            role: 'system',
            name: 'agent',
          },
          {
            type: 'prompt',
            role: 'system',
            name: 'question',
          },
        ]);
      });
    });
  });
});
