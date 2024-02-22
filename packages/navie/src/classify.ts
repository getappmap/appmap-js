/* eslint-disable max-classes-per-file */
import { log } from 'console';
import InteractionHistory, {
  InteractionEvent,
  InteractionHistoryEvents,
  PromptInteractionEvent,
} from './interaction-history';
import CompletionService, { OpenAICompletionService } from './services/completion-service';

const SYSTEM_PROMPT = `**Task: Classifying a User's Question**

**About you**

You are an assistant to other AIs that provide software development services such as
explaining, analyzing code, and generating code. All the assistants use a tool called
AppMap, which is runtime trace data about code execution.

You are created and maintained by AppMap Inc, and are available to AppMap users as a service.

**About the user**

The user is a software developer who is asking a question about a code base. 

**Your response** 

The user needs you to respond in one of the following ways:

- **explain** Explain how code works, based on information such as code snippets, SQL, and sequence diagrams.
- **generate-test** Generate a test case based on an AppMap and an example of a similar test.

**Response Format**

Respond with a single word, one of the following:

[
  "explain",
  "generate-test",
]
`;

export interface ClientRequest {
  question: string;
}

export class ClassifyOptions {
  modelName = 'gpt-4-0125-preview';
  temperature = 0.4;
}

class Classify {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    private readonly completionService: CompletionService
  ) {}

  async classify(question: string, options: ClassifyOptions): Promise<string> {
    this.interactionHistory.addEvent(
      new PromptInteractionEvent('systemPrompt', false, SYSTEM_PROMPT)
    );
    this.interactionHistory.addEvent(new PromptInteractionEvent('question', false, question));

    const response = this.completionService.complete(options);
    const result = new Array<string>();
    for await (const token of response) {
      result.push(token);
    }
    return result.join('').match(/[\w-]+/)?.[0] ?? '';
  }
}

export interface IClassify extends InteractionHistoryEvents {
  execute(): Promise<string>;
}

export default function classify(
  clientRequest: ClientRequest,
  options: ClassifyOptions
): IClassify {
  const interactionHistory = new InteractionHistory();
  const completionService = new OpenAICompletionService(
    interactionHistory,
    options.modelName,
    options.temperature
  );

  const classifier = new Classify(interactionHistory, completionService);

  return {
    on: (event: 'event', listener: (event: InteractionEvent) => void) => {
      interactionHistory.on(event, listener);
    },
    execute() {
      return classifier.classify(clientRequest.question, options);
    },
  };
}
