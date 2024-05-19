import { log, warn } from 'console';
import EventEmitter from 'events';
import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { homedir } from 'os';
import { ContextV2, Navie, Help, Message, ProjectInfo, navie } from '@appland/navie';

import INavie from './inavie';
import Telemetry from '../../../telemetry';

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
  public history: LocalHistory;
  public navieOptions = new Navie.NavieOptions();

  constructor(
    public threadId: string | undefined,
    private readonly contextProvider: ContextV2.ContextProvider,
    private readonly projectInfoProvider: ProjectInfo.ProjectInfoProvider,
    private readonly helpProvider: Help.HelpProvider
  ) {
    super();

    if (threadId) {
      log(`[local-navie] Continuing thread ${threadId}`);
      this.threadId = threadId;
    } else {
      this.threadId = randomUUID();
      log(`[local-navie] Starting new thread ${this.threadId}`);
    }
    this.threadId = threadId || randomUUID();
    this.history = new LocalHistory(this.threadId);
  }

  setOption(key: keyof typeof OPTION_SETTERS, value: string | number) {
    const setter = OPTION_SETTERS[key];
    if (setter) {
      setter(this.navieOptions, value);
    } else {
      throw new Error(`LocalNavie does not support option '${key}'`);
    }
  }

  async ask(question: string, codeSelection: string | undefined): Promise<void> {
    this.#reportConfigTelemetry();
    const messageId = randomUUID();
    log(`[local-navie] Processing question ${messageId} in thread ${this.threadId}`);
    this.emit('ack', messageId, this.threadId);

    const clientRequest: Navie.ClientRequest = {
      question,
      codeSelection,
    };

    const history = await this.history.restoreMessages();
    this.history.saveMessage({ content: question, role: 'user' });

    const navieFn = navie(
      clientRequest,
      this.contextProvider,
      this.projectInfoProvider,
      this.helpProvider,
      this.navieOptions,
      history
    );
    navieFn.on('event', (event) => this.emit('event', event));
    const response = new Array<string>();
    for await (const token of navieFn.execute()) {
      response.push(token);
      this.emit('token', token);
    }
    this.history.saveMessage({ content: response.join(''), role: 'assistant' });
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
