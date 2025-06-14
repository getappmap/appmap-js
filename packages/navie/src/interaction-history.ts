/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import EventEmitter from 'events';
import InteractionState from './interaction-state';
import { ContextV2 } from './context';
import { PROMPTS, PromptType } from './prompt';
import { CHARACTERS_PER_TOKEN } from './message';
import { HelpDoc } from './help';
import { AgentMode } from './agent';

const SNIPPET_LENGTH = 800;

function contentSnippet(content: string, maxLength = SNIPPET_LENGTH): string {
  if (content.length < maxLength) return content;

  return `${content.slice(0, maxLength)}... (${content.length})`;
}

export abstract class InteractionEvent {
  constructor(public type: string) {}

  abstract get metadata(): Record<
    string,
    string | number | boolean | string[] | Record<string, string>
  >;

  abstract get message(): string;

  abstract updateState(state: InteractionState): void;
}

export function isPromptEvent(event: InteractionEvent): event is PromptInteractionEvent {
  return event.type === 'prompt';
}

export class AgentSelectionEvent extends InteractionEvent {
  constructor(public agent: AgentMode) {
    super('agentSelection');
  }

  get metadata() {
    return {
      type: this.type,
      agent: this.agent,
    };
  }

  get message() {
    return `[agentSelection] ${this.agent}`;
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  updateState(_state: InteractionState) {}
}

export class ClassificationEvent extends InteractionEvent {
  constructor(public classification: ContextV2.ContextLabel[]) {
    super('classification');
  }

  get metadata() {
    return {
      type: this.type,
      classification: this.classification.map((label) => `${label.name}=${label.weight}`),
    };
  }

