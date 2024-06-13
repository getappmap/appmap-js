import { dump } from 'js-yaml';

import Command, { CommandRequest } from '../command';
import LookupContextService from '../services/lookup-context-service';
import VectorTermsService from '../services/vector-terms-service';
import { ChatHistory } from '../navie';
import { ExplainOptions } from './explain-command';
import transformSearchTerms from '../lib/transform-search-terms';

export default class ContextCommand implements Command {
  constructor(
    private readonly options: ExplainOptions,
    private readonly vectorTermsService: VectorTermsService,
    private readonly lookupContextService: LookupContextService
  ) {}

  async *execute(request: CommandRequest, chatHistory?: ChatHistory): AsyncIterable<string> {
    const { question, codeSelection } = request;

    const fence = request.userOptions.isEnabled('fence', true);
    const format = request.userOptions.stringValue('format') || 'yaml';
    const tokenLimit = request.userOptions.numberValue('tokenlimit') || this.options.tokenLimit;
    const transformTerms = request.userOptions.isEnabled('terms', true);
    const exclude = request.userOptions.stringValue('exclude');

    const aggregateQuestion = [
      ...(chatHistory || [])
        .filter((message) => message.role === 'user')
        .map((message) => message.content),
      question,
      codeSelection,
    ]
      .filter(Boolean)
      .join('\n\n');

    const searchTerms = await transformSearchTerms(
      transformTerms,
      aggregateQuestion,
      this.vectorTermsService
    );
    const context = await this.lookupContextService.lookupContext(
      searchTerms,
      tokenLimit,
      [],
      exclude ? [exclude] : undefined
    );

    let contextStr: string;
    if (format === 'yaml') {
      contextStr = dump(context);
    } else {
      contextStr = JSON.stringify(context, null, 2);
    }

    if (fence) yield `\`\`\`${format}\n`;
    yield contextStr;
    if (fence) yield '```\n';
  }
}
