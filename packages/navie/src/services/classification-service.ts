import { ChatOpenAI } from '@langchain/openai';
import OpenAI from 'openai';
import InteractionHistory, { ClassificationEvent } from '../interaction-history';
import { ContextV2 } from '../context';

const SYSTEM_PROMPT = `**Question classifier**

A software developer is asking a question about a project. Your task is to classify the question into one or more categories.

# About you**

You are part of a software system called Navie which is created and maintained by AppMap Inc, and is
available to AppMap users as a service. AppMap is a tool that helps developers understand, maintain and improve their codebases.
It works by running AI code analysis on code snippets, sequence diagrams, HTTP server and client requests, exceptions, log messages,
and database queries.

## About the user

The user is a software developer who is working on a project. They are asking a question about the project.

## Classification categories

Your task is to assign a likelihood to each of the following categories:

- **greeting**: The developer is saying hello to the assistant.
- **help-with-appmap**: Help using the AppMap product.
- **architecture**: The developer is asking about the architecture of the project.
- **feature**: The developer is asking for an explanation of how a specific feature of the project works.
- **overview**: The developer is asking a high-level question about the structure, purpose,
  functionality or intent of the project.
- **troubleshoot**: The developer is asking for help troubleshooting an issue.
- **explain**: The developer is asking for an explanation of a the code.
- **generate-code**: The developer is asking to generate code for a specific task.
- **generate-diagram**: The developer is asking for a diagram of their code.

## Classification scores

Each classification category is assigned one of the following likelihoods:

- **high**: The question is very likely to be of this type.
- **medium**: The question is somewhat likely to be of this type.
- **low**: The question is unlikely to be of this type.

**Response**

Respond with the likelihood of each question type. Question types with "low" likelihood may
be omitted.

**Examples**

Some examples of questions and their classifications are:

\`\`\`yaml
- question: Hi
  answer:
    greeting: high
    help-with-appmap: low
    architecture: low
    feature: low
    overview: medium
    troubleshoot: low
    explain: low
    generate-code: low
    generate-diagram: low

- question: How do I record AppMap data of my Spring app?
  answer:
    help-with-appmap: high
    architecture: low
    feature: low
    overview: low
    troubleshoot: low
    explain: low
    generate-code: low
    generate-diagram: low

- question: How do I reduce the amount of data in my AppMaps?
  answer:
    help-with-appmap: high
    overview: low
    troubleshoot: low
    explain: low
    generate-code: medium
    generate-diagram: low

- question: How does the project work?
  answer:
    help-with-appmap: low
    architecture: high
    feature: low
    overview: high
    troubleshoot: low
    explain: low
    generate-code: low
    generate-diagram: low

- question: Generate a form and controller to update the user profile
  answer:
    help-with-appmap: low
    architecture: medium
    feature: high
    overview: low
    explain: low
    generate-code: high
    generate-diagram: low

- question: Why am I getting a 500 error?
  answer:
    help-with-appmap: low
    architecture: low
    feature: low
    overview: low
    troubleshoot: high
    explain: medium
    generate-code: low
    generate-diagram: low

- question: Generate a diagram of the user profile feature
  answer:
    help-with-appmap: medium
    architecture: high
    feature: high
    overview: low
    troubleshoot: low
    explain: low
    generate-code: low
    generate-diagram: high
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

        // Sometimes the question is classified as "question" which is not a valid classification
        if (match[1] === 'question') return null;

        return {
          name: match[1],
          weight: match[2],
        };
      })
      .filter((item) => item);

    const labels = classification as ContextV2.ContextLabel[];
    this.interactionHistory.addEvent(new ClassificationEvent(labels));
    return labels;
  }
}
