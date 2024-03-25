import { log } from 'console';
import InteractionHistory, { ContextLookupEvent } from '../interaction-history';
import { ContextRequest, ContextResponse } from '../context';
import { CHARACTERS_PER_TOKEN } from '../message';
import ApplyContextService from './apply-context-service';

export default class LookupContextService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public readonly contextFn: (data: ContextRequest) => Promise<ContextResponse>
  ) {}

  async lookupContext(request: ContextRequest): Promise<ContextResponse | undefined> {
    const searchContext = await this.contextFn(request);

    const hasProvidedData = searchContext?.sequenceDiagrams?.length > 0;
    if (!hasProvidedData) {
      log('No sequence diagrams found');
      this.interactionHistory.addEvent(new ContextLookupEvent(undefined));
      return undefined;
    }

    this.interactionHistory.addEvent(new ContextLookupEvent(searchContext));

    return searchContext;
  }

  static async lookupAndApplyContext(
    lookupContextService: LookupContextService,
    applyContextService: ApplyContextService,
    vectorTerms: string[],
    tokensAvailable: number
  ) {
    const context = await lookupContextService.lookupContext({
      vectorTerms,
      tokenCount: tokensAvailable,
      type: 'search',
    });
    if (context) {
      applyContextService.addSystemPrompts(context);
      applyContextService.applyContext(context, tokensAvailable * CHARACTERS_PER_TOKEN);
    }
  }
}
