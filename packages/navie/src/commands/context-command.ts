import { dump } from 'js-yaml';

import Command, { CommandRequest } from '../command';
import LookupContextService from '../services/lookup-context-service';
import VectorTermsService from '../services/vector-terms-service';
import { ChatHistory } from '../navie';
import { ExplainOptions } from './explain-command';

export default class ContextCommand implements Command {
  constructor(
    private readonly options: ExplainOptions,
    private readonly vectorTermsService: VectorTermsService,
    private readonly lookupContextService: LookupContextService
  ) {}

  async *execute(request: CommandRequest, chatHistory?: ChatHistory): AsyncIterable<string> {
    const { question, codeSelection } = request;

    const fence = request.userOptions.isEnabled('fence', true);
    const tokenLimit = request.userOptions.numberValue('tokenlimit') || this.options.tokenLimit;

    const aggregateQuestion = [
      ...(chatHistory || [])
        .filter((message) => message.role === 'user')
        .map((message) => message.content),
      question,
      codeSelection,
    ]
      .filter(Boolean)
      .join('\n\n');

    const vectorTerms = await this.vectorTermsService.suggestTerms(aggregateQuestion);

    const context = await this.lookupContextService.lookupContext(vectorTerms, tokenLimit, []);

    const yamlContext = dump(context);
    if (fence) yield '```yaml\n';
    yield yamlContext;
    if (fence) yield '```\n';
  }
}
