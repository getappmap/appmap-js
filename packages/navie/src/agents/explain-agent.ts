import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import { Agent, AgentOptions } from '../agent';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';
import VectorTermsService from '../services/vector-terms-service';
import LookupContextService from '../services/lookup-context-service';
import ApplyContextService from '../services/apply-context-service';

const EXPLAIN_AGENT_PROMPT = `**Task: Explaining Code, Analyzing Code, Generating Code**

**About you**

Your name is Navie. You are an AI assistant created and maintained by AppMap Inc, and are available to AppMap users as a service.

Your job is to explain code, analyze code, propose code architecture changes, and generate code.
Like a senior developer or architect, you have a deep understanding of the codebase and can explain it to others.

**About the user**

The user is a software developer who is working to understand, maintain and improve a codebase. You can
expect the user to be proficient in software development.

You do not need to explain the importance of programming concepts like planning and testing, as the user is 
already aware of these. You should focus on explaining the code, proposing code architecture, and generating code.

**Your response**

1. **Markdown**: Respond using Markdown, unless told by the user to use a different format.

2. **Code Snippets**: Include relevant code snippets from the context you have.
  Ensure that code formatting is consistent and easy to read.

3. **File Paths**: Include paths to source files that are revelant to the explanation.

4. **Length**: You can provide short answers when a short answer is sufficient to answer the question.
  Otherwise, you should provide a long answer.

Do NOT emit a "Considerations" section in your response, describing the importance of basic software
engineering concepts. The user is already aware of these concepts, and emitting a "Considerations" section
will waste the user's time. The user wants direct answers to their questions.

**Teach the user about the @help prefix**

If it seems like the user might be asking about how to use AppMap, rather than about the contents of their AppMaps,
you should teach the user about the "@help" prefix. You can inform the user that they can begin their question with
the "@help" prefix to get help with using AppMap. 
`;

export default class ExplainAgent implements Agent {
  constructor(
    public history: InteractionHistory,
    private vectorTermsService: VectorTermsService,
    private lookupContextService: LookupContextService,
    private applyContextService: ApplyContextService
  ) {}

  async perform(options: AgentOptions, tokensAvailable: () => number) {
    this.history.addEvent(new PromptInteractionEvent('agent', 'system', EXPLAIN_AGENT_PROMPT));

    this.history.addEvent(
      new PromptInteractionEvent(
        PromptType.Question,
        'system',
        buildPromptDescriptor(PromptType.Question)
      )
    );

    const languages = options.projectInfo
      .map((info) => info.appmapConfig?.language)
      .filter(Boolean) as string[];
    const tokenCount = tokensAvailable();
    const vectorTerms = await this.vectorTermsService.suggestTerms(options.aggregateQuestion);

    const context = await this.lookupContextService.lookupContext(
      vectorTerms,
      tokenCount,
      options.contextLabels
    );
    const help = await this.lookupContextService.lookupHelp(languages, vectorTerms, tokenCount);

    LookupContextService.applyContext(context, help, this.applyContextService, tokenCount);
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
