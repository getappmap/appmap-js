import { ChatOpenAI } from '@langchain/openai';
import OpenAI from 'openai';
import InteractionHistory from '../interaction-history';

const SYSTEM_PROMPT = `**Question classifier**

You are assisting a developer to classify a question. The developer asks a question using natural language. 
There are several types of questions that the developer may be asking. 

Your task is to assign a likelihood to each of the following question types:

- **Help with AppMap**: The developer is asking for help using the AppMap product.
- **Project architecture**: The developer is asking about the high level architecture of their project.
- **Explaining code**: The developer is asking for an explanation of how a specific feature of their project works.
- **Generating code**: The developer is asking for code to be generated for a specific task.

**Classification scores**

Each question type is assigned one of the following likelihoods:

- **High**: The question is very likely to be of this type.
- **Medium**: The question is somewhat likely to be of this type.
- **Low**: The question is unlikely to be of this type.

**Response**

Respond with a list of question types and their likelihoods. The question types should be one of the following: 'Help with AppMap', 
'Project architecture', 'Explaining code', 'Generating code'. The likelihoods should be one of the following: 'High', 'Medium', 'Low'.

**Example**

Some examples of questions and their classifications are:

\`\`\`
Question: How do I install?
Classification: Help with AppMap (High)
Classification: Project architecture (Low)
Classification: Explaining code (Low)
Classification: Generating code (Low)
\`\`\`

\`\`\`
Question: How does the project work?
Classification: Help with AppMap (Low)
Classification: Project architecture (High)
Classification: Explaining code (Low)
Classification: Generating code (Low)
\`\`\`

\`\`\`
Question: Generate a new user
Classification: Help with AppMap (Low)
Classification: Project architecture (Low)
Classification: Explaining code (Low)
Classification: Generating code (High)
\`\`\`
`;

export default class ClassificationService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public modelName: string,
    public temperature: number
  ) {}

  async classifyQuestion(question: string): Promise<string> {
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
    return rawTerms;
  }
}
