/* eslint-disable no-underscore-dangle */
import { ContextItem, ContextResponse } from './context';
import Message from './message';

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
