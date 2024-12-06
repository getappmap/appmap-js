/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import assert from 'node:assert';
import { warn } from 'node:console';
import { debug as makeDebug } from 'node:util';

import {
  ContextItemEvent,
  type InteractionEvent,
  PromptInteractionEvent,
} from '../interaction-history';
import InteractionState from '../interaction-state';
import type Message from '../message';
import { PromptType } from '../prompt';
import type CompletionService from '../services/completion-service';
import type ContextService from '../services/context-service';

export default class Gatherer {
  constructor(
    events: readonly InteractionEvent[],
    public completion: CompletionService,
    public context: ContextService
  ) {
    this.conversation = Gatherer.buildConversation(events);
  }

  conversation: Message[];
  async step(): Promise<boolean> {
    assert(!this.done);
    let result = '';
    for await (const token of this.completion.complete(this.conversation)) result += token;
    debug(`Received completion:\n${result}`);
    this.conversation.push({ role: 'assistant', content: result });
    const commands = extractCommands(result);
    // finish if we have no more commands or if !!finish is the only command;
    // some models want to finish immediately with a batch of commands
    // but then change their mind
    const onlyFinish = commands.length === 1 && commands[0] === '!!finish';
    if (commands.length > 0 && !onlyFinish)
      this.conversation.push({ role: 'user', content: await this.executeCommands(commands) });
    return this.done;
  }

  get done(): boolean {
    // step() will always add a user message unless it's done
    return this.conversation.at(-1)?.role === 'assistant';
  }

  async executeCommands(commands: string[]) {
    const result = await this.context.locationContext(
      commands.map(locationOfCommand).filter(isDefined)
    );
    let response = '';
    for (const event of result) {
      const location = event.location?.startsWith(event.directory ?? '')
        ? event.location
        : [event.directory, event.location].filter(Boolean).join('/');
      if (event.promptType === PromptType.CodeSnippet && event.location) {
        response += toCatOutput(location, event.content);
      } else if (event.promptType === PromptType.DirectoryListing && event.location) {
        const [path, depth] = splitDirDepth(location);
        response += toFindOutput(path, depth, event.content);
      }
    }
    response ||= 'No content found.';
    return response;
  }

  static buildConversation(events: readonly InteractionEvent[]): Message[] {
    let system = Gatherer.SYSTEM_PROMPT + '\n\n',
      context = '',
      commands = '',
      response = '';
    const result: Message[] = [];

    // I tried passing the code snippets from context search as cat commands multi-shot style
    // but the LLM seems to assume it must have known what it was doing and is obviously all done
    // (I'm leaving this here for now in case we find a way to make it work, but if not the whole
    // case in the conditional below can be removed) -divide
    const snippetsAsCat = false;

    for (const event of events)
      if (event instanceof PromptInteractionEvent && event.name !== PromptType.CodeSnippet) {
        // TBD: do we need the full prompts? All of them?
        if (event.name === 'agent') context += `<task>\n${event.content}\n</task>\n\n`;
        else if (event.role === 'system') system += '\n\n' + event.content;
        else if (event.role === 'user') context += toContext(event) + '\n';
      } else if (event instanceof ContextItemEvent) {
        // sometime the location is relative, sometimes absolute
        const location = event.location?.startsWith(event.directory ?? '')
          ? event.location
          : [event.directory, event.location].filter(Boolean).join('/');
        if (event.promptType === PromptType.CodeSnippet && event.location && snippetsAsCat) {
          // this case is currently disabled, see the comment above
          commands += `!!cat ${location}\n`;
          response += toCatOutput(location, event.content);
        } else if (event.promptType === PromptType.DirectoryListing && event.location) {
          const [path, depth] = splitDirDepth(location);
          commands += `!!find ${path} -depth ${depth}\n`;
          response += toFindOutput(path, depth, event.content);
        } else {
          context += toContext(event) + '\n';
        }
      }
    if (system) result.push({ role: 'system', content: system });
    if (context)
      result.push({
        role: 'user',
        content: `${Gatherer.USER_PROMPT}\n\n<context>\n${context}\n</context>`,
      });
    if (commands)
      result.push({ role: 'assistant', content: commands }, { role: 'user', content: response });

    return result;
  }

  static readonly SYSTEM_PROMPT = `\
You are a helper for an AI agent. Your task is to gather all the information about a software project (such as relevant file contents)
that the agent will need to perform its task accurately and without any guesswork.

You will consider the context provided, which may include information about the task and about the software project
and think about what else might be missing that's needed to perform the task. Remember, the agent will complete the task
based only on the information provided, so make extra sure it's complete. For example, if the task will require modifying a file,
make sure to check if the file exists and verify its contents.

To gather the information, respond with the following commands:
!!find <path> [-depth <depth>]
!!cat <path>[:<start-line>[-<end-line>]]

If you don't need any further information, respond with !!finish on a single line.
Remember, it's not your job to address the question, just to gather the information. Be thorough.`;

  static readonly USER_PROMPT = `Please help me gather information about a software project for an AI agent accomplish a task, based on the following context.`;
}

function toContext(event: InteractionEvent): string {
  const state = new InteractionState();
  event.updateState(state);
  // TBD: maybe not pass the full items? But some context items definitely
  // need to be passed in full (such as the user query) and even code snippets
  // and diagrams can be informative (eg. to hunt down imports)
  if (state.messages.length === 1) return state.messages[0].content;

  warn(`Context item has multiple messages: ${event.type}`);
  return '';
}

function toCatOutput(location: string, content: string): string {
  const startingLine = Number(location.split(':').pop()?.split('-').shift()) || 1;
  return (
    `Here's the output of \`cat -n ${location}\`:\n` + numberLines(content, startingLine) + '\n\n'
  );
}

function toFindOutput(path: string, depth: number, content: string): string {
  const prefix = `Here's the list of files and directories in ${path} up to the depth of ${depth}\`:\n`;
  return prefix + content + '\n\n';
}

function splitDirDepth(location: string): [string, number] {
  const parts = location.split(':');
  const depth = Number(parts.at(-1));
  if (isNaN(depth)) return [location, 0];
  else return [parts.slice(0, -1).join(':'), depth];
}

function numberLines(content: string, startingLine = 1): string {
  return content
    .split('\n')
    .map((line, index) => `${rightJustify(String(index + startingLine), 6)}\t${line}`)
    .join('\n');
}

function rightJustify(text: string, width: number): string {
  return ' '.repeat(Math.max(width - text.length, 0)) + text;
}

function extractCommands(text: string): string[] {
  return text.split('\n').filter((line) => line.startsWith('!!'));
}

function locationOfCommand(command: string): string | undefined {
  let match;
  if ((match = /^!!cat (.*)/.exec(command))) return match[1];
  if ((match = /^!!find (.*?)( -depth (\d+))?$/.exec(command)))
    return `${match[1]}:${match[3] || 0}`;
}

function isDefined<T>(x: T): x is Exclude<T, undefined> {
  return !!x;
}

const debug = makeDebug('appmap:navie:gatherer');
