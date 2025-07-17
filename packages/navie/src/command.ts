import { UserOptions } from './lib/parse-options';
import { ChatHistory, ClientRequest } from './navie';
import { UserContext } from './user-context';

export enum CommandMode {
  Explain = 'explain',
  Classify = 'classify',
  Context = 'context',
  Update = 'update',
  VectorTerms = 'vector-terms',
  ListFiles = 'list-files',
  Suggest = 'suggest',
  Observe = 'observe',
  Review = 'review',
  Welcome = 'welcome',
  Fix = 'fix',
}

export interface CommandRequest extends ClientRequest {
  userOptions: UserOptions;
}

export default interface Command {
  execute(request: CommandRequest, chatHistory?: ChatHistory): AsyncIterable<string>;
}

export function hasCodeSelectionArray(request: CommandRequest): request is CommandRequest & {
  codeSelection: UserContext.ContextItem[];
} {
  return Array.isArray(request.codeSelection);
}
