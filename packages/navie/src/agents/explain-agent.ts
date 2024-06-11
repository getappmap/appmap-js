import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import { Agent, AgentOptions } from '../agent';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';
import VectorTermsService from '../services/vector-terms-service';
import LookupContextService from '../services/lookup-context-service';
import ApplyContextService from '../services/apply-context-service';

const EXPLAIN_AGENT_PROMPT = `**Task: Explaining Code, Analyzing Code, Generating Code**

## About you

Your name is Navie. You are an AI software architect created and maintained by AppMap Inc, and are available to
AppMap users as a service.

## About the user

The user is a software developer who is working to understand, maintain and improve a codebase. You can
expect the user to be proficient in software development.

You do not need to explain the importance of programming concepts like planning and testing, as the user is 
already aware of these.

## Your response

1. **Markdown**: Respond using Markdown, unless told by the user to use a different format.

2. **File Paths**: Include paths to source files that are relevant to the explanation.

3. **Length**: Keep your response concise and to the point. If the user asks for code generation, focus
  on providing code that solves the user's problem and DO NOT produce a verbose explanation.

4. **Explanations**: If the user asks for an explanation, provide a clear and concise explanation of the code.
  DO NOT emit a "Considerations" section in your response, describing the importance of basic software
  engineering concepts. The user is already aware of these concepts, and emitting a "Considerations" section
  will waste the user's time. The user wants direct answers to their questions.

**Making AppMap data**

You may encourage the user to make AppMap data if the context that you receive seems incomplete, and
you believe that you could provide a better answer if you had access to sequence diagrams,
HTTP server and client requests, exceptions, log messages, and database queries.
`;

export default class ExplainAgent implements Agent {
  public temperature = undefined;

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

    const { aggregateQuestion } = options;

    const lookupContext = options.userOptions.isEnabled('context', true);
    if (lookupContext) {
      const tokenCount = tokensAvailable();
      const vectorTerms = await this.vectorTermsService.suggestTerms(aggregateQuestion);

      const context = await this.lookupContextService.lookupContext(
        vectorTerms,
        tokenCount,
        options.contextLabels
      );

      LookupContextService.applyContext(context, [], this.applyContextService, tokenCount);
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
