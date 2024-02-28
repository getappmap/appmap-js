import { Context, ContextProvider, ProjectInfo } from '@appland/navie';

export default interface INavie {
  ask(question: string, codeSelection: string | undefined): Promise<void>;

  on(event: 'ack', listener: (userMessageId: string, threadId: string) => void): this;
  on(event: 'token', listener: (token: string, messageId: string) => void): this;
  on(event: 'complete', listener: () => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
}

export type INavieProvider = (
  threadId: string | undefined,
  contextProvider: Context.ContextProvider,
  projectInfoProvider: ProjectInfo.ProjectInfoProvider
) => INavie;
