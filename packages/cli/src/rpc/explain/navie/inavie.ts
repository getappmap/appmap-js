export type ContextProvider = (data: Record<string, unknown>) => Promise<Record<string, unknown>>;

export default interface INavie {
  ask(question: string, codeSelection: string | undefined): Promise<void>;

  on(event: 'ack', listener: (userMessageId: string, threadId: string) => void): this;
  on(event: 'token', listener: (token: string, messageId: string) => void): this;
  on(event: 'complete', listener: () => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
}

export type INavieProvider = (
  threadId: string | undefined,
  contextProvider: ContextProvider
) => INavie;
