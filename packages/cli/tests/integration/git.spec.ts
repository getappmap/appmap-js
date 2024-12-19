import { tmpdir } from 'node:os';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { execute } from '../../src/lib/executeCommand';
import { getWorkingDiff } from '../../src/lib/git';

describe('git', () => {
  let projectDirectory: string;

  const createFile = async (file: string, content: string) => {
    const directory = dirname(file);
    await mkdir(directory, { recursive: true });
    await writeFile(join(projectDirectory, file), content);
  };

  const commitFile = async (file: string, message: string) => {
    await execute('git', ['add', file], { cwd: projectDirectory });
    await execute('git', ['commit', '-m', message], { cwd: projectDirectory });
  };

  const createBranch = (branch: string) =>
    execute('git', ['checkout', '-b', branch], { cwd: projectDirectory });

  beforeEach(async () => {
    projectDirectory = await mkdtemp(join(tmpdir(), 'appmap-git-test-'));
    await execute('git', ['init'], { cwd: projectDirectory });
    await execute('git', ['config', 'user.name', 'Test User'], { cwd: projectDirectory });
    await execute('git', ['config', 'user.email', 'test@example.com'], { cwd: projectDirectory });
    await createFile('README.md', '# Hello World');
    await commitFile('README.md', 'initial commit');
  });

  afterEach(async () => {
    await rm(projectDirectory, { recursive: true, force: true });
  });

  describe('getWorkingDiff', () => {
    beforeEach(async () => {
      await createBranch('feature-branch');
    });

    it('does not return committed changes', async () => {
      await createFile('file1.txt', 'file1');
      await commitFile('file1.txt', 'add file1');

      const result = await getWorkingDiff(projectDirectory);
      expect(result).toStrictEqual('');
    });

    it('returns unstaged changes to tracked and untracked files', async () => {
      // Two new files
      await createFile('file1.txt', 'file1');
      await createFile('file2.txt', 'file2');

      // Track one, then update it
      await commitFile('file1.txt', 'add file1');
      await createFile('file1.txt', 'file1 updated');

      const result = await getWorkingDiff(projectDirectory);
      expect(result).toContain('file1 updated');
      expect(result).toContain('file2');
      expect(result).not.toContain('README.md');
    });

    it('is not susceptible to command injection', async () => {
      await createFile(';echo injection', 'file1');

      const result = await getWorkingDiff(projectDirectory);
      expect(result).toContain('+++ b/;echo injection');
      expect(result).toContain('file1');
    });
  });
});
