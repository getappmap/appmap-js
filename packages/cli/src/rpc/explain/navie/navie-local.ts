import { log, warn } from 'console';
import EventEmitter from 'events';
import { randomUUID } from 'crypto';

import {
  ContextV2,
  Help,
  Navie,
  navie,
  ProjectInfo,
  TestInvocation,
  UserContext,
  InteractionHistory,
} from '@appland/navie';

import INavie from './inavie';
import { Telemetry } from '@appland/telemetry';
import {
  AI,
  CreateAgentMessage,
  CreateUserMessage,
  UpdateAgentMessage,
  UpdateUserMessage,
} from '@appland/client';
import reportFetchError from './report-fetch-error';
import assert from 'assert';
import Trajectory from './trajectory';
import ModelRegistry from '../../navie/models/registry';
import { verbose } from '../../../utils';
import { container } from 'tsyringe';
import ThreadService from '../../navie/services/threadService';
import LegacyHistory from '../../navie/legacy/history';
import { events, properties, metrics } from '../../../lib/telemetryConstants';
import { performance } from 'node:perf_hooks';

const OPTION_SETTERS: Record<
  string,
  (navieOptions: Navie.NavieOptions, value: string | number) => void
> = {
  tokenLimit: (navieOptions, value) => {
    navieOptions.tokenLimit = typeof value === 'string' ? parseInt(value, 10) : value;
  },
  temperature: (navieOptions, value) => {
    navieOptions.temperature = typeof value === 'string' ? parseFloat(value) : value;
  },
  modelName: (navieOptions, value) => {
    navieOptions.modelName = String(value);
  },
  explainMode: () => {
    warn(`Option 'explainMode' is deprecated and will be ignored`);
  },
};

export default class LocalNavie extends EventEmitter implements INavie {
  private activeNavie?: Navie.INavie;
  public navieOptions = new Navie.NavieOptions();
  public trajectory: Trajectory | undefined;

  assignedThreadId: string | undefined;

  constructor(
    private readonly contextProvider: ContextV2.ContextProvider,
    private readonly projectInfoProvider: ProjectInfo.ProjectInfoProvider,
    private readonly helpProvider: Help.HelpProvider,
    private readonly testInvocationProvider: TestInvocation.TestInvocationProvider
  ) {
    super();
  }

  // Sets a thread id to use with the request.
  // The caller is responsible for ensuring that the thread id is a unique, valid uuid.
  setThreadId(threadId: string) {
    this.assignedThreadId = threadId;
  }

  setTrajectoryHandler(trajectory: Trajectory) {
    this.trajectory = trajectory;
  }

  get providerName() {
    return 'local';
  }

  setOption(key: keyof typeof OPTION_SETTERS, value: string | number) {
    const setter = OPTION_SETTERS[key];
    if (setter) {
      setter(this.navieOptions, value);
    } else {
      throw new Error(`LocalNavie does not support option '${key}'`);
    }
  }

