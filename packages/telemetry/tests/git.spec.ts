import child_process, { ChildProcess } from 'node:child_process';
import { Git, GitBranchEnvKeys, GitCommitEnvKeys, GitRepositoryEnvKeys, GitState } from '../src';
import { nextTick } from 'node:process';

describe('Git', () => {
  const sinceDaysAgo = 365;

  it('returns a list of unique git contributors', async () => {
    const contributors = await Git.contributors(sinceDaysAgo);
    expect(contributors.length).toBeGreaterThan(0);
  });

  it('properly caches the list of git contributors', () => {
    const firstResult = Git.contributors(sinceDaysAgo);
    expect(Git.contributors(sinceDaysAgo)).toEqual(firstResult);
  });

  describe('state', () => {
    it('returns NotInstalled on error', async () => {
      const spawn = jest.spyOn(child_process, 'spawn').mockImplementation(() => {
        const cp = new ChildProcess();
        nextTick(() => cp.emit('error', new Error('test error')));
        return cp;
      });

      const state = await Git.state();
      expect(state).toEqual(GitState.NotInstalled);
      expect(spawn).toBeCalledWith('git', ['status', '--porcelain'], expect.any(Object));
    });
  });

  const originalEnv = process.env;
  const ciEnvKeys = [...GitRepositoryEnvKeys, ...GitBranchEnvKeys, ...GitCommitEnvKeys];
  function cleanEnv() {
    jest.resetModules();
    process.env = { ...originalEnv };
    ciEnvKeys.forEach((key) => delete process.env[key]);
  }

  describe('repository', () => {
    beforeEach(() => {
      cleanEnv();
      Git.clearCache();
    });
    afterEach(() => {
      process.env = originalEnv;
    });

    it('returns the git repository', () => {
      return expect(Git.repository()).resolves.toMatch(/appmap-js/);
    });

    it('retrieves the git repository from the environment when available', () => {
      process.env.GITHUB_REPOSITORY = 'test/example';
      return expect(Git.repository()).resolves.toBe(process.env.GITHUB_REPOSITORY);
    });
  });

  describe('branch', () => {
    beforeEach(() => {
      cleanEnv();
      Git.clearCache();
    });
    afterEach(() => {
      process.env = originalEnv;
    });

    it('returns a git branch', async () => {
      const branch = await Git.branch();
      expect(typeof branch).toBe('string');
      expect(branch?.length).toBeGreaterThan(0);
    });

    it('retrieves the branch name from the environment when available', () => {
      process.env.GITHUB_REF_NAME = '00-test';
      return expect(Git.branch()).resolves.toBe(process.env.GITHUB_REF_NAME);
    });
  });

  describe('commit', () => {
    beforeEach(() => {
      cleanEnv();
      Git.clearCache();
    });
    afterEach(() => {
      process.env = originalEnv;
    });

    it('returns a git commit', () => {
      return expect(Git.commit()).resolves.toMatch(/^[0-9a-f]{40}$/);
    });

    it('retrieves the commit SHA from the environment when available', () => {
      process.env.GITHUB_SHA = '00-test';
      return expect(Git.commit()).resolves.toBe(process.env.GITHUB_SHA);
    });
  });
});
