import { ContextV2 } from './context';
import { UserOptions } from './lib/parse-options';
import Message from './message';
import { ProjectInfo } from './project-info';
import { UserContext } from './user-context';

export enum AgentMode {
  Explain = 'explain',
  Search = 'search',
  Diagram = 'diagram',
  Plan = 'plan',
  Generate = 'generate',
  Test = 'test',
  Help = 'help',
}

export class AgentOptions {
  constructor(
    public question: string,
    public aggregateQuestion: string,
    public userOptions: UserOptions,
    public chatHistory: Message[],
    public projectInfo: ProjectInfo[],
    public codeSelection?: UserContext.Context,
    public contextLabels?: ContextV2.ContextLabel[]
  ) {}

  get hasAppMaps() {
    return this.projectInfo.some((info) => info.appmapStats && info.appmapStats?.numAppMaps > 0);
  }

  get pinnedFileLocations(): string[] {
    return this.codeSelection && typeof this.codeSelection !== 'string'
      ? this.codeSelection.filter(UserContext.hasLocation).map((cs) => cs.location)
      : [];
  }

  /**
   * Configure context filters to fetch the content that's relevant to the current user options,
   * including /include and /exclude options and pinned file locations.
   */
  buildContextFilters(): ContextV2.ContextFilters {
    const filters: ContextV2.ContextFilters = {};
    if (this.contextLabels) filters.labels = this.contextLabels;
    this.userOptions.populateContextFilters(filters);
    const pinnedFileLocations = this.pinnedFileLocations;
    if (pinnedFileLocations.length > 0) {
      filters.locations = pinnedFileLocations;
      filters.exclude ||= [];
      filters.exclude.push(...pinnedFileLocations);
    }
    return filters;
  }
}

export type AgentResponse = {
  response: string;
  abort: boolean;
};

export interface Agent {
  readonly filter?: (stream: AsyncIterable<string>) => AsyncIterable<string>;

  perform(options: AgentOptions, tokensAvailable: () => number): Promise<AgentResponse | void>;

  temperature: number | undefined;

  applyQuestionPrompt(question: string): void;
}
