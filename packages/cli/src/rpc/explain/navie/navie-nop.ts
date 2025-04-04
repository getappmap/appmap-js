import EventEmitter from 'events';
import { default as INavie } from './inavie';

export default class NopNavie extends EventEmitter implements INavie {
  public readonly providerName = 'nop';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setOption(key: string, _value: string | number) {
    throw new Error(`NopNavie does not support option '${key}'`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ask(_threadId: string, _question: string, _codeSelection?: string, _prompt?: string) {
    this.emit(
      'error',
      new Error(`AppMap is transitioning to a fully open-source model where you bring your own LLM, giving you complete control and ensuring your data stays with you.

With this change, the free hosted service is offline, but you can continue using Navie by configuring your own LLM provider.

For guidance on using other LLM providers such as OpenAI and Copilot, [check out our documentation](https://appmap.io/docs/using-navie-ai/bring-your-own-model.html).`)
    );
    return Promise.resolve();
  }

  terminate(): boolean {
    return false;
  }
}
