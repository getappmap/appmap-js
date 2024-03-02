import EventEmitter from 'events';
import { Context, Explain, Message, ProjectInfo, explain } from '@appland/navie';

import INavie from './inavie';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { homedir } from 'os';
import { mkdir, readFile, readdir, writeFile } from 'fs/promises';

class LocalHistory {
  constructor(public readonly threadId: string) {}

  async saveMessage(message: Message) {
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

export default class LocalNavie extends EventEmitter implements INavie {
  public history: LocalHistory;

  constructor(
    public threadId: string | undefined,
    private readonly contextProvider: Context.ContextProvider,
    private readonly projectInfoProvider: ProjectInfo.ProjectInfoProvider
  ) {
    super();

    this.threadId = threadId || randomUUID();
    this.history = new LocalHistory(this.threadId);
  }

  async ask(question: string, codeSelection: string | undefined): Promise<void> {
    const messageId = randomUUID();
    this.emit('ack', messageId, this.threadId);

    const clientRequest: Explain.ClientRequest = {
      question,
      codeSelection,
    };
    const options = new Explain.ExplainOptions();
    const history = await this.history.restoreMessages();
    this.history.saveMessage({ content: question, role: 'user' });

    const explainFn = explain(
      clientRequest,
      this.contextProvider,
      this.projectInfoProvider,
      options,
      history
    );
    explainFn.on('event', (event) => this.emit('event', event));
    const response = new Array<string>();
    for await (const token of explainFn.execute()) {
      response.push(token);
      this.emit('token', token);
    }
    this.history.saveMessage({ content: response.join(''), role: 'system' });
    this.emit('complete');
  }
}
