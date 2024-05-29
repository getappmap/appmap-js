import { ContextV2 } from './context';
import { UserOptions } from './lib/parse-options';
import { ProjectInfo } from './project-info';

export enum AgentMode {
  Explain = 'explain',
  Generate = 'generate',
  Help = 'help',
  Test = 'test',
}

export class AgentOptions {
  constructor(
    public question: string,
    public aggregateQuestion: string,
    public userOptions: UserOptions,
    public chatHistory: string[],
    public projectInfo: ProjectInfo[],
    public codeSelection?: string,
    public contextLabels?: ContextV2.ContextLabel[]
  ) {}

  get hasAppMaps() {
    return this.projectInfo.some((info) => info.appmapStats && info.appmapStats?.numAppMaps > 0);
  }
}

export type AgentResponse = {
  response: string;
  abort: boolean;
};

export interface Agent {
  perform(options: AgentOptions, tokensAvailable: () => number): Promise<AgentResponse | void>;

  temperature: number | undefined;

  applyQuestionPrompt(question: string): void;
}
