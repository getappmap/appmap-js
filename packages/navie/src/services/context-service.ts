import { AgentOptions } from '../agent';
import transformSearchTerms from '../lib/transform-search-terms';
import ApplyContextService from './apply-context-service';
import LookupContextService from './lookup-context-service';
import VectorTermsService from './vector-terms-service';

export default class ContextService {
  constructor(
    private vectorTermsService: VectorTermsService,
    private lookupContextService: LookupContextService,
    private applyContextService: ApplyContextService
  ) {}

  async perform(
    options: AgentOptions,
    tokensAvailable: () => number,
    additionalTerms: string[] = []
  ): Promise<void> {
    const lookupContext = options.userOptions.isEnabled('context', true);
    const transformTerms = options.userOptions.isEnabled('terms', true);
    if (lookupContext) {
      const searchTerms = await transformSearchTerms(
        transformTerms,
        options.aggregateQuestion,
        this.vectorTermsService
      );
      if (additionalTerms.length) {
        searchTerms.push(...additionalTerms);
      }

      const tokenCount = tokensAvailable();
      const context = await this.lookupContextService.lookupContext(
        searchTerms,
        tokenCount,
        options.buildContextFilters()
      );
      LookupContextService.applyContext(context, [], this.applyContextService, tokenCount);
    }
  }
}
