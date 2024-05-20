import EventEmitter from 'events';
import assert from 'assert';

import MemoryService from './services/memory-service';
import VectorTermsService from './services/vector-terms-service';
import { OpenAICompletionService } from './services/completion-service';
import InteractionHistory, {
  AgentSelectionEvent,
  ClassificationEvent,
  InteractionEvent,
  InteractionHistoryEvents,
} from './interaction-history';
import { ContextV2 } from './context';
import ProjectInfoService from './services/project-info-service';
import { ProjectInfoProvider } from './project-info';
import CodeSelectionService from './services/code-selection-service';
import { HelpProvider } from './help';
import AgentSelectionService from './services/agent-selection-service';
import LookupContextService from './services/lookup-context-service';
import ApplyContextService from './services/apply-context-service';
import ClassificationService from './services/classification-service';
import Command, { CommandMode } from './command';
import ExplainCommand from './commands/explain-command';
import ClassifyCommand from './commands/classify-command';
import Message from './message';

export type ChatHistory = Message[];

export interface ClientRequest {
  question: string;
  codeSelection?: string;
}

export interface INavie extends InteractionHistoryEvents {
  on(event: 'event', listener: (event: InteractionEvent) => void): void;

  on(event: 'agent', listener: (agent: string) => void): void;

  on(event: 'classification', listener: (labels: ContextV2.ContextLabel[]) => void): void;

  execute(): AsyncIterable<string>;
}

export const DEFAULT_TOKEN_LIMIT = 8000;
export const DEFAULT_TEMPERATURE = 0.2;

export class NavieOptions {
  modelName = process.env.APPMAP_NAVIE_MODEL ?? 'gpt-4o';
  tokenLimit = Number(process.env.APPMAP_NAVIE_TOKEN_LIMIT ?? DEFAULT_TOKEN_LIMIT);
  temperature = Number(process.env.APPMAP_NAVIE_TEMPERATURE ?? DEFAULT_TEMPERATURE);
  responseTokens = 1000;
}

export default function navie(
  clientRequest: ClientRequest,
  contextProvider: ContextV2.ContextProvider,
  projectInfoProvider: ProjectInfoProvider,
  helpProvider: HelpProvider,
  options: NavieOptions,
  chatHistory?: ChatHistory
): INavie {
  const interactionHistory = new InteractionHistory();
  const completionService = new OpenAICompletionService(
    interactionHistory,
    options.modelName,
    options.temperature
  );

  const classificationService = new ClassificationService(
    interactionHistory,
    options.modelName,
    options.temperature
  );

  const buildExplainCommand = () => {
    const codeSelectionService = new CodeSelectionService(interactionHistory);
    const vectorTermsService = new VectorTermsService(
      interactionHistory,
      options.modelName,
      options.temperature
    );

    const contextProviderV2 = async (
      request: ContextV2.ContextRequest
    ): Promise<ContextV2.ContextResponse> =>
      contextProvider({ ...request, version: 2, type: 'search' });

    const lookupContextService = new LookupContextService(
      interactionHistory,
      contextProviderV2,
      helpProvider
    );
    const applyContextService = new ApplyContextService(interactionHistory);

    const agentSelectionService = new AgentSelectionService(
      interactionHistory,
      helpProvider,
      vectorTermsService,
      lookupContextService,
      applyContextService
    );
    const projectInfoService = new ProjectInfoService(interactionHistory, projectInfoProvider);
    const memoryService = new MemoryService(
      interactionHistory,
      options.modelName,
      options.temperature
    );

    return new ExplainCommand(
      options,
      interactionHistory,
      completionService,
      classificationService,
      agentSelectionService,
      codeSelectionService,
      projectInfoService,
      memoryService
    );
  };

  const buildClassifyCommand = () => new ClassifyCommand(classificationService);

  const commandBuilders: Record<CommandMode, () => Command> = {
    [CommandMode.Explain]: buildExplainCommand,
    [CommandMode.Classify]: buildClassifyCommand,
  };

  let { question } = clientRequest;
  question = question.trim();

  let command: Command | undefined;
  for (const commandMode of Object.values(CommandMode)) {
    const prefix = `@${commandMode} `;
    if (question.startsWith(prefix)) {
      command = commandBuilders[commandMode]();
      question = question.slice(prefix.length);
      break;
    }
  }

  if (!command) command = buildExplainCommand();

  clientRequest.question = question;

  class Navie extends EventEmitter implements INavie {
    constructor() {
      super();

      interactionHistory.on('event', (event: InteractionEvent) => {
        this.emit('event', event);

        if (event instanceof AgentSelectionEvent) {
          this.emit('agent', event.agent);
        }

        if (event instanceof ClassificationEvent) {
          this.emit('classification', event.classification);
        }
      });
    }

    // eslint-disable-next-line class-methods-use-this
    async *execute(): AsyncIterable<string> {
      assert(command, 'Command not specified');

      yield* command.execute(clientRequest, chatHistory);
    }
  }

  return new Navie();
}
