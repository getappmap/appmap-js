/* eslint-disable no-underscore-dangle */
import Message from './message';

export type ContextItem = {
  name: string;
  score?: number; // TODO: Populate these
  content: string;
};

export type ContextResponse = {
  sequenceDiagrams: string[];
  codeSnippets: { [key: string]: string };
  codeObjects: string[];
};

export default class InteractionState {
  messages: Message[] = [];

  vectorTerms = new Array<string>();
  completionModel?: string;
  completionTemperature?: number;
  contextAvailable?: ContextResponse;

  addContextItem(contextItem: ContextItem) {
    // const items = this.contextItems.get(contextItem.type);
    // assert(items);
    // items.push(contextItem.content);
    this.messages.push({ content: contextItem.content, role: 'user' });
  }
}
