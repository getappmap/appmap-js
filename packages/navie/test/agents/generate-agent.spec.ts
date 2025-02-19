/* eslint-disable @typescript-eslint/unbound-method */
import InteractionHistory from '../../src/interaction-history';
import ApplyContextService from '../../src/services/apply-context-service';
import VectorTermsService from '../../src/services/vector-terms-service';
import LookupContextService from '../../src/services/lookup-context-service';
import { AgentOptions } from '../../src/agent';
import GenerateAgent from '../../src/agents/generate-agent';
import { suggestsVectorTerms } from '../fixture';
import { UserOptions } from '../../src/lib/parse-options';
import ContextService from '../../src/services/context-service';
import FileChangeExtractorService from '../../src/services/file-change-extractor-service';

describe('@generate agent', () => {
  let interactionHistory: InteractionHistory;
  let vectorTermsService: VectorTermsService;
  let lookupContextService: LookupContextService;
  let applyContextService: ApplyContextService;
  let fileChangeExtractorService: FileChangeExtractorService;
  let contextService: ContextService;
  let tokensAvailable: number;

  beforeEach(() => {
    tokensAvailable = 1000;
    interactionHistory = new InteractionHistory();
    lookupContextService = {
      lookupContext: jest.fn(),
      lookupHelp: jest.fn(),
    } as unknown as LookupContextService;
    vectorTermsService = suggestsVectorTerms('How does user management work?', undefined);
    applyContextService = {
      addSystemPrompts: jest.fn(),
      applyContext: jest.fn(),
    } as unknown as ApplyContextService;
    fileChangeExtractorService = {
      listFiles: jest.fn(),
    } as unknown as FileChangeExtractorService;
    contextService = new ContextService(
      interactionHistory,
      vectorTermsService,
      lookupContextService,
      applyContextService
    );
  });

  afterEach(() => jest.restoreAllMocks());

  function buildAgent(): GenerateAgent {
    return new GenerateAgent(interactionHistory, contextService, fileChangeExtractorService);
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
          appmapConfig: { language: 'ruby' } as never,
          appmapStats: { numAppMaps: 1 } as never,
        },
      ]
    );

    it('invokes the vector terms service', async () => {
      await buildAgent().perform(initialQuestionOptions, () => tokensAvailable);

      expect(vectorTermsService.suggestTerms).toHaveBeenCalledWith(
        'How does user management work?'
      );
    });

    it('looks up context but not help', async () => {
      await buildAgent().perform(initialQuestionOptions, () => tokensAvailable);

      expect(lookupContextService.lookupContext).toHaveBeenCalledWith(
        ['user', 'management'],
        tokensAvailable,
        {}
      );
      expect(lookupContextService.lookupHelp).not.toHaveBeenCalled();
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
          name: 'issueDescription',
        },
      ]);
    });
  });

  describe('#filter', () => {
    it('filters out markdown fences around changesets', async () => {
      const agent = buildAgent();
      const input = [
        'Some initial text\n',
        '```xml\n<change>',
        '<file change-number-for-this-file="1">/path/to/file</file>',
        '</change>\n```',
        'Some final text\n',
      ].join('\n');

      const expectedOutput = [
        'Some initial text\n',
        '<change>',
        '<file change-number-for-this-file="1">/path/to/file</file>',
        '</change>',
        'Some final text\n',
      ].join('\n');

      const result = [];
      for await (const chunk of agent.filter(streamStringByChunk(input))) result.push(chunk);

      expect(result.join('')).toEqual(expectedOutput);
    });

    it('filters out non-xml markdown fences around changesets', async () => {
      const agent = buildAgent();
      const input = [
        'Some initial text\n',
        '```java\n<change>',
        '<file change-number-for-this-file="1">/path/to/file</file>',
        '</change>\n```',
        'Some final text\n',
      ].join('\n');

      const expectedOutput = [
        'Some initial text\n',
        '<change>',
        '<file change-number-for-this-file="1">/path/to/file</file>',
        '</change>',
        'Some final text\n',
      ].join('\n');

      const result = [];
      for await (const chunk of agent.filter(streamStringByChunk(input))) result.push(chunk);

      expect(result.join('')).toEqual(expectedOutput);
    });

    it('handles input without markdown fences correctly', async () => {
      const agent = buildAgent();
      const input = [
        'Some initial text\n',
        '<change>',
        '<file change-number-for-this-file="1">/path/to/file</file>',
        '</change>',
        'Some final text\n',
      ].join('\n');

      const result = [];
      for await (const chunk of agent.filter(streamStringByChunk(input))) result.push(chunk);

      expect(result.join('')).toEqual(input);
    });
  });
});

// eslint-disable-next-line @typescript-eslint/require-await
async function* streamStringByChunk(str: string): AsyncIterable<string> {
  for (let i = 0; i < str.length; i += 3) yield str.slice(i, i + 3);
}
