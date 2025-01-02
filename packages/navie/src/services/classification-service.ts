import { debug as makeDebug } from 'node:util';

import z from 'zod';

import InteractionHistory, { ClassificationEvent } from '../interaction-history';
import getMostRecentMessages from '../lib/get-most-recent-messages';
import { assertNever, type TypeDifference } from '../lib/type-tools';
import Message from '../message';
import { ContextV2 } from '../context';
import { ChatHistory } from '../navie';
import CompletionService from './completion-service';

const debug = makeDebug('appmap:navie:classification-service');

const MODES = {
  greeting: 'The developer is saying hello to the assistant. The response will also be a greeting.',
  explain:
    'The developer is asking for an explanation of code behavior. The response will be a combination of text, diagrams, and code.',
  plan: 'The developer is developing a plan to solve a code issue. The response will be an analysis of the issue, along with a plan to solve it.',
  troubleshoot:
    'The developer is asking for help troubleshooting an issue. The response will be a combination of text, diagrams, and code.',
  'generate-code':
    'The developer is asking to generate code for a specific task. The response will be code files and snippets.',
  'generate-diagram':
    'The developer is asking for a diagram of their code. The response will be one or more diagrams.',
  'help-with-appmap':
    'Help using the AppMap product. The response will be an explanation of how to use AppMap, along with links to documentation.',
  chatting:
    'The developer is chatting with the AppMap AI. The response will be a conversation with the AI.',
};

const SCOPES = {
  architecture: 'The developer is asking about the high-level architecture of the project.',
  feature:
    'The developer is asking for an explanation of how a specific feature of the project works.',
  overview:
    'The developer is asking a high-level question about the structure, purpose, functionality or intent of the project.',
};

const LABELS = { ...MODES, ...SCOPES };

// make sure all the labels are handled (this will fail to typecheck if not)
void assertNever<TypeDifference<keyof typeof LABELS, `${ContextV2.ContextLabelName}`>>();

const SCORES = {
  high: 'The question is very likely to be of this type.',
  medium: 'The question is somewhat likely to be of this type.',
  low: 'The question is unlikely to be of this type.',
};

void assertNever<TypeDifference<keyof typeof SCORES, `${ContextV2.ContextLabelWeight}`>>();

const SYSTEM_PROMPT = `**Question classifier**

A software developer is asking a question about a project. Your task is to classify their MOST RECENT
question into one or more categories given the context of the conversation. Assume that the classification
assignment will determine what kind of response the AI will provide.


# About you

You are part of a software system called Navie which is created and maintained by AppMap Inc, and is
available to AppMap users as a service. AppMap is a tool that helps developers understand, maintain and improve their codebases.
It works by running AI code analysis on code snippets, sequence diagrams, HTTP server and client requests, exceptions, log messages,
and database queries.

# About the user

The user is a software developer who is working on a project. They are asking a question about the project.

# Classification categories

Your task is to assign a question to categories.

Choose exactly one from the following "Modes":
${toDescriptionList(MODES)}

Choose at most one from the following "Scopes":
${toDescriptionList(SCOPES)}

Use the following "Scores" to describe how likely a question is to be of a given category:
${toDescriptionList(SCORES)}

# Examples

question: Hi
answer: { "greeting": "high" }

question: How do I record AppMap data of my Spring app?
answer: {
  "help-with-appmap": "high",
  "architecture": "medium"
}

question: How do I reduce the amount of data in my AppMaps?
answer: {
  "help-with-appmap": "high",
  "troubleshoot": "medium"
}

question: How does the project work?
answer: {
  "explain": "high",
  "architecture": "high"
}

question: Generate a form and controller to update the user profile
answer: {
  "generate-code": "high",
  "feature": "high"
}

question: Why am I getting a 500 error?
answer: {
  "troubleshoot": "high",
  "feature": "medium"
}

question: Generate a diagram of the user profile feature
answer: {
  "generate-diagram": "high",
  "feature": "high"
}

question: Class map of the user profile feature
answer: {
  "generate-diagram": "high",
  "feature": "high"
}

question: Sequence diagram
answer: {
  "generate-diagram": "high",
  "overview": "high"
}

question: ERD of users
answer: {
  "generate-diagram": "high",
  "architecture": "high"
}

question: ok thanks
answer: { "chatting": "high" }

`;

function toDescriptionList(entries: Record<string, string>): string {
  return Object.entries(entries)
    .map(([key, value]) => `* ${key}: ${value}`)
    .join('\n');
}

export default class ClassificationService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public readonly completion: CompletionService
  ) {}

  async classifyQuestion(
    question: string,
    chatHistory?: ChatHistory
  ): Promise<ContextV2.ContextLabel[]> {
    const messages: Message[] = [
      {
        content: SYSTEM_PROMPT,
        role: 'system',
      },
      ...getMostRecentMessages(chatHistory ?? [], 2),
      {
        content: question,
        role: 'user',
      },
    ];

    const schema = z.record(
      z.enum(Object.keys(LABELS) as [string, ...string[]]),
      z.enum(Object.keys(SCORES) as [string, ...string[]])
    );

    const response = await this.completion.json(messages, schema, {
      model: this.completion.miniModelName,
      maxRetries: 1,
    });

    debug('Classification response: %s', response);

    const labels: ContextV2.ContextLabel[] = response
      ? Object.entries(response).map(([key, value]) => ({
          name: key as ContextV2.ContextLabelName,
          weight: value as ContextV2.ContextLabelWeight,
        }))
      : [];

    this.interactionHistory.addEvent(new ClassificationEvent(labels));
    return labels;
  }
}
