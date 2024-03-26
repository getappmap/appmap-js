import { ProjectInfo } from './project-info';

export enum AgentMode {
  Explain = 'explain',
  Generate = 'generate',
  Help = 'help',
}

export class AgentOptions {
  constructor(
    public question: string,
    public aggregateQuestion: string,
    public chatHistory: string[],
    public projectInfo: ProjectInfo[],
    public codeSelection?: string
  ) {}

  get hasAppMaps() {
    return this.projectInfo.some((info) => info.appmapStats.numAppMaps > 0);
  }
}

export interface Agent {
  perform(options: AgentOptions, tokensAvailable: () => number): Promise<void>;

  applyQuestionPrompt(question: string): void;
}
