import { ConversationThread } from '@appland/client';
import { ContextV2, Help, ProjectInfo } from '@appland/navie';
import { NavieRpc } from '@appland/rpc';

export type XMLToken = {
  type: 'tag';
  tag: string;
  raw: string;
  attributes: [string, string][];
};

export type Token = string | XMLToken;

export type Timestamp = {
  time: number;
};

export type NavieThreadInitEvent = {
  type: 'thread-init';
  conversationThread: ConversationThread;
};
export type NavieTokenMetadataEvent = {
  type: 'token-metadata';
  codeBlockUri: string;
  metadata: Record<string, unknown>;
};

export type NavieTokenEvent = {
  type: 'token';
  messageId: string;
  token: Token;
  codeBlockUri?: string;
};

export type NavieMessageEvent = {
  type: 'message';
  role: 'system' | 'assistant' | 'user';
  messageId: string;
  content: string;
};

export type NaviePromptSuggestionsEvent = {
  type: 'prompt-suggestions';
  suggestions: NavieRpc.V1.Suggest.Response;
  messageId: string;
};

export type NavieMessageCompleteEvent = {
  type: 'message-complete';
  messageId: string;
};

export type NaviePinItemEvent = {
  type: 'pin-item';
  uri: string;
  content?: string;
};

export type NavieUnpinItemEvent = {
  type: 'unpin-item';
  uri: string;
};

export type NavieErrorEvent = {
  type: 'error';
  error: unknown;
};

export type NavieBeginContextSearchEvent = {
  type: 'begin-context-search';
  contextType: 'help' | 'project-info' | 'context';
  id: string;
  request?: Help.HelpRequest | ProjectInfo.ProjectInfoRequest | ContextV2.ContextRequest;
};

export type NavieCompleteContextSearchEvent = {
  type: 'complete-context-search';
  id: string;
  result?: Help.HelpResponse | ProjectInfo.ProjectInfoResponse | ContextV2.ContextResponse;
};

export type NavieAddMessageAttachmentEvent = {
  type: 'add-message-attachment';
  uri: string;
  content?: string;
};

export type NavieRemoveMessageAttachmentEvent = {
  type: 'remove-message-attachment';
  uri: string;
};

export type NavieEvent =
  | NavieBeginContextSearchEvent
  | NavieCompleteContextSearchEvent
  | NavieErrorEvent
  | NavieMessageEvent
  | NavieMessageCompleteEvent
  | NaviePinItemEvent
  | NavieUnpinItemEvent
  | NaviePromptSuggestionsEvent
  | NavieThreadInitEvent
  | NavieTokenEvent
  | NavieTokenMetadataEvent
  | NavieAddMessageAttachmentEvent
  | NavieRemoveMessageAttachmentEvent;

export type TimestampNavieEvent = Timestamp & NavieEvent;
