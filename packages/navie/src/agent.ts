import { ContextV2 } from './context';
import Filter from './lib/filter';
import { UserOptions } from './lib/parse-options';
import { ProjectInfo } from './project-info';

export enum AgentMode {
  Explain = 'explain',
  Generate = 'generate',
  Help = 'help',
  Test = 'test',
  Plan = 'plan',
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

  buildContextFilters(): ContextV2.ContextFilters {
    const filters: ContextV2.ContextFilters = {};
    if (this.contextLabels) filters.labels = this.contextLabels;
    this.userOptions.populateContextFilters(filters);
    return filters;
  }
}

export type AgentResponse = {
  response: string;
  abort: boolean;
};

export interface Agent {
  newFilter(): Filter;

  perform(options: AgentOptions, tokensAvailable: () => number): Promise<AgentResponse | void>;

  temperature: number | undefined;

  applyQuestionPrompt(question: string): void;
}
