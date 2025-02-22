import assert from 'node:assert';

import { ZodType } from 'zod';

import type { Message } from '../../src';
import CompletionService, { type Completion, Usage } from '../../src/services/completion-service';

export default class MockCompletionService extends CompletionService {
  constructor() {
    super('mock-model', 0.7, {} as never);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *_complete(messages: readonly Message[]): Completion {
    const completion = this.completion(messages);
    for (const c of completion) {
      yield c;
    }
    return new Usage();
  }

  /**
   * The mock completion function. This function can be used to mock the completion result.
   * By default, it returns a hardcoded string split on spaces. It's a normal Jest mock, so you can manipulate the result
   * further using eg. the `mockReturnValue` function. mock() method is provided as a shorthand.
   * @param messages The messages to complete.
   * @returns The mocked completion.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  completion = jest.fn(function (this: MockCompletionService, messages: readonly Message[]) {
    return ['Example ', 'response ', 'from ', 'the ', 'LLM', '.'];
  });

  /**
   * A shorthand to mock the completion result.
   * @param response The response to give to callers. This can be text or a JSON object.
   * @returns The mock function that can be used to manipulate the results further.
   */
  mock(...response: string[]): typeof this.completion;
  mock(response: string): typeof this.completion;
  mock(response: unknown): typeof this.completion;
  mock(...response: unknown[]): typeof this.completion {
    if (response.length > 1 && response.every((x) => typeof x === 'string'))
      return this.completion.mockReturnValue(response as string[]);
    assert(response.length === 1, 'Only one response is supported');
    const cpl = typeof response[0] === 'string' ? response[0] : JSON.stringify(response[0]);
    return this.completion.mockReturnValue(cpl.split(/(?= )/));
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async json<T>(messages: Message[], schema: ZodType<T>): Promise<T | undefined> {
    const completion = this.completion(messages).join('');
    return schema.parse(JSON.parse(completion));
  }

  modelName = 'mock-model';
  miniModelName = 'mock-mini-model';
  temperature = 0.7;
}
