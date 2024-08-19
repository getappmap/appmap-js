import { UserOptions } from './lib/parse-options';
import { ChatHistory, ClientRequest } from './navie';

export enum CommandMode {
  Explain = 'explain',
  Classify = 'classify',
  Context = 'context',
  Update = 'update',
  VectorTerms = 'vector-terms',
  TechStack = 'tech-stack',
  ListFiles = 'list-files',
  Suggest = 'suggest',
}

export interface CommandRequest extends ClientRequest {
  userOptions: UserOptions;
}

export default interface Command {
  execute(request: CommandRequest, chatHistory?: ChatHistory): AsyncIterable<string>;
}
