export type AckCallback = (messageId: string, threadId: string) => void;

export type UserMessageHandler = (message: string, ack: AckCallback) => void;
