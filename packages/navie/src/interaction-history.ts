import EventEmitter from 'events';
import InteractionState from './interaction-state';
import { ContextItem, ContextResponse } from './context';
import { PromptType } from './prompt';
import { CHARACTERS_PER_TOKEN } from './message';

const SNIPPET_LENGTH = 800;

function contentSnippet(content: string, maxLength = SNIPPET_LENGTH): string {
  if (content.length < maxLength) return content;

  return `${content.slice(0, maxLength)}... (${content.length})`;
}

export abstract class InteractionEvent {
  constructor(public type: string) {}

  abstract get metadata(): Record<string, string | number | boolean>;

  abstract get message(): string;

  abstract updateState(state: InteractionState): void;
}

export function isPromptEvent(event: InteractionEvent): event is PromptInteractionEvent {
  return event.type === 'prompt';
}

export class PromptInteractionEvent extends InteractionEvent {
  constructor(
    public name: PromptType | string,
    public role: 'user' | 'system',
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
  constructor(public context: ContextResponse | undefined) {
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

    const diagramCount = this.context.sequenceDiagrams.length;
    const snippetCount = Object.keys(this.context.codeSnippets).length;
    const dataRequestCount = this.context.codeObjects.length;

    return `[contextLookup] ${diagramCount} diagrams, ${snippetCount} snippets, ${dataRequestCount} data requests`;
  }

  updateState(state: InteractionState) {
    state.contextAvailable = this.context;
  }
}

export class ContextItemEvent extends InteractionEvent {
  constructor(public contextItem: ContextItem, public file?: string) {
    super('contextItem');
  }

  get metadata() {
    const result: Record<string, string> = {
      type: this.type,
      name: this.contextItem.name,
    };
    if (this.file) {
      result.file = this.file;
    }
    return result;
  }

  get message() {
    return [
      `[${this.contextItem.name}]`,
      this.file ? `${this.file}: ` : undefined,
      contentSnippet(this.contextItem.content),
    ]
      .filter(Boolean)
      .join(' ');
  }

  updateState(state: InteractionState) {
    const content = [
      `[${this.contextItem.name}]`,
      [this.file, this.contextItem.content].filter(Boolean).join(': '),
    ]
      .filter(Boolean)
      .join(' ');
    state.messages.push({ content, role: 'user' });
  }
}

export interface InteractionHistoryEvents {
  on(event: 'event', listener: (event: InteractionEvent) => void): void;
}

export default class InteractionHistory extends EventEmitter implements InteractionHistoryEvents {
  public readonly events: InteractionEvent[] = [];

  // eslint-disable-next-line class-methods-use-this
  log(message: string) {
    console.log(message);
  }

  addEvent(event: InteractionEvent) {
    this.emit('event', event);
    this.events.push(event);
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
    for (const event of this.events) {
      event.updateState(state);
    }
    return state;
  }
}
