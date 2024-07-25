import { lookup } from 'dns';
import { AgentOptions } from '../../src/agent';
import ContextService from '../../src/services/context-service';
import VectorTermsService from '../../src/services/vector-terms-service';
import LookupContextService from '../../src/services/lookup-context-service';
import ApplyContextService from '../../src/services/apply-context-service';
import { UserOptions } from '../../src/lib/parse-options';
import { SEARCH_CONTEXT } from '../fixture';

describe('ContextService', () => {
  let vectorTermsService: VectorTermsService;
  let lookupContextService: LookupContextService;
  let applyContextService: ApplyContextService;
  let contextService: ContextService;

  const question = 'How does user management work?';
  const tokensAvailable = 1000;
  const context = SEARCH_CONTEXT;

  beforeEach(() => {
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
      vectorTermsService,
      lookupContextService,
      applyContextService
    );
  });

  it('propagates context filters from user options', async () => {
    vectorTermsService.suggestTerms = jest.fn().mockResolvedValue(['user', 'management']);
    lookupContextService.lookupContext = jest.fn().mockResolvedValue(context);
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
    lookupContextService.lookupContext = jest.fn().mockResolvedValue(context);
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
});
