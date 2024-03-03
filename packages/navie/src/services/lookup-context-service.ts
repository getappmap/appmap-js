import { log } from 'console';
import InteractionHistory, { ContextLookupEvent } from '../interaction-history';
import { ContextRequest, ContextResponse } from '../context';

export default class LookupContextService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public readonly contextFn: (data: ContextRequest) => Promise<ContextResponse>
  ) {}

  async lookupContext(request: ContextRequest): Promise<ContextResponse | undefined> {
    const searchContext = await this.contextFn(request);
    const { sequenceDiagrams } = searchContext;

    if (!sequenceDiagrams || sequenceDiagrams.length === 0) {
      log('No sequence diagrams found');
      this.interactionHistory.addEvent(new ContextLookupEvent(undefined));
      return undefined;
    }

    this.interactionHistory.addEvent(new ContextLookupEvent(searchContext));

    return searchContext;
  }
}
