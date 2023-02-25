import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import tmp from 'tmp-promise';
import { findRepository } from '../../../src/lib/git';

describe('git.ts', () => {
  test.each([
    [{ origin: 'https://repo.test/test/test.git' }, 'https://repo.test/test/test.git'],
    [{ other: 'https://repo.test/test/test.git' }, 'https://repo.test/test/test.git'],
    [
      { origin: undefined, other: 'https://repo.test/test/test.git' },
      'https://repo.test/test/test.git',
    ],
    [{ other: undefined }, undefined],
    [undefined, undefined],
    [null, undefined],
    [{ origin: 'https://user:pass@repo.test/test/test.git' }, 'https://repo.test/test/test.git'],
    [{ origin: 'https://token@repo.test/test/test.git' }, 'https://repo.test/test/test.git'],
    [
      { origin: 'git@github.com:getappmap/appmap-server.git' },
      'ssh://github.com/getappmap/appmap-server.git',
    ],
    process.platform === 'win32'
      ? [{ origin: '/some/local/path' }, 'file:///C:/some/local/path']
      : [{ origin: '/some/local/path' }, 'file:///some/local/path'],
  ])('.findRepository() with %o', (config, expected) => {
    expect.assertions(1);
    return tmp.withDir(
      async ({ path }) => {
        if (config !== null) {
          await mkdir(join(path, '.git'));
          await writeFile(join(path, '.git', 'config'), makeGitConfig(config));
        }
        return expect(findRepository(path)).resolves.toEqual(expected);
      },
      { unsafeCleanup: true }
    );
  });
});

function unindent(str: string) {
  return str
    .split('\n')
    .map((value) => value.trim())
    .join('\n');
}

function makeGitConfig(remotes?: Record<string, string | undefined>): string {
  let config = `
    [core]
      repositoryformatversion = 0
      filemode = true
      bare = false
      logallrefupdates = true
  `;
  if (!remotes) return unindent(config);

  for (const [name, url] of Object.entries(remotes)) {
    config += `
      [remote "${name}"]
        fetch = +refs/heads/*:refs/remotes/origin/*
    `;
    if (url)
      config += `
      url = ${url}
    `;
  }

  return unindent(config);
}
