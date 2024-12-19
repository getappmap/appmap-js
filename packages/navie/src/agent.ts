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

  get contextLocations(): string[] {
    return this.codeSelection && typeof this.codeSelection !== 'string'
      ? this.codeSelection.filter(UserContext.hasLocation).map((cs) => cs.location)
      : [];
  }

  buildContextFilters(): ContextV2.ContextFilters {
    const filters: ContextV2.ContextFilters = {};
    if (this.contextLabels) filters.labels = this.contextLabels;
    this.userOptions.populateContextFilters(filters);
    const contextLocations = this.contextLocations;
    if (contextLocations.length > 0) {
      filters.locations = contextLocations;
      filters.exclude ||= [];
      filters.exclude.push(...contextLocations);
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

  /**
   * Perform the agent's task, optionally returning a response. If the response is void, then
   * the enclosing command will continue by applying the prompts defined in the InteractionHistory
   * with which the agent is constructed.
   *
   * Returning a response from this method essentially allows the agent to short-circuit the
   * normal prompt flow and provide a response directly.
   */
  perform(options: AgentOptions, tokensAvailable: () => number): Promise<AgentResponse | void>;

  temperature: number | undefined;

  applyQuestionPrompt(question: string): void;
}
