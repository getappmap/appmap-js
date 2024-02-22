/* eslint-disable max-classes-per-file */
import EventEmitter from 'events';
import InteractionState from './interaction-state';
import { ContextResponse } from './context';
import { ContextItem } from './context';

type InteractionEventType =
  | 'systemPrompt'
  | 'question'
  | 'codeSelection'
  | 'vectorTerms'
  | 'completion'
  | 'contextLookup'
  | 'contextItem'
  | 'projectInfo'
  | 'summary';

const SNIPPET_LENGTH = 200;

function contentSnippet(content: string, maxLength = SNIPPET_LENGTH): string {
  if (content.length < maxLength) return content;

  return `${content.slice(0, maxLength)}... (${content.length})`;
}

export abstract class InteractionEvent {
  constructor(public type: InteractionEventType) {}

  abstract get message(): string;

  abstract updateState(state: InteractionState): void;
}

export class PromptInteractionEvent extends InteractionEvent {
  constructor(
    public type:
      | 'systemPrompt'
      | 'question'
      | 'codeSelection'
      | 'projectInfo'
      | 'contextItem'
      | 'summary',
    public isUser: boolean,
    public content: string,
    public prefix?: string
  ) {
    super(type);
  }

  get message() {
    return `[prompt] ${this.role}: ${contentSnippet(this.fullContent)}`;
  }

  get role() {
    return this.isUser ? 'user' : 'system';
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

  get message() {
    if (!this.context) return `[contextLookup] not found`;

    const diagramCount = this.context.sequenceDiagrams.length;
    const snippetCount = this.context.codeSnippets.length;
    const objectCount = this.context.codeObjects.length;

    return `[contextLookup] ${diagramCount} diagrams, ${snippetCount} snippets, ${objectCount} objects`;
  }

  updateState(state: InteractionState) {
    state.contextAvailable = this.context;
  }
}

export class ContextItemEvent extends InteractionEvent {
  constructor(public contextItem: ContextItem) {
    super('contextItem');

    if (contextItem.name === 'sequence-diagram') {
      console.log(contextItem.content);
      console.log('sequence-diagram');
    }
  }

  get message() {
    return `[contextItem] ${this.contextItem.name} ${contentSnippet(this.contextItem.content)}`;
  }

  updateState(state: InteractionState) {
    // TODO: Prefix needed here?
    const content = [this.contextItem.name, this.contextItem.content].filter(Boolean).join(' ');
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

  buildState(): InteractionState {
    const state = new InteractionState();
    for (const event of this.events) {
      event.updateState(state);
    }
    return state;
  }
}