  async ask(
    threadId: string | undefined,
    question: string,
    codeSelection?: UserContext.Context,
    prompt?: string
  ): Promise<void> {
    if (this.activeNavie) {
      throw new Error('Multiple completions are not supported');
    }

    if (!threadId) {
      if (this.assignedThreadId) {
        warn(`[local-navie] No threadId provided for question. Using client-specified threadId.`);
        // eslint-disable-next-line no-param-reassign
        threadId = this.assignedThreadId;
      } else {
        warn(`[local-navie] No threadId provided for question. Allocating a new threadId.`);
        // eslint-disable-next-line no-param-reassign
        threadId = randomUUID();
      }
    }

    let userMessageId: string;
    {
      const userMessage: CreateUserMessage = {
        questionLength: question.length,
      };
      if (codeSelection) userMessage.codeSelectionLength = codeSelection.length;

      userMessageId =
        (
          await reportFetchError(
            'createUserMessage',
            () => (assert(threadId), AI.createUserMessage(threadId, userMessage))
          )
        )?.id ?? randomUUID();
    }

    let agentMessageId: string;
    {
      const agentMessage: CreateAgentMessage = {};

      agentMessageId =
        (
          await reportFetchError(
            'createAgentMessage',
            () => (assert(threadId), AI.createAgentMessage(threadId, agentMessage))
          )
        )?.id ?? randomUUID();
    }

    this.#reportConfigTelemetry();
    log(`[local-navie] Processing question ${userMessageId} in thread ${threadId}`);

    try {
      const clientRequest: Navie.ClientRequest = {
        question,
        codeSelection,
        prompt,
      };

      let chatHistory: Navie.ChatHistory = [];
      let history: LegacyHistory | undefined;
      if (process.env.APPMAP_NAVIE_THREAD_LOG) {
        try {
          const threadService = container.resolve(ThreadService);
          const thread = await threadService.getThread(threadId);
          chatHistory = thread.getChatHistory();
        } catch (e) {
          if (verbose()) {
            console.warn(`Failed to load thread ${threadId}: ${e}`);
          }
          // If the thread failed to load, history will be empty.
          // This is typically expected if the thread is new.
        }
      } else {
        try {
          history = LegacyHistory.initialize();
          const thread = await history.load(threadId);
          chatHistory = thread.messages;
        } catch (e) {
          if (verbose()) console.warn(`Failed to load legacy thread ${threadId}: ${e}`);
        }
        history?.question(threadId, userMessageId, question, codeSelection, prompt);
      }

      this.emit('ack', userMessageId, threadId);

      const startTime = performance.now();
      this.activeNavie = navie(
        clientRequest,
        this.contextProvider,
        this.projectInfoProvider,
        this.helpProvider,
        this.testInvocationProvider,
        this.navieOptions,
        chatHistory,
        ModelRegistry.instance.selectedModel
      );

      let agentName: string | undefined;
      let classification: ContextV2.ContextLabel[] | undefined;
      const debugProperties: Record<string, string> = {};
      const debugMetrics: Record<string, number> = {};
      this.activeNavie.on('event', (event) => {
        switch (event.type) {
          case 'vectorTerms':
            debugMetrics[metrics.NavieVectorTermsMs] = performance.now() - startTime;
            break;
          case 'contextLookup': {
            const contextEvent = event as InteractionHistory.ContextLookupEvent;
            debugMetrics[metrics.NavieContextLookupCount] ||= 0;
            debugMetrics[metrics.NavieContextLookupCount] += 1;
            debugMetrics[metrics.NavieContextLookupResults] ||= 0;
            debugMetrics[metrics.NavieContextLookupResults] += contextEvent.context?.length ?? 0;
            debugMetrics[metrics.NavieContextLookupMs] = performance.now() - startTime;
            break;
          }
          case 'completion':
            debugMetrics[metrics.NavieCompletionStartMs] = performance.now() - startTime;
            break;
        }
        this.emit('event', event);
      });
      this.activeNavie.on('agent', (agent) => {
        debugProperties[properties.NavieAgent] = agent;
        agentName = agent;
      });
      this.activeNavie.on('classification', (labels) => {
        labels.forEach((label) => {
          debugProperties[properties.NavieClassification(label.name)] = label.weight;
        });
        debugMetrics[metrics.NavieClassificationCount] = labels.length;
        debugMetrics[metrics.NavieClassificationMs] = performance.now() - startTime;
        classification = labels;
      });
      if (this.trajectory)
        this.activeNavie.on('trajectory', this.trajectory.logMessage.bind(this.trajectory));

      const response = new Array<string>();
      for await (const token of this.activeNavie.execute()) {
        response.push(token);
        history?.token(threadId, userMessageId, agentMessageId, token);
        this.emit('token', token, agentMessageId);
      }
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Record broad response times for measuring generation performance.
      const { selectedModel } = ModelRegistry.instance;
      Telemetry.sendEvent({
        name: events.NavieResponse,
        properties: {
          [properties.NavieModelId]: selectedModel?.id ?? this.navieOptions.modelName,
          [properties.NavieModelProvider]: selectedModel?.provider,
          ...debugProperties,
        },
        metrics: {
          [metrics.NavieCompletionEndMs]: duration,
          [metrics.NavieCompletionLength]: response.join('').length,
          ...debugMetrics,
        },
      });

      warn(`[local-navie] Completed question ${userMessageId} in ${duration}ms`);

      {
        const userMessage: UpdateUserMessage = {
          agentName,
          classification,
        };
        await reportFetchError('updateUserMessage', () =>
          AI.updateUserMessage(userMessageId, userMessage)
        );
      }
      {
        const agentMessage: UpdateAgentMessage = {
          responseLength: response.join('').length,
          responseTime: duration,
        };
        await reportFetchError('updateAgentMessage', () =>
          AI.updateAgentMessage(agentMessageId, agentMessage)
        );
      }

      this.emit('complete');
    } catch (e) {
      this.emit('error', e);
      throw e;
    } finally {
      this.activeNavie = undefined;
    }
  }

  #skipTelemetry = !Telemetry.enabled;

  #reportConfigTelemetry() {
    if (this.#skipTelemetry) return;
    Telemetry.sendEvent({
      name: 'navie-local',
      properties: {
        modelName: this.navieOptions.modelName,
        azureVersion: process.env.AZURE_OPENAI_API_VERSION,
      },
    });
    this.#skipTelemetry = true;
  }

  terminate() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.activeNavie?.terminate();
    return this.activeNavie !== undefined;
  }
}
