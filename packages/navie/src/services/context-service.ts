import { warn } from 'console';
import { AgentOptions } from '../agent';
import transformSearchTerms from '../lib/transform-search-terms';
import ApplyContextService from './apply-context-service';
import LookupContextService from './lookup-context-service';
import VectorTermsService from './vector-terms-service';
import { ContextV2 } from '../context';
import InteractionHistory, { ContextItemEvent } from '../interaction-history';
import { PromptType } from '../prompt';

export default class ContextService {
  constructor(
    public history: InteractionHistory,
    private vectorTermsService: VectorTermsService,
    private lookupContextService: LookupContextService,
    private applyContextService: ApplyContextService
  ) {}

  async searchContext(
    options: AgentOptions,
    tokensAvailable: () => number,
    additionalTerms: string[] = [],
    locations?: string[]
  ): Promise<void> {
    const contextEnabled = options.userOptions.isEnabled('context', true);
    const termsEnabled = options.userOptions.isEnabled('terms', true);
    if (contextEnabled) {
      this.history.log('[context-service] Searching for context');

      const searchTerms = await transformSearchTerms(
        termsEnabled,
        options.aggregateQuestion,
        this.vectorTermsService
      );
      if (additionalTerms) {
        searchTerms.push(...additionalTerms);
      }

      const filters = { ...options.buildContextFilters() };
      if (locations) filters.locations = locations;

      const tokenCount = tokensAvailable();
      let context = await this.lookupContextService.lookupContext(searchTerms, tokenCount, filters);
      context = ContextService.guardContextType(context);

      LookupContextService.applyContext(context, [], this.applyContextService, tokenCount);
    } else {
      this.history.log('[context-service] Search context disabled by user option');
    }
  }

  async locationContext(fileNames: string[]): Promise<void> {
    if (!fileNames || fileNames.length === 0) {
      this.history.log('[context-service] No file names provided for location context');
      return;
    }

    this.history.log(`[context-service] Retrieving full context of files: ${fileNames.join(', ')}`);

    // By requesting no terms and no characters, we should get named files only.
    let context = await this.lookupContextService.lookupContext([], 0, {
      locations: fileNames,
    });
    context = ContextService.guardContextType(context);

    // Full text of requested files is always added to the prompt. Context limits are not applied
    // in this case due to their important role in generating code.
    let charsAdded = 0;
    for (const item of context) {
      const contextItem = new ContextItemEvent(PromptType.CodeSnippet, item.content);
      if (ContextV2.isFileContextItem(item)) {
        contextItem.location = item.location;
      }
      charsAdded += contextItem.content.length;
      this.history.addEvent(contextItem);
    }
    this.history.log(`[context-service] Added ${charsAdded} characters of file context`);
  }

  static guardContextType(
    context: ContextV2.ContextResponse | undefined
  ): ContextV2.ContextResponse {
    if (!context) {
      warn('No context found');
      return [];
    }
    if (!Array.isArray(context)) {
      warn(`Invalid context type: ${typeof context}`);
      return [];
    }

    return context;
  }
}
