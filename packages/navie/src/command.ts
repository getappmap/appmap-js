import { ChatHistory, ClientRequest } from './navie';

export enum CommandMode {
  Explain = 'explain',
  Classify = 'classify',
}

export default interface Command {
  execute(clientRequest: ClientRequest, chatHistory?: ChatHistory): AsyncIterable<string>;
}
