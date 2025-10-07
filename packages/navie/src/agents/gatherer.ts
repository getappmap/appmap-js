/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import assert from 'node:assert';
import { warn } from 'node:console';
import { debug as makeDebug } from 'node:util';

import InteractionHistory, {
  ContextItemEvent,
  ContextItemRequestor,
  type InteractionEvent,
  PromptInteractionEvent,
} from '../interaction-history';
import InteractionState from '../interaction-state';
import type Message from '../message';
import { buildPromptDescriptor, PromptType } from '../prompt';
import type CompletionService from '../services/completion-service';
import type ContextService from '../services/context-service';
import ProjectInfoService from '../services/project-info-service';

export default class Gatherer {
  constructor(
    events: readonly InteractionEvent[],
    public readonly interactionHistory: InteractionHistory,
    public readonly completion: CompletionService,
    public readonly context: ContextService,
    public readonly projectInfoService: ProjectInfoService
  ) {
    this.conversation = Gatherer.buildConversation(events);
  }

  conversation: Message[];
  async step(): Promise<boolean> {
    assert(!this.done);
    let result = '';
    for await (const token of this.completion.complete(this.conversation, {
      onContextOverflow: 'throw',
    }))
      result += token;
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
    // Use sets to deduplicate locations and search terms.
    // Sometimes models get confused and ask for the same file multiple times.
    const locations = new Set<string>();
    const terms = new Set<string>();
    let obtainDiff = false;
    let badCommand = false;

    for (const cmd of commands) {
      if (cmd.startsWith('!!find') || cmd.startsWith('!!cat')) {
        const location = locationOfCommand(cmd);
        if (!location) badCommand = true;
        else locations.add(location);
      } else if (cmd.startsWith('!!search')) {
        const searchTerms = searchTermsOfCommand(cmd);
        if (!searchTerms) badCommand = true;
        else searchTerms.forEach(term => terms.add(term));
      } else if (cmd === '!!diff') {
        obtainDiff = true;
      } else if (cmd === '!!finish') continue;
      else badCommand = true;
    }

    let response = '';

    if (obtainDiff) {
      const projectInfo = await this.projectInfoService.lookupProjectInfo(true);
      for (const info of projectInfo) {
        const { diff } = info;
        if (diff) {
          this.interactionHistory.addEvent(
            new PromptInteractionEvent(
              PromptType.Diff,
              'system',
              buildPromptDescriptor(PromptType.Diff)
            )
          );

          this.interactionHistory.addEvent(
            new ContextItemEvent(PromptType.Diff, ContextItemRequestor.ProjectInfo, diff)
          );

          response += toDiffOutput(diff);
        }
      }
    }

    if (locations.size > 0 || terms.size > 0) {
      for (const event of await this.context.searchContextWithLocations(
        ContextItemRequestor.Gatherer,
        Array.from(terms),
        Array.from(locations)
      )) {
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
    }
    if (badCommand) response += '\n\n' + Gatherer.COMMANDS;
    return response;
  }

  static buildConversation(events: readonly InteractionEvent[]): Message[] {
    let system = Gatherer.SYSTEM_PROMPT + '\n\n',
      context = '',
      commands = '',
      response = '';
    const result: Message[] = [];

    // I'm on the fence about this. Sometimes including the code snippets as cat commands multi-shot style
    // causes the LLM to assume it must have known what it was doing and is obviously all done.
    // On the other hand if pinned files are passed as context snippets it causes the gatherer
    // to re-request them. There might be a middle ground here (eg. only !!catting pinned files,
    // representing search results with !!search command). -divide
    const snippetsAsCat = true;

    // Seems to work fine without all the prompts. Leaving this here in case we want to switch.
    // Maybe a more granular approach would work even better (ie. including only some prompts).
    const includePrompts = false;

    for (const event of events) {
      if (event instanceof PromptInteractionEvent && event.name !== PromptType.CodeSnippet) {
        if (event.name === 'agent' && includePrompts)
          context += `<task>\n${event.content}\n</task>\n\n`;
        else if (event.role === 'system' && includePrompts) system += '\n\n' + event.content;
        else if (event.role === 'user') {
          if (event.name === PromptType.Question)
            context += `<user-question>\n${event.content}\n</user-question>\n\n`;
          else context += toContext(event) + '\n';
        }
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
        } else if (event.promptType == PromptType.Diff) {
          commands += '!!diff\n';
          response += toDiffOutput(event.content);
        } else if (
          event.promptType === PromptType.AppMapConfig ||
          event.promptType === PromptType.AppMapStats ||
          event.promptType === PromptType.CodeEditor
        )
          // ignore things irrelevant for context gathering
          continue;
        else context += toContext(event) + '\n';
      }
    }
    if (system) result.push({ role: 'system', content: system });
    if (context)
      result.push({
        role: 'user',
        content: [Gatherer.USER_PROMPT, `<context>\n${context}\n</context>`].join('\n\n'),
      });
    if (commands)
      result.push({ role: 'assistant', content: commands }, { role: 'user', content: response });

    return result;
  }

  static readonly COMMANDS = `\
  Supported commands:
  !!find <path> [-depth <depth>]
  !!cat <path>[:<start-line>[-<end-line>]]
  !!search <terms>
  !!diff
  !!finish
`;

  static readonly SYSTEM_PROMPT = `\
You are a helper for an AI agent. Your task is to gather all the information about a software project (such as relevant file contents)
that the agent will need to perform its task accurately and without any guesswork.

You will consider the context provided, which may include information about the task and about the software project
and think about what else might be missing that's needed to perform the task. Remember, the agent will complete the task
based only on the information provided, so make extra sure it's complete. For example, if the task will require modifying a file,
make sure to check if the file exists and verify its contents. If the task requires knowledge of the
work-in-progress of a task, make sure to obtain the latest changes in the project.

To gather the information, respond with the following commands:
!!find <path> [-depth <depth>]
!!cat <path>[:<start-line>[-<end-line>]]

You can also do a full-text search using:
!!search <search terms>

You can also request a diff of the project code on the current branch using:
!!diff

When you're done, simply respond with !!finish on a single line.
All the information gathered will be passed to the agent so you don't need to repeat or summarize it.

Respond with commands ONLY.`;

  static readonly USER_PROMPT = `\
Please help me gather information about a software project for an AI agent accomplish a task, based on the following context.
DO NOT answer the question; the information you gather will be automatically used to answer the question later.

When no more information is required, respond with !!finish ONLY.

If the question is generic and unrelated to the user's project, just finish.`;
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

function toDiffOutput(diff: string): string {
  return `Here's the diff of the project:\n${diff}\n\n`;
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

function searchTermsOfCommand(command: string): string[] | undefined {
  let match;
  if ((match = /^!!search (.*)/.exec(command))) return match[1].split(' ');
}

const debug = makeDebug('appmap:navie:gatherer');
