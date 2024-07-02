import assert from 'assert';
import EventEmitter from 'events';
import { warn } from 'node:console';

import { OpenAIMemoryService } from './services/memory-service';
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
import VectorTermsCommand from './commands/vector-terms-command';
import TechStackService from './services/tech-stack-service';
import TechStackCommand from './commands/tech-stack-command';
import ContextCommand from './commands/context-command';
import ApplyCommand from './commands/apply-command';
import FileChangeExtractorService from './services/file-change-extractor-service';
import FileUpdateService from './services/file-update-service';
import parseOptions from './lib/parse-options';
import ListFilesCommand from './commands/list-files-command';

export type ChatHistory = Message[];

export interface ClientRequest {
  question: string;
  codeSelection?: string;
  prompt?: string;
}

export interface INavie extends InteractionHistoryEvents {
  on(event: 'event', listener: (event: InteractionEvent) => void): void;

  on(event: 'agent', listener: (agent: string) => void): void;

  on(event: 'classification', listener: (labels: ContextV2.ContextLabel[]) => void): void;

  execute(): AsyncIterable<string>;
}

export const DEFAULT_MODEL_NAME = 'gpt-4o';
export const DEFAULT_TOKEN_LIMIT = 8000;
export const DEFAULT_TEMPERATURE = 0.2;
export const DEFAULT_RESPONSE_TOKENS = 1000;

export class NavieOptions {
  modelName = process.env.APPMAP_NAVIE_MODEL ?? DEFAULT_MODEL_NAME;
  tokenLimit = Number(process.env.APPMAP_NAVIE_TOKEN_LIMIT ?? DEFAULT_TOKEN_LIMIT);
  temperature = Number(process.env.APPMAP_NAVIE_TEMPERATURE ?? DEFAULT_TEMPERATURE);
  responseTokens = Number(process.env.APPMAP_NAVIE_RESPONSE_TOKENS ?? DEFAULT_RESPONSE_TOKENS);
}

export default function navie(
  clientRequest: ClientRequest,
  contextProvider: ContextV2.ContextProvider,
  projectInfoProvider: ProjectInfoProvider,
  helpProvider: HelpProvider,
  options: NavieOptions,
  chatHistory?: ChatHistory
): INavie {
  if (options.modelName !== DEFAULT_MODEL_NAME) warn(`Using model ${options.modelName}`);
  if (options.tokenLimit !== DEFAULT_TOKEN_LIMIT) warn(`Using token limit ${options.tokenLimit}`);
  if (options.temperature !== DEFAULT_TEMPERATURE) warn(`Using temperature ${options.temperature}`);
  if (options.responseTokens !== DEFAULT_RESPONSE_TOKENS)
    warn(`Using response tokens ${options.responseTokens}`);

  const interactionHistory = new InteractionHistory();
  const completionService = new OpenAICompletionService(options.modelName, options.temperature);

  const classificationService = new ClassificationService(interactionHistory, completionService);

  const vectorTermsService = new VectorTermsService(interactionHistory, completionService);

  const techStackService = new TechStackService(interactionHistory, completionService);

  const contextProviderV2 = async (
    request: ContextV2.ContextRequest
  ): Promise<ContextV2.ContextResponse> =>
    contextProvider({ ...request, version: 2, type: 'search' });

  const lookupContextService = new LookupContextService(
    interactionHistory,
    contextProviderV2,
    helpProvider
  );

  const buildExplainCommand = () => {
    const codeSelectionService = new CodeSelectionService(interactionHistory);

    const applyContextService = new ApplyContextService(interactionHistory);

    const agentSelectionService = new AgentSelectionService(
      interactionHistory,
      vectorTermsService,
      lookupContextService,
      applyContextService,
      techStackService
    );
    const projectInfoService = new ProjectInfoService(interactionHistory, projectInfoProvider);
    const memoryService = new OpenAIMemoryService(options.modelName, options.temperature);

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

  const fileChangeExtractor = new FileChangeExtractorService(interactionHistory, completionService);

  const fileUpdateService = new FileUpdateService(interactionHistory);

  const buildClassifyCommand = () => new ClassifyCommand(classificationService);

  const buildVectorTermsCommand = () => new VectorTermsCommand(vectorTermsService);

  const buildTechStackCommand = () => new TechStackCommand(techStackService);

  const buildListFileCommand = () => new ListFilesCommand(fileChangeExtractor);

  const buildContextCommand = () =>
    new ContextCommand(options, vectorTermsService, lookupContextService);

  const buildApplyCommand = () => new ApplyCommand(fileChangeExtractor, fileUpdateService);

  const commandBuilders: Record<CommandMode, () => Command> = {
    [CommandMode.Explain]: buildExplainCommand,
    [CommandMode.Classify]: buildClassifyCommand,
    [CommandMode.ListFiles]: buildListFileCommand,
    [CommandMode.VectorTerms]: buildVectorTermsCommand,
    [CommandMode.TechStack]: buildTechStackCommand,
    [CommandMode.Context]: buildContextCommand,
    [CommandMode.Apply]: buildApplyCommand,
  };

  let { question } = clientRequest;
  question = question.trim();

  let command: Command | undefined;
  for (const commandMode of Object.values(CommandMode)) {
    const prefix = `@${commandMode} `;
    if (question.startsWith(prefix) || question.split('\n')[0].trim() === `@${commandMode}`) {
      command = commandBuilders[commandMode]();
      question = question.slice(prefix.length);
      break;
    }
  }

  if (!command) command = buildExplainCommand();

  const { options: userOptions, question: questionText } = parseOptions(question);

  clientRequest.question = questionText;

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

      yield* command.execute({ ...clientRequest, userOptions }, chatHistory);
    }
  }

  return new Navie();
}