  get message() {
    return `[classification] ${this.classification
      .map((label) => `${label.name}=${label.weight}`)
      .join(', ')}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  updateState(_state: InteractionState) {}
}

export class PromptInteractionEvent extends InteractionEvent {
  constructor(
    public name: PromptType | string,
    public role: 'user' | 'assistant' | 'system',
    public content: string,
    public prefix?: string
  ) {
    super('prompt');
  }

  get metadata() {
    return {
      type: this.type,
      role: this.role,
      name: this.name,
    };
  }

  get message() {
    return `[prompt] ${this.role}: ${contentSnippet(this.fullContent)}`;
  }

  get fullContent(): string {
    return [this.prefix, this.content].filter(Boolean).join(' ');
  }

  updateState(state: InteractionState) {
    state.messages.push({ content: this.fullContent, role: this.role });
  }
}

export class VectorTermsInteractionEvent extends InteractionEvent {
  constructor(public terms: string[]) {
    super('vectorTerms');
  }

  get metadata() {
    return {
      type: this.type,
      termCount: this.terms.length,
    };
  }

  get message() {
    return `[vectorTerms] ${this.terms.join(' ')}`;
  }

  updateState(state: InteractionState) {
    for (const term of this.terms) state.vectorTerms.push(term);
  }
}

export class CompletionEvent extends InteractionEvent {
  constructor(public model: string, public temperature: number) {
    super('completion');
  }

  get metadata() {
    return {
      type: this.type,
      model: this.model,
      temperature: this.temperature,
    };
  }

  get message() {
    return `[completion] ${this.model} ${this.temperature}`;
  }

  updateState(state: InteractionState) {
    state.completionModel = this.model;
    state.completionTemperature = this.temperature;
  }
}

export class ContextLookupEvent extends InteractionEvent {
  constructor(public context: ContextV2.ContextResponse | undefined) {
    super('contextLookup');
  }

  get contextAvailable() {
    return !!this.context;
  }

  get metadata() {
    return {
      type: this.type,
      contextAvailable: this.contextAvailable,
    };
  }

  get message() {
    if (!this.context) return `[contextLookup] not found`;

    const countByItemType = this.context.reduce((acc, item) => {
      acc.set(item.type, (acc.get(item.type) ?? 0) + 1);
      return acc;
    }, new Map<ContextV2.ContextItemType, number>());
    const countByItemTypeStr = Array.from(countByItemType.entries())
      .map((entry) => `${entry[1]} ${entry[0]}`)
      .join(', ');

    return `[contextLookup] ${countByItemTypeStr}`;
  }

  updateState(state: InteractionState) {
    state.contextAvailable = this.context;
  }
}

export class HelpLookupEvent extends InteractionEvent {
  constructor(public help: HelpDoc[] | undefined) {
    super('helpLookup');
  }

  get helpAvailable() {
    return !!this.help;
  }

  get metadata() {
    return {
      type: this.type,
      helpAvailable: this.helpAvailable,
    };
  }

  get message() {
    if (!this.help) return `[helpLookup] not found`;

    return `[helpLookup] ${this.help.length} items`;
  }

  updateState(state: InteractionState) {
    state.helpAvailable = this.help;
  }
}

export enum ContextItemRequestor {
  Gatherer = 'gatherer',
  Memory = 'memory',
  Mentions = 'mentions',
  PinnedFile = 'pinnedFile',
  ProjectInfo = 'projectInfo',
  Terms = 'terms',
}

export class ContextItemEvent extends InteractionEvent {
  constructor(
    public promptType: PromptType,
    public requestor: ContextItemRequestor,
    public content: string,
    public location?: string | undefined,
    public directory?: string | undefined
  ) {
    super('contextItem');
  }

  get promptPrefix() {
    return PROMPTS[this.promptType].tagName;
  }

  get metadata() {
    const result: Record<string, string> = {
      type: this.type,
      promptType: this.promptType,
    };
    if (this.location) result.location = this.location;

    return result;
  }

  get message() {
    return [
      `[${this.promptPrefix}]`,
      this.location ? `${this.location}: ` : undefined,
      contentSnippet(this.content),
    ]
      .filter(Boolean)
      .join(' ');
  }

  updateState(state: InteractionState) {
    if (this.requestor === ContextItemRequestor.PinnedFile) {
      // There's no need to include the content of pinned files in the system prompt.
      // It'll automatically be included in the user prompt.
      return;
    }

    const content = [
      [
        `<${this.promptPrefix}`,
        this.location && ` location="${this.location}"`,
        this.directory && ` project-directory="${this.directory}"`,
        '>',
      ]
        .filter(Boolean)
        .join(''),
      this.content,
      `</${this.promptPrefix}>`,
    ].join('\n');
    state.messages.push({ content, role: 'system' });
  }
}

export class TechStackEvent extends InteractionEvent {
  constructor(public terms: string[]) {
    super('techStack');
  }

  get metadata() {
    return {
      type: this.type,
      terms: this.terms,
    };
  }

  get message() {
    return `[techStack] ${this.terms.join(' ')}`;
  }

  updateState(state: InteractionState) {
    state.techStackTerms = this.terms;
  }
}

class InteractionHistory extends EventEmitter {
  public readonly events: InteractionEvent[] = [];

  private acceptPinnedFileContext = true;

  // eslint-disable-next-line class-methods-use-this
  log(message: string) {
    console.warn(message);
  }

  addEvent(event: InteractionEvent) {
    if (!this.validateEvent(event)) return;

    this.emit('event', event);
    this.events.push(event);
  }

  /**
   * Clone the interaction history.
   * This is useful for creating a copy of the interaction history
   * that can be modified without affecting the original.
   * @note this is a shallow copy, so the events are not cloned.
   * This means that modifying the events in the clone will also modify the events in the original.
   * @returns a shallow copy of the interaction history
   */
  clone(): InteractionHistory {
    const clone = new InteractionHistory();
    clone.events.push(...this.events);
    clone.acceptPinnedFileContext = this.acceptPinnedFileContext;
    return clone;
  }

  stopAcceptingPinnedFileContext() {
    this.acceptPinnedFileContext = false;
  }

  clear() {
    this.events.splice(0, this.events.length);
  }

  computeTokenSize(): number {
    const state = this.buildState();
    const tokenCharacters = state.messages
      .map((message) => message.content.length)
      .reduce((a, b) => a + b, 0);

    return Math.round(tokenCharacters / CHARACTERS_PER_TOKEN);
  }

  buildState(): InteractionState {
    const state = new InteractionState();
    const instructions = this.events.filter((event) => event.type !== 'contextItem');
    const contextItems = this.events.filter((event) => event.type === 'contextItem');

    for (const event of instructions) {
      event.updateState(state);
    }

    if (contextItems.length) {
      state.messages.push({ content: '<context>', role: 'system' });
      for (const event of contextItems) {
        event.updateState(state);
      }
      state.messages.push({ content: '</context>', role: 'system' });
    }

    return state;
  }

  protected validateEvent(event: InteractionEvent) {
    if (event instanceof ContextItemEvent) {
      if (event.requestor === ContextItemRequestor.PinnedFile && !this.acceptPinnedFileContext) {
        this.log(
          'WARNING Unexpected pinned file context item; no further pinned file context is expected.'
        );
        // This is a warning only. We don't want to stop the event from being added.
        return true;
      }
    }

    return true;
  }
}

interface InteractionHistory {
  on(event: 'event', listener: (event: InteractionEvent) => void): this;
  on(event: string, listener: (...args: unknown[]) => void): this;
}

export default InteractionHistory;
