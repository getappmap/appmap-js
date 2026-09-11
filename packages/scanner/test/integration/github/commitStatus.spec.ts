import postCommitStatus from '../../../src/integration/github/commitStatus';
import { ValidationError } from '../../../src/errors';

const ENV_VARS = [
  'GH_STATUS_TOKEN',
  'GH_TOKEN',
  'CIRCLE_SHA1',
  'TRAVIS_PULL_REQUEST_SHA',
  'TRAVIS_COMMIT',
  'CI_COMMIT_ID',
  'GITHUB_SHA',
  'CIRCLE_PROJECT_USERNAME',
  'CIRCLE_PROJECT_REPONAME',
  'TRAVIS_REPO_SLUG',
  'CI_REPO_OWNER',
  'CI_REPO_NAME',
];

describe('postCommitStatus', () => {
  const originalEnv = process.env;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    process.env = { ...originalEnv };
    for (const name of ENV_VARS) delete process.env[name];

    process.env.GH_TOKEN = 'the-token';
    process.env.GITHUB_SHA = 'deadbeef';
    process.env.CIRCLE_PROJECT_USERNAME = 'getappmap';
    process.env.CIRCLE_PROJECT_REPONAME = 'appmap-js';

    fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 1, state: 'success' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('posts the status to the commit statuses endpoint', async () => {
    const result = await postCommitStatus('success', '3 checks passed');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe('https://api.github.com/repos/getappmap/appmap-js/statuses/deadbeef');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ authorization: 'token the-token' });
    expect(JSON.parse(init.body as string)).toEqual({
      state: 'success',
      context: 'appland/scanner',
      description: '3 checks passed',
    });
    expect(result).toEqual({ id: 1, state: 'success' });
  });

  it('URL-encodes owner, repo and sha', async () => {
    process.env.CIRCLE_PROJECT_REPONAME = 'weird/repo name';

    await postCommitStatus('pending', 'running');

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/getappmap/weird%2Frepo%20name/statuses/deadbeef'
    );
  });

  it('throws when GitHub rejects the request', async () => {
    fetchMock.mockResolvedValue(new Response('Bad credentials', { status: 401 }));

    await expect(postCommitStatus('failure', '1 finding')).rejects.toThrow(
      /Failed to update commit status: 401 .*Bad credentials/
    );
  });

  it('validates configuration before making a request', async () => {
    delete process.env.GH_TOKEN;

    await expect(postCommitStatus('success', 'ok')).rejects.toThrow(ValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
