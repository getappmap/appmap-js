import { warn } from 'console';
import { AgentOptions } from '../agent';
import transformSearchTerms from '../lib/transform-search-terms';
import ApplyContextService from './apply-context-service';
import LookupContextService from './lookup-context-service';
import VectorTermsService from './vector-terms-service';
import { ContextV2 } from '../context';
import InteractionHistory, { ContextItemEvent } from '../interaction-history';
import { PromptType } from '../prompt';

export type ContextOptions = {
  contextEnabled: boolean;
  termsEnabled: boolean;
  filters: ContextV2.ContextFilters;
};

export function contextOptionsFromAgentOptions(options: AgentOptions): ContextOptions {
  return {
    contextEnabled: options.userOptions.isEnabled('context', true),
    termsEnabled: options.userOptions.isEnabled('terms', true),
    filters: options.buildContextFilters(),
  };
}

export default class ContextService {
  constructor(
    public history: InteractionHistory,
    private vectorTermsService: VectorTermsService,
    private lookupContextService: LookupContextService,
    private applyContextService: ApplyContextService
  ) {}

  async searchContext(
    question: string,
    options: ContextOptions,
    tokensAvailable: () => number,
    additionalTerms?: string[],
    locations?: string[]
  ): Promise<void> {
    if (options.contextEnabled) {
      this.history.log('[context-service] Searching for context');

      const searchTerms = await transformSearchTerms(
        options.termsEnabled,
        question,
        this.vectorTermsService
      );
      if (additionalTerms) {
        searchTerms.push(...additionalTerms);
      }

      const filters = { ...options.filters };
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
    this.history.log(`[context-service] Retrieving full context of files: ${fileNames.join(', ')}`);

    // By requesting no vectors terms and no characters, we should get named files only.
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
