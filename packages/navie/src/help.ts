/* eslint-disable max-classes-per-file */
import InteractionHistory, {
  InteractionEvent,
  InteractionHistoryEvents,
  PromptInteractionEvent,
} from './interaction-history';
import Message from './message';
import { ProjectInfoProvider } from './project-info';
import CompletionService, { OpenAICompletionService } from './services/completion-service';
import MemoryService from './services/memory-service';
import ProjectInfoService from './services/project-info-service';

const SYSTEM_PROMPTS = {
  title: `**Task: Provide User Assistance With AppMap**`,
  aboutYou: `**About you**

Your job is to assist users with using AppMap. The AppMap docs are located at https://appmap.io/docs.

You are created and maintained by AppMap Inc, and are available to AppMap users as a service.`,
  aboutUser: `**About the user**

The user is a software developer who is trying to use AppMap. The user may be at different stages in
their AppMap utilization. For example, they may have a general question about AppMap. They may have
installed the AppMap language library into their project, but need help recording AppMaps. They may
have recorded AppMaps and need help finding them. They may have opened an AppMap and need help
understanding the visual presentation that they are seeing. You can expect the user to
be proficient in software development, but they don't have expertise how AppMap works.

Your guidance should be directed towards using AppMap in the developer's local environment, such as
their code editor. Don't suggest configuration of production systems unless the user specifically asks
about that. If the user asks about configuration of AppMap in production, make sure you include an advisory
about the security and data protection implications of recording AppMaps in production.

For Ruby environments, you do not generally need to advise the user to export the environment variable
APPMAP=true, since AppMap will generally be enabled by default in development and test environments.

When advising the user to use "remote recording", you should advise the user to utilize the AppMap
extension features of their code editor. Remote recordings are not saved to the \`appmap_dir\` location.

Do not suggest that the user upload any AppMaps to any AppMap-hosted service (e.g. "AppMap Cloud"), as no
such services are offered at this time. If the user wants to upload and share AppMaps, you should suggest
that they use the AppMap plugin for Atlassian Confluence.
`,
  theUsersQuestion: `**The user's question**

The user's question is prefixed by "My question: ".`,
  theCodeSelection: `**The code selection**

The user is asking about specific lines of code that they have selected in their 
code editor. This code selection is prefixed by "My code selection: ".`,
  projectContext: `**Project information**

You'll be provided with information about the state of the user's project. This information includes:

* **appmap.yml** Contents of the project file appmap.yml, if any.
* **appmapStats** Information about the AppMaps that have been recorded. In addition to the number
  of AppMaps, this information includes a list of code packages, HTTP routes and tables that have been
  recorded.

You should strive to give the best answer you can, based on the information you're provided and your 
own knowledge of AppMap, software development, languages, frameworks, libraries, tools and best practices.

The additional context information is provided as context for answering the user's question. It should 
be used only as the context for answering the user's question, and not as the question itself.

You don't need to describe how to install the AppMap language library / agent, or describe how to
create appmap.yml, if the \`appmapConfig\` information is present in the project context information.

Note that the \`appmap.yml\` setting \`appmap_dir\` should generally always be \`tmp/appmap\`.
Don't advise the user to change this.
`,
  yourResponse: `**Your response**

1. **Markdown**: Respond using Markdown.

2. **Command Line**: Provide command line examples using the user's project context.

3. **Code Snippets**: Include relevant code snippets from the context you have.
  Ensure that code formatting is consistent and easy to read.

4. **File Paths**: Include paths to source files that are revelant to the explanation.

5. **Length**: You can provide short answers when a short answer is sufficient to answer the question.
  Otherwise, you should provide a long answer.
`,
};

type SystemPromptKey = keyof typeof SYSTEM_PROMPTS;

function systemPrompt(hasCodeSelection: boolean): string {
  const includeSection = (section: string) => section !== 'theCodeSelection' || hasCodeSelection;

  const sectionKeys = Object.keys(SYSTEM_PROMPTS).filter((key) => includeSection(key));
  return sectionKeys.map((key) => SYSTEM_PROMPTS[key as SystemPromptKey]).join('\n\n');
}

export type ChatHistory = Message[];

export interface ClientRequest {
  question: string;
  codeSelection?: string;
}

export class HelpOptions {
  modelName = 'gpt-4-0125-preview';
  temperature = 0.4;
}

export class HelpService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    private readonly completionService: CompletionService,
    private readonly projectInfoService: ProjectInfoService,
    private readonly memoryService: MemoryService
  ) {}

  async *execute(
    clientRequest: ClientRequest,
    _options: HelpOptions,
    chatHistory?: ChatHistory
  ): AsyncIterable<string> {
    const { question, codeSelection } = clientRequest;

    const projectInfo = await this.projectInfoService.lookupProjectInfo();
    if (!projectInfo) this.interactionHistory.log('No project info could be obtained');

    this.interactionHistory.addEvent(
      new PromptInteractionEvent('systemPrompt', false, systemPrompt(Boolean(codeSelection)))
    );
    this.interactionHistory.addEvent(
      new PromptInteractionEvent('question', false, question, 'My question: ')
    );
    if (codeSelection) {
      this.interactionHistory.addEvent(
        new PromptInteractionEvent('codeSelection', false, codeSelection, 'My code selection: ')
      );
    }

    if (!chatHistory || chatHistory?.length === 0) {
      // We fetch the project info on every question, in case the user
      // is making updates while we are conversing with them.
    } else {
      await this.memoryService.predictSummary(chatHistory);
    }

    const response = this.completionService.complete();
    for await (const token of response) {
      yield token;
    }
  }
}

export interface IHelp extends InteractionHistoryEvents {
  execute(): AsyncIterable<string>;
}

export default function explain(
  clientRequest: ClientRequest,
  projectInfoProvider: ProjectInfoProvider,
  options: HelpOptions,
  chatHistory?: ChatHistory
): IHelp {
  const interactionHistory = new InteractionHistory();
  const completionService = new OpenAICompletionService(
    interactionHistory,
    options.modelName,
    options.temperature
  );
  const projectInfoService = new ProjectInfoService(interactionHistory, projectInfoProvider);
  const memoryService = new MemoryService(
    interactionHistory,
    options.modelName,
    options.temperature
  );

  const helpService = new HelpService(
    interactionHistory,
    completionService,
    projectInfoService,
    memoryService
  );

  return {
    on: (event: 'event', listener: (event: InteractionEvent) => void) => {
      interactionHistory.on(event, listener);
    },
    execute() {
      return helpService.execute(clientRequest, options, chatHistory);
    },
  };
}
