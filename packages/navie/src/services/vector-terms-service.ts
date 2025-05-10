import { warn } from 'node:console';
import { debug as makeDebug } from 'node:util';

import z from 'zod';

import InteractionHistory, { VectorTermsInteractionEvent } from '../interaction-history';
import Message from '../message';
import CompletionService from './completion-service';

const debug = makeDebug('navie:vector-terms');

const SYSTEM_PROMPT = `You are assisting a developer to search a code base.

The developer submits an inquiry using natural language. This inquiry must be converted into a list of search terms to be used to search the code base.

**Procedure**

1) Separate the user's inquiry into "context" and "instructions". The "context" defines the background information that will match
  code in the code base. The "instructions" are the statement about what the user wants you to do or what they want to find out.
  Be brief in the "instructions" part.
2) From here on, only consider the "context" part of the inquiry.
3) Expand the list of "context" words to include synonyms and related terms.
4) Optionally choose a small number of search terms which are MOST SELECTIVE. The MOST SELECTIVE match terms should
  be words that will match a feature or domain model object in the code base. They should be the most
  distinctive words in the inquiry. You will prefix the MOST SELECTIVE terms with a '+'.
5) In order for keywords to match optimally, compound words MUST additionally be segmented into individual search terms. This is additionally very important for compound words containing acronyms.
  E.g., "httpserver" would become "http", "server", "httpserver". "xmlserializer" -> "xml", "serializer", "xmlserializer". "jsonserializer" -> "json", "serializer", "jsonserializer". etc.

  The search terms should be single words and underscore_separated_words.`;

const schema = z.object({
  context: z.string(),
  instructions: z.string(),
  terms: z.array(z.string()),
});

export default class VectorTermsService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public readonly completionsService: CompletionService
  ) {}

  async suggestTerms(question: string): Promise<string[]> {
    const messages: Message[] = [
      {
        content: SYSTEM_PROMPT,
        role: 'system',
      },
      {
        content: 'Suggest search terms for the following:\n\n' + question,
        role: 'user',
      },
    ];

    const response = await this.completionsService.json(messages, schema, {
      model: this.completionsService.modelName,
    });

    debug(`Vector terms response: ${JSON.stringify(response, undefined, 2)}`);

    const terms = response?.terms ?? [];
    if (terms.length === 0) warn('No terms suggested');
    this.interactionHistory.addEvent(new VectorTermsInteractionEvent(terms));
    return terms;
  }
}
