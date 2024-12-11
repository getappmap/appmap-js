/* eslint @typescript-eslint/no-unsafe-assignment: 0 */
import { navieWelcomeV2 } from '../../../../src/rpc/navie/welcome';
import * as isNavieCustomWelcomeMessageEnabled from '../../../../src/rpc/navie/isCustomWelcomeMessageEnabled';
import INavie, { INavieProvider } from '../../../../src/rpc/explain/navie/inavie';
import * as configuration from '../../../../src/rpc/configuration';
import * as git from '../../../../src/lib/git';
import EventEmitter from 'node:events';

jest.mock('../../../../src/rpc/navie/isCustomWelcomeMessageEnabled');
jest.mock('../../../../src/lib/git');
jest.mock('../../../../src/rpc/configuration');

describe('navieWelcomeV2', () => {
  let navieProvider: INavieProvider;
  let projectDirectories: string[] = [];
  const welcomeSuggestion = {
    activity: 'working on something',
    suggestions: ['@explain this', '@diagram that'],
  };
  let welcomeSuggestionSerialized: string;
  let gitDiff = '';
  let gitLog = '';

  beforeEach(() => {
    projectDirectories = ['/home/user/project'];
    gitDiff = '- this\n+ that';
    gitLog = '';
    welcomeSuggestionSerialized = JSON.stringify(welcomeSuggestion);
    navieProvider = jest.fn().mockImplementation(() => {
      const emitter = new EventEmitter();
      const navie = emitter as unknown as INavie;
      navie.ask = jest.fn().mockImplementation(() => {
        emitter.emit('token', welcomeSuggestionSerialized);
        emitter.emit('complete');
      });
      return navie;
    });
    jest.mocked(isNavieCustomWelcomeMessageEnabled).default.mockImplementation(() => true);
    jest
      .mocked(configuration)
      .default.mockImplementation(
        () => ({ projectDirectories } as unknown as configuration.Configuration)
      );
    jest.mocked(git).getWorkingDiff.mockImplementation(() => Promise.resolve(gitDiff));
    jest.mocked(git).getDiffLog.mockImplementation(() => Promise.resolve(gitLog));
  });

  afterEach(() => jest.clearAllMocks());

  describe('welcome message', () => {
    const getResponse = () => {
      const handler = navieWelcomeV2(navieProvider).handler;
      return handler({});
    };

    it('says when there are no projects open', async () => {
      projectDirectories = [];
      await expect(getResponse()).resolves.toStrictEqual({
        message: expect.stringContaining('no project open'),
      });
    });

    it('makes suggestions relevant to the current task', async () =>
      expect(getResponse()).resolves.toStrictEqual({
        activity: welcomeSuggestion.activity,
        suggestions: welcomeSuggestion.suggestions,
      }));

    it('provides a generic response if the analysis fails', async () => {
      welcomeSuggestionSerialized = 'malformed json';
      await expect(getResponse()).resolves.toStrictEqual({
        message: expect.stringContaining('I can help you answer questions'),
      });
    });

    it('provides a response when there are no changes', async () => {
      gitDiff = '';
      gitLog = '';
      await expect(getResponse()).resolves.toStrictEqual({
        message: expect.stringContaining("you haven't started working on a task yet"),
      });
    });

    it('gracefully handles exceptions when gathering diffs', async () => {
      jest.mocked(git).getDiffLog.mockImplementation(() => Promise.reject(new Error('oops')));
      await expect(getResponse()).resolves.toStrictEqual({
        activity: welcomeSuggestion.activity,
        suggestions: welcomeSuggestion.suggestions,
      });
    });
  });
});
