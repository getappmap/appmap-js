import { z } from 'zod';

import type Command from '../command';
import type { CommandRequest } from '../command';
import CompletionService from '../services/completion-service';
import LookupContextService from '../services/lookup-context-service';
import VectorTermsService from '../services/vector-terms-service';
import { ContextV2 } from '../context';
import { ExplainOptions } from './explain-command';
import Message from '../message';
import InteractionHistory, {
  CompletionEvent,
  PromptInteractionEvent,
} from '../interaction-history';
import { UserOptions } from '../lib/parse-options';
import ProjectInfoService from '../services/project-info-service';

const RelevantTest = z.object({
  relevantTest: z
    .object({
      name: z.string().optional().describe('The name of the test case, if known'),
      path: z.string().describe('The file path of the test file'),
      language: z
        .enum(['ruby', 'python', 'java', 'javascript', 'other'])
        .describe('The programming language of the test file'),
      framework: z.string().optional().describe('The test framework used'),
    })
    .optional()
    .describe('A descriptor of the most relevant test to the requested behavior'),
  installCommands: z
    .array(
      z.object({
        command: z.string().describe('The command to execute'),
        description: z.string().optional().describe('A description of the command'),
      })
    )
    .optional()
    .describe('An ordered list of terminal command(s) necessary to execute to install AppMap'),
  testCommands: z
    .array(
      z
        .union([
          z.object({
            command: z.string().describe('The command to execute'),
            description: z.string().optional().describe('A description of the command'),
          }),
          z.string().describe('A command to execute'),
        ])
        .describe('The command to execute')
    )
    .optional()
    .describe('The ordered list of terminal command(s) that can be executed to run the test'),
});

export default class ObserveCommand implements Command {
  constructor(
    private readonly options: ExplainOptions,
    private readonly completionService: CompletionService,
    private readonly lookupContextService: LookupContextService,
    private readonly vectorTermsService: VectorTermsService,
    private readonly interactionHistory: InteractionHistory,
    private readonly projectInfoService: ProjectInfoService
  ) {}

  private async getLanguageDirective(userOptions: UserOptions): Promise<string> {
    const language = userOptions.stringValue('language');
    if (language) {
      return `The language of the test must be ${language}.`;
    }

    const projectInfos = await this.projectInfoService.lookupProjectInfo();
    if (projectInfos.length <= 1) {
      const language = projectInfos?.[0]?.appmapConfig?.language;
      return language
        ? `The test case must be written in ${language}.`
        : 'Ideally, the language of the test case should be Java, Ruby, Python, or JavaScript.';
    }

    const containsUnknownLanguage = projectInfos.some((info) => !info.appmapConfig?.language);
    const languageTable = projectInfos.reduce((acc, info) => {
      acc += `| ${info.directory} | ${info.appmapConfig?.language ?? 'unknown'} |\n`;
      return acc;
    }, '| Directory | Language |\n| --- | --- |\n');

    return [
      'The language of the test must be one of the following, associated by project directory:',
      languageTable,
      containsUnknownLanguage
        ? 'If a language is flagged as "unknown", ideally the language of the test case should be Java, Ruby, Python, or JavaScript, but this is not guaranteed.'
        : '',
    ]
      .join('\n')
      .trim();
  }

  private getTestSnippets(
    vectorTerms: string[],
    tokenLimit: number
  ): Promise<ContextV2.FileContextItem[]> {
    return this.lookupContextService
      .lookupContext(vectorTerms, tokenLimit, {
        include: ['test', 'spec'],
      })
      .then((contextItems) =>
        contextItems.filter(
          (item): item is ContextV2.FileContextItem =>
            item.type === ContextV2.ContextItemType.CodeSnippet
        )
      );
  }

  private async getMostRelevantTest(
    userRequest: string,
    userOptions: UserOptions,
    fileContextItems: ContextV2.FileContextItem[]
  ): Promise<z.infer<typeof RelevantTest> | undefined> {
    const model = this.completionService.miniModelName;
    const temperature = 0;
    const context = fileContextItems.map(
      ({ content, location }) =>
        `<code-snippet location="${location}">\n${content}\n</code-snippet>`
    );

    const projectLanguageDirective = await this.getLanguageDirective(userOptions);
    const messages: Message[] = [
      {
        role: 'system',
        content: `Given the following code snippets, identify the single most relevant test to the user request.

${projectLanguageDirective}

<code-snippets>
${context.join('\n')}
</code-snippets>`,
      },
      {
        role: 'user',
        content: userRequest,
      },
    ];

    messages.forEach(({ role, content }) => {
      this.interactionHistory.addEvent(new PromptInteractionEvent('relevantTest', role, content));
    });
    this.interactionHistory.addEvent(new CompletionEvent(model, temperature));

    const result = await this.completionService.json(messages, RelevantTest, {
      model,
      temperature,
    });

    this.interactionHistory.addEvent(
      new PromptInteractionEvent('relevantTest', 'assistant', JSON.stringify(result, null, 2))
    );

    return result;
  }

