import { ContextV2, Help, ProjectInfo } from '@appland/navie';
import { Explain } from './explain';
import RemoteNavie from './navie/navie-remote';
import INavie, { INavieProvider } from './navie/inavie';
import { ExplainRpc } from '@appland/rpc';
import { loadConfiguration, setConfiguration } from '@appland/client';

type NavieClientOptions = {
  apiKey: string;
  apiUrl?: string;
};

type NaviePrompt = {
  prompt: string;
  codeSelection?: string;
  threadId?: string;
  cwd?: string;
};

type NaviePromptResponse = {
  threadId?: string;
};

type NaviePromptResponseBlocking = NaviePromptResponse & {
  message: string;
};

interface INavieClient {
  exec(prompt: NaviePrompt): Promise<NaviePromptResponseBlocking>;
}

loadConfiguration(false);

export default class NavieClient implements INavieClient {
  private navieProvider: INavieProvider;

  constructor(options?: NavieClientOptions) {
    if (options) {
      setConfiguration({ apiKey: options.apiKey, apiURL: options.apiUrl });
    }
    this.navieProvider = (contextProvider, projectInfoProvider, helpProvider) =>
      new RemoteNavie(contextProvider, projectInfoProvider, helpProvider);
  }

  private runExplain(
    prompt: NaviePrompt,
    fn: (explain: Explain, navie: INavie) => void
  ): Promise<void> {
    const explain = new Explain(
      [],
      [prompt.cwd ?? process.cwd()],
      prompt.prompt,
      prompt.codeSelection,
      [],
      {
        step: ExplainRpc.Step.NEW,
        threadId: prompt.threadId,
      },
      undefined,
      undefined
    );

    const invokeContextFunction = async (data: any) => {
      const type = data.type;
      const fnName = [type, 'Context'].join('');
      console.warn(`Explain received context request: ${type}`);
      const fn: (args: any) => any = (explain as any)[fnName];
      if (!fn) {
        console.warn(`Explain context function ${fnName} not found`);
        return {};
      }

      try {
        return await fn.call(explain, data);
      } catch (e) {
        console.warn(`Explain context function ${fnName} threw an error:`);
        console.warn(e);
        return {};
      }
    };

    const contextProvider: ContextV2.ContextProvider = async (data: any) =>
      invokeContextFunction(data);
    const projectInfoProvider: ProjectInfo.ProjectInfoProvider = async (data: any) =>
      invokeContextFunction(data);
    const helpProvider: Help.HelpProvider = async (data: any) => invokeContextFunction(data);

    const navie = this.navieProvider(contextProvider, projectInfoProvider, helpProvider);

    return new Promise<void>((resolve, reject) => {
      fn(explain, navie);
      explain.on('error', (err: Error) => reject(err));
      explain.on('complete', () => resolve());
      explain.explain(navie).catch((err: Error) => reject(err));
    });
  }

  public async exec(prompt: NaviePrompt): Promise<NaviePromptResponseBlocking> {
    let message = '';
    return new Promise<NaviePromptResponseBlocking>((resolve, reject) =>
      this.runExplain(prompt, (explain, navie) => {
        navie.on('token', (token: string, _systemMessageId: string) => {
          message += token;
        });
        explain.on('complete', () => {
          const threadId = explain.status.threadId;
          return resolve({
            threadId,
            message,
          });
        });
      })
    );
  }
}
