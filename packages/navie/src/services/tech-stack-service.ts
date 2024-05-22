import { ChatOpenAI } from '@langchain/openai';
import OpenAI from 'openai';
import InteractionHistory, { TechStackEvent } from '../interaction-history';

const SYSTEM_PROMPT = `**Programming language and framework detector**

A software developer is asking a question about a project. Your task is to determine which
language and frameworks the user is referring to in their question.

# About you**

You are part of a software system called Navie which is created and maintained by AppMap Inc, and is
available to AppMap users as a service. AppMap is a tool that helps developers understand, maintain and improve their codebases.
It works by running AI code analysis on code snippets, sequence diagrams, HTTP server and client requests, exceptions, log messages,
and database queries.

## About the user

The user is a software developer who is working on a project. They are asking a question about the project.

## Classification categories

Your job is to list the programming languages and frameworks that are mentioned in the question.

**Response**

* language: Always respond with a list of programming languages that are mentioned in the question.
  If no programming languages match the question, respond with the word "unknown".

* frameworks: Optionally respond with a list of frameworks that are mentioned in the question.
  If no frameworks match the question, omit the frameworks.

**Examples**

- language: Ruby
  frameworks: [ Rails ]

- language: Python
  frameworks: [ Django ]

- language: JavaScript
  frameworks: [ React, Angular, Vue ]

- language: Java
  frameworks: [ Spring, "Spring Boot", Quarkus ]

If no languages or frameworks are mentioned, respond with the word "unknown".
`;

export default class TechStackService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public modelName: string,
    public temperature: number
  ) {}

  async detectTerms(question: string): Promise<string[]> {
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

    const stopWords = ['language', 'frameworks', 'unknown'];
    const terms = rawTerms
      .split(/\s+/)
      .map((term) => term.trim().toLowerCase())
      .map((term) => term.replace(/[^a-zA-Z0-9-]/g, ''))
      .filter((term) => !stopWords.includes(term))
      .filter(Boolean);
    this.interactionHistory.addEvent(new TechStackEvent(terms));
    return terms;
  }
}
