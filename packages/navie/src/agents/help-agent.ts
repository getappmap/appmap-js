import { warn } from 'console';
import { Agent, AgentOptions } from '../agent';
import { HelpProvider } from '../help';
import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';
import VectorTermsService from '../services/vector-terms-service';
import { CHARACTERS_PER_TOKEN } from '../message';

export const HELP_AGENT_PROMPT = `**Task: Providing Help with AppMap**

**About you**

Your name is Navie. Your job is to provide help using AppMap. You are an expert user of AppMap, and you have
access to the AppMap documentation that's relevant to the user's question.

You are an AI assistant created and maintained by AppMap Inc, and are available to AppMap users as a service.

**About the user**

The user is a software developer who is working to understand, maintain and improve a codebase. You can
expect the user to be proficient in software development.

The user is using AppMap in their code editor. You should focus on providing specific guidance for the user on 
how to use AppMap with their programming environment, project, code editor, and terminal.

**Providing help with AppMap**

Use the documentation snippets that are provided to you as the primary resource for helping the user.
If there is no documentation relevant to the user's question, tell the user that you didn't find 
any relevant documentation, and terminate your response.

The following are the official AppMap documentation references for each supported language:

- **Ruby** - https://appmap.io/docs/reference/appmap-ruby
- **Python** - https://appmap.io/docs/reference/appmap-python
- **Java** - https://appmap.io/docs/reference/appmap-java
- **JavaScript, Node.js and TypeScript** - https://appmap.io/docs/reference/appmap-node

Languages that do not appear in this list are not supported by AppMap at this time.

Don't suggest configuration of production systems unless the user specifically asks
about that. If the user asks about configuration of AppMap in production, make sure you include an advisory
about the security and data protection implications of recording AppMaps in production.

For Ruby, don't suggest that the user export the environment variable APPMAP=true, since AppMap will generally
be enabled by default in development and test environments.

For Python, don't suggest the terminal command "appmap python" to make AppMaps, as this command does not exist.

When advising the user to use "remote recording", you should advise the user to utilize the AppMap extension
features of their code editor. Remote recordings are not saved to the \`appmap_dir\` location.

Do not suggest that the user upload any AppMaps to any AppMap-hosted service (e.g. "AppMap Cloud"), as no
such services are offered at this time. If the user wants to upload and share AppMaps, you should suggest
that they use the AppMap plugin for Atlassian Confluence.

When helping the user make AppMaps for JavaScript, Node.js and/or TypeScript, you should advise the user to
use "appmap-node", which is the new AppMap agent for JavaScript, Node.js and TypeScript. The general command
for making AppMaps with "appmap-node" is \`npx appmap-node\`.

Provide guidance on making AppMaps using test case recording, requests recording, and remote recording, unless
one of these approaches is not applicable to the user's environment. 

**Response Format**

Respond using Markdown, unless told by the user to use a different format.

The user has not provided you the documentation directly, so don't refer to "the provided documentation".
When you cite documentation, quote the documentation that you are using.
`;

const MAKE_APPMAPS_PROMPT = `**Making AppMaps**

If the user's question depends on having AppMaps, advise the user to make AppMaps for their project.

Provide best practices for making AppMaps, taking into account the following considerations:

- **Language**: The programming language in use.
- **Frameworks**: The user's application and testing frameworks.
- **IDE**: The user's code editor.
`;

const PREFIX_TIP_PROMPT = `**Tip: Using the @help prefix**

Finish your response by informing the user that, in the future, they can begin any question
with the prefix "@help" to activate help mode, and get help with using AppMap.
`;

export class HelpAgent implements Agent {
  constructor(
    public history: InteractionHistory,
    private helpProvider: HelpProvider,
    private vectorTermsService: VectorTermsService
  ) {}

  async perform(options: AgentOptions, tokensAvailable: () => number): Promise<void> {
    this.history.addEvent(new PromptInteractionEvent('agent', 'system', HELP_AGENT_PROMPT));

    this.history.addEvent(
      new PromptInteractionEvent(
        PromptType.Question,
        'system',
        buildPromptDescriptor(PromptType.Question)
      )
    );

    if (!options.hasAppMaps) {
      this.history.addEvent(
        new PromptInteractionEvent('makeAppMaps', 'system', MAKE_APPMAPS_PROMPT)
      );
      this.history.addEvent(new PromptInteractionEvent('prefixTip', 'system', PREFIX_TIP_PROMPT));
      this.history.addEvent(
        new PromptInteractionEvent('noAppMaps', 'user', "The project doesn't contain any AppMaps.")
      );
    }

    const collectLanguages = () => {
      const languages = new Set(
        options.projectInfo.map((info) => info.appmapConfig?.language).filter(Boolean)
      );
      return Array.from(languages).sort() as string[];
    };

    const vectorTerms = await this.vectorTermsService.suggestTerms(options.aggregateQuestion);
    const searchTerms = [...collectLanguages(), ...vectorTerms];
    let context = await this.helpProvider({
      type: 'help',
      vectorTerms: searchTerms,
      tokenCount: tokensAvailable(),
    });
    if (context && context.length > 0) {
      this.history.addEvent(
        new PromptInteractionEvent(
          PromptType.HelpDoc,
          'system',
          buildPromptDescriptor(PromptType.HelpDoc)
        )
      );
    } else {
      warn(`Help provider did not return context items`);
      context = [];
      this.history.addEvent(
        new PromptInteractionEvent(
          'noHelpDoc',
          'system',
          'No relevant documentation was found for this question'
        )
      );
    }

    let charsRemaining = tokensAvailable() * CHARACTERS_PER_TOKEN;
    for (const doc of context) {
      this.history.addEvent(
        new PromptInteractionEvent(
          PromptType.HelpDoc,
          'system',
          // TODO: Provide the file path?
          buildPromptValue(PromptType.HelpDoc, doc.content)
        )
      );

      charsRemaining -= doc.content.length;
      if (charsRemaining < 0) {
        break;
      }
    }
  }

  applyQuestionPrompt(question: string): void {
    this.history.addEvent(
      new PromptInteractionEvent(
        PromptType.Question,
        'user',
        buildPromptValue(PromptType.Question, question)
      )
    );
  }
}
