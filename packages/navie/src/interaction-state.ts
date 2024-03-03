/* eslint-disable no-underscore-dangle */
import { ContextItem, ContextResponse } from './context';
import Message from './message';

export default class InteractionState {
  public readonly messages: Message[] = [];

  public readonly vectorTerms = new Array<string>();
  public completionModel?: string;
  public completionTemperature?: number;
  public contextAvailable?: ContextResponse;

  addContextItem(contextItem: ContextItem) {
    // const items = this.contextItems.get(contextItem.type);
    // assert(items);
    // items.push(contextItem.content);
    this.messages.push({ content: contextItem.content, role: 'user' });
  }
}
