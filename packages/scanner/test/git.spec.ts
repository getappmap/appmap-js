import { join } from 'path';
import lastGitOrFSModifiedDate, {
  fileModifiedDate,
  gitExists,
  gitModifiedDate,
  isCached,
  resetCache,
} from '../src/lastGitOrFSModifiedDate';
import { mkdir, rmdir } from 'fs/promises';
import { randomUUID } from 'crypto';
import { writeFile } from 'fs/promises';
import { exec } from 'child_process';

const workDir = join(__dirname, 'work');

function cmd(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout) => {
      if (err) reject(err);

      resolve(stdout);
    });
  });
}

describe(lastGitOrFSModifiedDate, () => {
  beforeEach(resetCache);
  beforeEach(async () => await mkdir(workDir, { recursive: true }));

  afterEach(resetCache);
  afterEach(() => jest.resetAllMocks());
  afterEach(async () => await rmdir(workDir, { recursive: true }));

  describe(gitExists, () => {
    it('should be true', async () => {
      expect(await gitExists()).toBe(true);
    });
  });

  describe(`a newly created file`, () => {
    let newFileName: string;
    let createdAfter: Date;
    let createdBefore: Date;
    beforeEach(() => (newFileName = join(workDir, randomUUID())));
    beforeEach(async () => {
      createdAfter = new Date();
      await writeFile(newFileName, 'initial state');
      createdBefore = new Date();
    });

    it('git modified date is undefined', async () => {
      expect(await gitModifiedDate(newFileName)).toBe(undefined);
    });
    it('file modified date checks out', async () => {
      expect((await fileModifiedDate(newFileName))?.getTime()).toBeGreaterThanOrEqual(
        createdAfter.getTime() - 1000 // timestamp precision can be down to a second depending on the filesystem
      );
      expect((await fileModifiedDate(newFileName))?.getTime()).toBeLessThanOrEqual(
        createdBefore.getTime() + 1000
      );
    });
    it('last git or fs modified date is the fs modified date', async () => {
      expect(await lastGitOrFSModifiedDate(newFileName)).toEqual(
        await fileModifiedDate(newFileName)
      );
    });

    describe('once added to git', () => {
      beforeEach(async () => cmd(`git add ${newFileName}`));
      afterEach(async () => cmd(`git reset ${newFileName}`));

      it('git modified date is not available', async () => {
        expect(await gitModifiedDate(newFileName)).toBeUndefined();
      });
      describe('and modified', () => {
        beforeEach(async () => await writeFile(newFileName, 'modified state'));
        it('the file modified date is still the relevant one', async () => {
          expect(await gitModifiedDate(newFileName)).toBeUndefined();
          expect(await fileModifiedDate(newFileName)).not.toBeUndefined();
        });
      });
    });
  });
  describe(`a file with a git history`, () => {
    const existingFileName = 'package.json';

    it('git modified date is available', async () => {
      expect(await gitModifiedDate(existingFileName)).not.toBeUndefined();
    });
    it('last git or fs modified date is the git modified date', async () => {
      expect(await lastGitOrFSModifiedDate(existingFileName)).toEqual(
        await gitModifiedDate(existingFileName)
      );
    });
    it('last git or fs modified date is cached', async () => {
      await lastGitOrFSModifiedDate(existingFileName);

      expect(isCached(existingFileName)).toBe(true);
    });
  });
});
