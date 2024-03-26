import { ContextItem, ContextResponse } from './context';
import { HelpResponse } from './help';
import Message from './message';

export default class InteractionState {
  public readonly messages: Message[] = [];

  public readonly vectorTerms = new Array<string>();
  public completionModel?: string;
  public completionTemperature?: number;
  public contextAvailable?: ContextResponse;
  public helpAvailable?: HelpResponse;

  addContextItem(contextItem: ContextItem) {
    this.messages.push({ content: contextItem.content, role: 'user' });
  }
}
