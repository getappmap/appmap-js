import InteractionHistory, { ClassificationEvent } from '../interaction-history';
import Message from '../message';
import { ContextV2 } from '../context';
import { ChatHistory } from '../navie';
import CompletionService from './completion-service';

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

Your task is to assign a likelihood to question categories.

Choose exactly one from the following "Modes":

- **greeting**: The developer is saying hello to the assistant. The response will also be a greeting.
- **explain**: The developer is asking for an explanation of code behavior. The response will be
  a combination of text, diagrams, and code.
- **plan**: The developer is developing a plan to solve a code issue. The response will be
  an analysis of the issue, along with a plan to solve it.
- **troubleshoot**: The developer is asking for help troubleshooting an issue. The response will
  be a combination of text, diagrams, and code.
- **generate-code**: The developer is asking to generate code for a specific task. The response
  will be code files and snippets.
- **generate-diagram**: The developer is asking for a diagram of their code. The response will
  be one or more diagrams.
- **help-with-appmap**: Help using the AppMap product. The response will be an explanation of how to
  use AppMap, along with links to documentation.

Choose exactly one from the following "Scopes":

- **architecture**: The developer is asking about the high-level architecture of the project.
- **feature**: The developer is asking for an explanation of how a specific feature of the project
  works.
- **overview**: The developer is asking a high-level question about the structure, purpose,
  functionality or intent of the project.

## Classification scores

Each classification category is assigned one of the following likelihoods:

- **high**: The question is very likely to be of this type.
- **medium**: The question is somewhat likely to be of this type.
- **low**: The question is unlikely to be of this type.

**Response**

Respond with a "Mode" and "Scope", and the likelihood of each one. 

**Examples**

Some examples of questions and their classifications are:

\`\`\`yaml
- question: Hi
  answer:
    greeting: high

- question: How do I record AppMap data of my Spring app?
  answer:
    help-with-appmap: high
    architecture: medium

- question: How do I reduce the amount of data in my AppMaps?
  answer:
    help-with-appmap: high
    troubleshoot: medium

- question: How does the project work?
  answer:
    explain: high
    architecture: high

- question: Generate a form and controller to update the user profile
  answer:
    generate-code: high
    feature: high

- question: Why am I getting a 500 error?
  answer:
    troubleshoot: high
    feature: medium

- question: Generate a diagram of the user profile feature
  answer:
    generate-diagram: high
    feature: high

- question: Class map of the user profile feature
  answer:
    generate-diagram: high
    feature: high

- question: Sequence diagram
  answer:
    generate-diagram: high
    overview: high

- question: ERD of users
  answer:
    generate-diagram: high
    architecture: high
\`\`\`

`;

export default class ClassificationService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public readonly completion: CompletionService
  ) {}

  async classifyQuestion(
    question: string,
    chatHistory?: ChatHistory
  ): Promise<ContextV2.ContextLabel[]> {
    const allQuestions = [
      ...(chatHistory || [])
        .filter((message) => message.role === 'user')
        .map((message) => message.content),
      question,
    ]
      .filter(Boolean)
      .join('\n\n');

    const messages: Message[] = [
      {
        content: SYSTEM_PROMPT,
        role: 'system',
      },
      {
        content: allQuestions,
        role: 'user',
      },
    ];

    const response = this.completion.complete(messages);
    const tokens = Array<string>();
    for await (const token of response) {
      tokens.push(token);
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