  async *execute({ question: userRequest, userOptions }: CommandRequest): AsyncIterable<string> {
    const vectorTerms = await this.vectorTermsService.suggestTerms(userRequest);
    const tokenLimit = userOptions.numberValue('tokenlimit') || this.options.tokenLimit;
    const testSnippets = await this.getTestSnippets(vectorTerms, tokenLimit);
    const result = await this.getMostRelevantTest(userRequest, userOptions, testSnippets);
    const { relevantTest, installCommands, testCommands } = result || {};
    if (!relevantTest) {
      yield 'Sorry, I could not find any relevant tests to record.';
      return;
    }

    if (relevantTest.language === 'other') {
      yield `I found a relevant test at \`${relevantTest.path}\`, but I'm unable to help you record it at this time. This language does not appear to be supported.`;
      return;
    }

    const helpDocs = await this.lookupContextService.lookupHelp(
      ['record', 'agent', 'tests', relevantTest.framework].filter(Boolean) as string[],
      tokenLimit
    );

    const messages: ReadonlyArray<Message> = [
      {
        role: 'system',
        content: `You are Navie, an AI assistant created by AppMap. Your job is to help the user identify a relevant test case and record AppMap trace data for that test case.`,
      },
      {
        role: 'user',
        content: `Identify the most relevant test case from the following string:
\`\`\`
${userRequest}
\`\`\``,
      },
      {
        role: 'assistant',
        content: `Based on the request, the most relevant test case is:
${relevantTest.name ? `**Name:** \`${relevantTest.name}\`` : ''}
${relevantTest.framework ? `**Framework:** \`${relevantTest.framework}\`` : ''}
${relevantTest.language ? `**Language:** \`${relevantTest.language}\`` : ''}
**Path:** \`${relevantTest.path}\`

${
  installCommands?.length
    ? `I've identified the following commands that you may need to run to install AppMap:
<commands>
${installCommands?.map((command) => `- \`${command.command}\`: ${command.description}`).join('\n')}
</commands>
`
    : ''
}
${
  testCommands?.length
    ? `I've identified the following commands that you may need to run to execute the test:
<commands>
${testCommands?.map((command) => `- ${commandDescription(command)}`).join('\n')}
</commands>
`
    : ''
}
Documentation which may be relevant to recording this particular test case is provided below.
<documentation>
${helpDocs
  .map(
    (doc) =>
      `<document file="${doc.filePath}" from="${doc.from}" to="${doc.to}">${doc.content}</document>`
  )
  .join('\n')}
</documentation>`,
      },
      {
        role: 'user',
        content: `Restate the information you've provided to me, in standalone format, as a step by step guide outlining the steps required to record the single test case that you've identified.
If possible, include the terminal command needed to run the test. Only specify test patterns that are guaranteed to match based on previous context. For example, do not include file ranges not supported by the test runner.
In your response, please include the following:
- The name of the test case (if known)
- The path to the test file
- Any steps and terminal commands required to install the AppMap recording agent
- Any steps and terminal commands required to run the specific test case

Do not include:
- A title or introduction
- A conclusion or closing statement
- My original inquiry`,
      },
    ];
    messages.forEach(({ role, content }) => {
      this.interactionHistory.addEvent(new PromptInteractionEvent('observe', role, content));
    });
    const temperature = 0;
    this.interactionHistory.addEvent(
      new CompletionEvent(this.completionService.modelName, temperature)
    );
    const completion = this.completionService.complete(messages, { temperature });

    for await (const token of completion) {
      yield token;
    }
  }
}

function commandDescription(command: string | { command: string; description?: string }): string {
  if (typeof command === 'string') {
    return `\`${command}\``;
  }
  return `\`${command.command}\`: ${command.description ?? ''}`;
}
