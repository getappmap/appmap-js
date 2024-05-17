import { log, warn } from 'console';
import EventEmitter from 'events';
import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { homedir } from 'os';
import { ContextV2, Navie, Help, Message, ProjectInfo, navie } from '@appland/navie';

import INavie from './inavie';
import Telemetry from '../../../telemetry';
import {
  AI,
  CreateAgentMessage,
  CreateUserMessage,
  UpdateAgentMessage,
  UpdateUserMessage,
} from '@appland/client';
import reportFetchError from './report-fetch-error';
import assert from 'assert';

class LocalHistory {
  constructor(public readonly threadId: string) {}

  async saveMessage(message: Message) {
    if (!['user', 'assistant'].includes(message.role))
      throw new Error(`Invalid message role for conversation history : ${message.role}`);

    await this.initHistory();
    const timestampNumber = Date.now();
    const historyFile = join(this.historyDir, `${timestampNumber}.json`);
    await writeFile(historyFile, JSON.stringify(message, null, 2));
  }

  async restoreMessages(): Promise<Message[]> {
    await this.initHistory();
    const historyFiles = (await readdir(this.historyDir)).sort();
    const history: Message[] = [];
    for (const historyFile of historyFiles) {
      const historyPath = join(this.historyDir, historyFile);
      const historyString = await readFile(historyPath, 'utf-8');
      const message = JSON.parse(historyString);
      // Fix messages that were miscategorized.
      if (message.role === 'system') {
        message.role = 'assistant';
      }
      history.push(message);
    }
    return history;
  }

  protected async initHistory() {
    await mkdir(this.historyDir, { recursive: true });
  }

  protected get historyDir() {
    return join(homedir(), '.appmap', 'navie', 'history', this.threadId);
  }
}

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
  public navieOptions = new Navie.NavieOptions();

  constructor(
    private readonly contextProvider: ContextV2.ContextProvider,
    private readonly projectInfoProvider: ProjectInfo.ProjectInfoProvider,
    private readonly helpProvider: Help.HelpProvider
  ) {
    super();
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
    codeSelection: string | undefined
  ): Promise<void> {
    if (!threadId) {
      warn(`[local-navie] No threadId provided for question. Allocating a new threadId.`);
      // eslint-disable-next-line no-param-reassign
      threadId = randomUUID();
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

    const history = new LocalHistory(threadId);

    this.#reportConfigTelemetry();
    log(`[local-navie] Processing question ${userMessageId} in thread ${threadId}`);
    this.emit('ack', userMessageId, threadId);

    const clientRequest: Navie.ClientRequest = {
      question,
      codeSelection,
    };

    const messages = await history.restoreMessages();
    await history.saveMessage({ content: question, role: 'user' });

    const startTime = Date.now();

    const navieFn = navie(
      clientRequest,
      this.contextProvider,
      this.projectInfoProvider,
      this.helpProvider,
      this.navieOptions,
      messages
    );

    let agentName: string | undefined;
    let classification: ContextV2.ContextLabel[] | undefined;

    navieFn.on('event', (event) => this.emit('event', event));
    navieFn.on('agent', (agent) => (agentName = agent));
    navieFn.on('classification', (labels) => (classification = labels));

    const response = new Array<string>();
    for await (const token of navieFn.execute()) {
      response.push(token);
      this.emit('token', token, agentMessageId);
    }
    const endTime = Date.now();
    const duration = endTime - startTime;

    warn(`[local-navie] Completed question ${userMessageId} in ${duration}ms`);

    await history.saveMessage({ content: response.join(''), role: 'assistant' });

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
}
