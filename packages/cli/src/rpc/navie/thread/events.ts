import { ConversationThread } from '@appland/client';
import { ContextV2, Help, ProjectInfo } from '@appland/navie';
import { NavieRpc } from '@appland/rpc';

export type Timestamp = {
  time: number;
};

export type NavieThreadInitEvent = {
  type: 'thread-init';
  conversationThread: ConversationThread;
};
export type NavieTokenMetadataEvent = {
  type: 'token-metadata';
  codeBlockId: string;
  metadata: Record<string, unknown>;
};

export type NavieTokenEvent = {
  type: 'token';
  messageId: string;
  token: string;
  codeBlockId?: string;
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

export type NaviePinItemEvent = PinnedItem & {
  type: 'pin-item';
};

export type NavieUnpinItemEvent = PinnedItem & {
  type: 'unpin-item';
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
  attachmentId: string;
  uri?: string;
  content?: string;
};

export type NavieRemoveMessageAttachmentEvent = {
  type: 'remove-message-attachment';
  attachmentId: string;
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

export type PinnedItem = {
  uri?: string;
  handle?: number;
};
