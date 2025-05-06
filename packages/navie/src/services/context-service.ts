import { warn } from 'console';
import { AgentOptions } from '../agent';
import transformSearchTerms from '../lib/transform-search-terms';
import LookupContextService from './lookup-context-service';
import VectorTermsService from './vector-terms-service';
import { ContextV2 } from '../context';
import InteractionHistory, { ContextItemEvent, ContextItemRequestor } from '../interaction-history';
import ApplyContextService, { eventOfContextItem } from './apply-context-service';

export default class ContextService {
  constructor(
    public history: InteractionHistory,
    private vectorTermsService: VectorTermsService,
    private lookupContextService: LookupContextService,
    private applyContextService: ApplyContextService
  ) {}

  /**
   * Populates the interaction history with context obtained by searching the project.
   */
  async searchContext(
    options: AgentOptions,
    tokensAvailable: () => number,
    additionalTerms: string[] = []
  ): Promise<void> {
    const contextEnabled = options.userOptions.isEnabled('context', true);
    const termsEnabled = options.userOptions.isEnabled('terms', true);
    if (contextEnabled) {
      this.history.log('[context-service] Searching for context');

      this.history.stopAcceptingPinnedFileContext();

      const aggregateQuestion = [options.aggregateQuestion];
      // Add content obtained from pinned files
      for (const event of this.history.events) {
        if (!(event instanceof ContextItemEvent)) continue;

        if (!(event.requestor === ContextItemRequestor.PinnedFile)) continue;

        aggregateQuestion.push(event.content);
      }

      if (options.diff) aggregateQuestion.push(options.diff);

      const searchTerms = await transformSearchTerms(
        termsEnabled,
        aggregateQuestion.join('\n\n'),
        this.vectorTermsService
      );
      if (additionalTerms) {
        searchTerms.push(...additionalTerms);
      }

      // Locations are not considered when searching for context. Use the `locationContext` method
      // to retrieve context for specific files.
      const filters = { ...options.buildContextFilters(), locations: undefined };
      const tokenCount = tokensAvailable();
      let context = await this.lookupContextService.lookupContext(searchTerms, tokenCount, filters);
      context = ContextService.guardContextType(context);

      LookupContextService.applyContext(context, [], this.applyContextService, tokenCount);
    } else {
      this.history.log('[context-service] Search context disabled by user option');
    }
  }

  /**
   * Populates the interaction history with file contents of the provided file names.
   */
  async locationContext(
    requestor: ContextItemRequestor,
    fileNames: string[]
  ): Promise<ContextItemEvent[]> {
    if (!fileNames || fileNames.length === 0) {
      this.history.log('[context-service] No file names provided for location context');
      return [];
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
    const events: ContextItemEvent[] = [];
    for (const item of context) {
      const contextItem = eventOfContextItem(requestor, item);
      if (!contextItem) continue;

      charsAdded += contextItem.content.length;
      events.push(contextItem);
      this.history.addEvent(contextItem);
    }
    this.history.log(`[context-service] Added ${charsAdded} characters of file context`);
    return events;
  }

  async searchContextWithLocations(
    requestor: ContextItemRequestor,
    searchTerms: string[],
    fileNames: string[]
  ): Promise<ContextItemEvent[]> {
    this.history.log('[context-service] Searching for context with locations');

    const filters = { locations: fileNames };
    const context = await this.lookupContextService.lookupContext(searchTerms, 1024, filters);

    let charsAdded = 0;
    const events: ContextItemEvent[] = [];
    for (const item of ContextService.guardContextType(context)) {
      const contextItem = eventOfContextItem(requestor, item);
      if (!contextItem) continue;
      charsAdded += contextItem.content.length;
      events.push(contextItem);
      this.history.addEvent(contextItem);
    }
    this.history.log(`[context-service] Added ${charsAdded} characters of context`);
    return events;
  }

  async locationContextFromOptions(options: AgentOptions): Promise<void> {
    const locations = options.buildContextFilters().locations ?? [];
    // Also list project directories
    locations.unshift(':0');
    await this.locationContext(ContextItemRequestor.PinnedFile, locations);
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
