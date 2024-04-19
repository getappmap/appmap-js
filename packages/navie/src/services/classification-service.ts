import { ChatOpenAI } from '@langchain/openai';
import OpenAI from 'openai';
import InteractionHistory from '../interaction-history';
import { ContextV2 } from '../context';

const SYSTEM_PROMPT = `**Question classifier**

You are assisting a developer to classify a question. The developer asks a question using natural language. 
There are several types of questions that the developer may be asking. 

Your task is to assign a likelihood to each of the following question types:

- **help-with-appmap**: The developer is asking for help using the AppMap product.
- **architecture**: The developer is asking about the architecture of the project.
- **feature**: The developer is asking for an explanation of how a specific feature of the project works.
- **overview**: The developer is asking a high-level question about the structure, purpose,
  functionality or intent of the project.
- **troubleshoot**: The developer is asking for help troubleshooting an issue.
- **explain**: The developer is asking for an explanation of a specific piece of code or functionality.
- **generate**: The developer is asking for code to be generated for a specific task.

**Classification scores**

Each question type is assigned one of the following likelihoods:

- **high**: The question is very likely to be of this type.
- **medium**: The question is somewhat likely to be of this type.
- **low**: The question is unlikely to be of this type.

**Response**

Respond with the likelihood of each question type. Question types with "low" likelihood may
be omitted.

**Examples**

Some examples of questions and their classifications are:

\`\`\`
question: How do I record AppMap data of my Spring app?
classification:
  - help-with-appmap: high
  - architecture: low
  - feature: low
  - overview: low
  - troubleshoot: low
  - explain: low
  - generate: low
\`\`\`

\`\`\`
question: How does the project work?
classification:
  - help-with-appmap: low
  - architecture: high
  - feature: low
  - overview: high
  - troubleshoot: low
  - explain: low
  - generate: low
\`\`\`

\`\`\`
question: Generate a form and controller to update the user profile
classification:
  - help-with-appmap: low
  - architecture: medium
  - feature: high
  - overview: low
  - explain: low
  - generate: high
\`\`\`

\`\`\`
question: Why am I getting a 500 error?
classification:
  - help-with-appmap: low
  - architecture: low
  - feature: low
  - overview: low
  - troubleshoot: high
  - explain: medium
  - generate: low
\`\`\`


`;

export default class ClassificationService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public modelName: string,
    public temperature: number
  ) {}

  async classifyQuestion(question: string): Promise<ContextV2.ContextLabel[]> {
    const openAI: ChatOpenAI = new ChatOpenAI({
      modelName: this.modelName,
      temperature: this.temperature,
    });

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        content: SYSTEM_PROMPT,
        role: 'system',
      },
      {
        content: question,
        role: 'user',
      },
    ];

    // eslint-disable-next-line no-await-in-loop
    const response = await openAI.completionWithRetry({
      messages,
      model: openAI.modelName,
      stream: true,
    });
    const tokens = Array<string>();
    // eslint-disable-next-line no-await-in-loop
    for await (const token of response) {
      tokens.push(token.choices.map((choice) => choice.delta.content).join(''));
    }
    const rawTerms = tokens.join('');

    const lines = rawTerms.split('\n');
    const classification: (ContextV2.ContextLabel | null)[] = lines
      .map((line) => {
        if (!line.trim()) return null;

        const match = line.match(/([\w-]+)\s*:\s*(\w+)/);
        if (!match) return null;

        return {
          name: match[1],
          weight: match[2],
        };
      })
      .filter((item) => item);

    return classification as ContextV2.ContextLabel[];
  }
}
