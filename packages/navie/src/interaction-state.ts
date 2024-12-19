import * as zod from 'zod';
import { ContextV2 } from './context';
import { HelpResponse } from './help';
import Message from './message';

export default class InteractionState {
  public readonly messages: Message[] = [];

  public readonly vectorTerms = new Array<string>();
  public completionModel?: string;
  public completionTemperature?: number;
  public contextAvailable?: ContextV2.ContextResponse;
  public helpAvailable?: HelpResponse;
  public techStackTerms?: string[];
  public schema?: zod.Schema<unknown>;

  addContextItem(contextItem: ContextV2.ContextItem) {
    this.messages.push({ content: contextItem.content, role: 'user' });
  }
}
