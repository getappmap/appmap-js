import { ContextV2, Help, ProjectInfo } from '@appland/navie';

export default interface INavie {
  get providerName(): string;

  setOption(key: string, value: string | number): void;

  ask(
    threadId: string | undefined,
    question: string,
    codeSelection: string | undefined,
    prompt: string | undefined
  ): Promise<void>;

  on(event: 'ack', listener: (userMessageId: string, threadId: string) => void): this;
  on(event: 'token', listener: (token: string, messageId: string) => void): this;
  on(event: 'complete', listener: () => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
}

export type INavieProvider = (
  contextProvider: ContextV2.ContextProvider,
  projectInfoProvider: ProjectInfo.ProjectInfoProvider,
  helpProvider: Help.HelpProvider
) => INavie;
