import { ContextV2 } from './context';
import { ProjectInfo } from './project-info';

export enum AgentMode {
  Explain = 'explain',
  Generate = 'generate',
  Help = 'help',
  Issue = 'issue',
  Apply = 'apply',
}

export function agentMode(value: string): AgentMode | undefined {
  return Object.values(AgentMode).find((mode) => mode === value);
}

export class AgentOptions {
  constructor(
    public question: string,
    public aggregateQuestion: string,
    public chatHistory: string[],
    public projectInfo: ProjectInfo[],
    public codeSelection?: string,
    public contextLabels?: ContextV2.ContextLabel[]
  ) {}

  get hasAppMaps() {
    return this.projectInfo.some((info) => info.appmapStats && info.appmapStats?.numAppMaps > 0);
  }
}

export interface Agent {
  get standalone(): boolean;

  perform(options: AgentOptions, tokensAvailable: () => number): Promise<string[] | void>;

  applyQuestionPrompt(question: string): void;
}
