import { log } from 'console';
import InteractionHistory, { ContextLookupEvent } from '../interaction-history';
import { ContextResponse } from '../interaction-state';
import assert from 'assert';

export default class LookupContextService {
  constructor(public readonly interactionHistory: InteractionHistory) {}

  async lookupContext(
    searchTerms: string[],
    requestContext: (data: any) => Promise<ContextResponse>,
    appmaps?: string[],
    appmapDir?: string
  ): Promise<ContextResponse | undefined> {
    assert(appmaps || appmapDir, 'Either appmaps or appmapDir must be provided');

    const contextArgs: any = {
      type: 'search',
      vectorTerms: searchTerms,
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (appmaps) contextArgs.appmaps = appmaps;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (appmapDir) contextArgs.appmapDir = appmapDir;

    const searchContext = await requestContext(contextArgs);
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
