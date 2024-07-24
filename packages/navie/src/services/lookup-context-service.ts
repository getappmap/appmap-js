import { warn } from 'console';
import InteractionHistory, { ContextLookupEvent, HelpLookupEvent } from '../interaction-history';
import { ContextV2 } from '../context';
import { CHARACTERS_PER_TOKEN } from '../message';
import ApplyContextService from './apply-context-service';
import { HelpRequest, HelpResponse } from '../help';

export default class LookupContextService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public readonly contextFn: (
      data: ContextV2.ContextRequest
    ) => Promise<ContextV2.ContextResponse>,
    public readonly helpFn: (data: HelpRequest) => Promise<HelpResponse>
  ) {}

  async lookupContext(
    keywords: string[],
    tokenCount: number,
    filters: ContextV2.ContextFilters = {}
  ): Promise<ContextV2.ContextResponse> {
    if (keywords.length === 0 && !filters.locations) {
      warn('WARNING: No keywords provided');
      return [];
    }

    const contextRequestPayload: ContextV2.ContextRequest & { version: 2; type: 'search' } = {
      version: 2,
      type: 'search',
      vectorTerms: keywords,
      tokenCount,
      ...filters,
    };

    const context = await this.contextFn(contextRequestPayload);

    const contextFound = context?.length > 0;
    if (contextFound) {
      this.interactionHistory.addEvent(new ContextLookupEvent(context));
    } else {
      warn('No context found');
      this.interactionHistory.addEvent(new ContextLookupEvent(undefined));
    }

    return context;
  }

  async lookupHelp(
    languages: string[],
    vectorTerms: string[],
    tokenCount: number
  ): Promise<HelpResponse> {
    const help = await this.helpFn({
      type: 'help',
      vectorTerms: [...languages, ...vectorTerms],
      tokenCount,
    });

    const helpFound = help?.length > 0;

    if (helpFound) {
      this.interactionHistory.addEvent(new HelpLookupEvent(help));
    } else {
      warn('No help found');
      this.interactionHistory.addEvent(new HelpLookupEvent(undefined));
    }

    return help;
  }

  static applyContext(
    context: ContextV2.ContextResponse,
    help: HelpResponse,
    applyContextService: ApplyContextService,
    tokenCount: number
  ) {
    applyContextService.addSystemPrompts(context, help);

    applyContextService.applyContext(context, help, tokenCount * CHARACTERS_PER_TOKEN);
  }
}
