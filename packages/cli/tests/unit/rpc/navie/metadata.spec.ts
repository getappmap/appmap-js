import { navieMetadataV1 } from '../../../../src/rpc/navie/metadata';
import INavie, { INavieProvider } from '../../../../src/rpc/explain/navie/inavie';
import * as configuration from '../../../../src/rpc/configuration';
import * as git from '../../../../src/lib/git';
import EventEmitter from 'node:events';

jest.mock('../../../../src/lib/git');
jest.mock('../../../../src/rpc/configuration');

describe('navieMetadataV1', () => {
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
      const handler = navieMetadataV1(navieProvider).handler;
      return handler({});
    };

    it('says when there are no projects open', async () => {
      projectDirectories = [];

      const response = await getResponse();

      expect(response.welcomeMessage).toContain('no project open');
    });

    it('makes suggestions relevant to the current task', async () => {
      const response = await getResponse();

      expect(response.welcomeMessage).toContain(`looks like you're ${welcomeSuggestion.activity}`);
      welcomeSuggestion.suggestions.forEach((suggestion) =>
        expect(response.welcomeMessage).toContain(suggestion)
      );
    });

    it('provides a generic response if the analysis fails', async () => {
      welcomeSuggestionSerialized = 'malformed json';

      const response = await getResponse();

      expect(response.welcomeMessage).toContain('I can help you answer questions');
    });

    it('provides a response when there are no changes', async () => {
      gitDiff = '';
      gitLog = '';

      const response = await getResponse();

      expect(response.welcomeMessage).toContain("you haven't started working on a task yet");
    });

    it('gracefully handles exceptions when gathering diffs', async () => {
      jest.mocked(git).getDiffLog.mockImplementation(() => Promise.reject(new Error('oops')));

      const response = await getResponse();

      expect(response.welcomeMessage).toContain(welcomeSuggestion.activity);
    });
  });
});
