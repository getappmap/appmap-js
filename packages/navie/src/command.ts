import { ChatHistory, ClientRequest } from './navie';

export enum CommandMode {
  Explain = 'explain',
  Classify = 'classify',
  VectorTerms = 'vector-terms',
}

export default interface Command {
  execute(clientRequest: ClientRequest, chatHistory?: ChatHistory): AsyncIterable<string>;
}