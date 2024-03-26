import { log } from 'console';
import InteractionHistory, { ContextLookupEvent, HelpLookupEvent } from '../interaction-history';
import { ContextRequest, ContextResponse } from '../context';
import { CHARACTERS_PER_TOKEN } from '../message';
import ApplyContextService from './apply-context-service';
import { HelpRequest, HelpResponse } from '../help';

export default class LookupContextService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public readonly contextFn: (data: ContextRequest) => Promise<ContextResponse>,
    public readonly helpFn: (data: HelpRequest) => Promise<HelpResponse>
  ) {}

  async lookupContext(vectorTerms: string[], tokenCount: number): Promise<ContextResponse> {
    const context = await this.contextFn({
      type: 'search',
      vectorTerms,
      tokenCount,
    });

    const contextFound = context?.sequenceDiagrams?.length > 0;
    if (contextFound) {
      this.interactionHistory.addEvent(new ContextLookupEvent(context));
    } else {
      log('No sequence diagrams found');
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
      log('No help found');
      this.interactionHistory.addEvent(new HelpLookupEvent(undefined));
    }

    return help;
  }

  static applyContext(
    context: ContextResponse,
    help: HelpResponse,
    applyContextService: ApplyContextService,
    tokenCount: number
  ) {
    applyContextService.addSystemPrompts(context, help);

    applyContextService.applyContext(context, help, tokenCount * CHARACTERS_PER_TOKEN);
  }
}
