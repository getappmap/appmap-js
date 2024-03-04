import InteractionHistory, { ContextLookupEvent } from '../interaction-history';
import { SampleContextRequest, ContextResponse } from '../context';

export default class SampleContextService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public readonly contextFn: (data: SampleContextRequest) => Promise<ContextResponse>
  ) {}

  async lookupContext(request: SampleContextRequest): Promise<ContextResponse | undefined> {
    const context = await this.contextFn(request);
    this.interactionHistory.addEvent(new ContextLookupEvent(context));
    return context;
  }
}
