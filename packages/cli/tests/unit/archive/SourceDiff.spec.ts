import { join } from 'path';
import { readFileSync } from 'fs';
import SourceDiff, { SourceDiffItem, SourceDiffQueue } from '../../../src/diffArchive/SourceDiff';
import * as executeCommand from '../../../src/lib/executeCommand';

import parsedUnifiedDiff from './fixtureData/parsedUnifiedDiff.json';
const exampleDiff = readFileSync(join(__dirname, 'fixtureData', 'exampleDiff.txt'), 'utf-8');
const addDeleteChangeRemoveDiff = readFileSync(
  join(__dirname, 'fixtureData', 'addDeleteChangeRemoveDiff.txt'),
  'utf-8'
);
const expectedDiff = readFileSync(join(__dirname, 'fixtureData', 'expectedDiff.txt'), 'utf-8');

describe('DiffLoader', () => {
  const baseRevision = 'the-base';
  const headRevision = 'the-head';

  afterEach(() => jest.restoreAllMocks());

  describe('lookupDiff', () => {
    let diffLoader: SourceDiff;

    beforeEach(() => (diffLoader = new SourceDiff(baseRevision, headRevision)));

    it('organizes the diff by file', async () => {
      jest.spyOn(SourceDiff, 'isEligibleFile').mockReturnValue(true);
      jest.spyOn(executeCommand, 'executeCommand').mockResolvedValue(exampleDiff);

      await diffLoader.update(new Set(['app']));

      expect(diffLoader.lookupDiff('app/controllers/users_controller.rb')).toEqual(expectedDiff);
      expect(diffLoader.lookupDiff('app/models/user.rb')).toBeUndefined();
    });

    it('ignores ineligible files', async () => {
      await diffLoader.update(new Set(['vendor', 'node_modules', 'file_not_exist']));

      expect(diffLoader.lookupDiff('app/models/user.rb')).toBeUndefined();
    });

    it('updates the diff information incrementally', async () => {
      jest.spyOn(SourceDiff, 'isEligibleFile').mockReturnValue(true);
      const executeCommandSpy = jest.spyOn(executeCommand, 'executeCommand');
      executeCommandSpy.mockResolvedValueOnce('');
      executeCommandSpy.mockResolvedValueOnce(exampleDiff);

      await diffLoader.update(new Set(['lib']));
      expect(executeCommandSpy).toHaveBeenCalledWith('git diff the-base..the-head -- lib', true);
      expect(diffLoader.lookupDiff('app/controllers/users_controller.rb')).toBeUndefined();

      await diffLoader.update(new Set(['app']));
      expect(executeCommandSpy).toHaveBeenCalledWith('git diff the-base..the-head -- app', true);
      expect(diffLoader.lookupDiff('app/controllers/users_controller.rb')).toEqual(expectedDiff);

      // This one should be a nop
      await diffLoader.update(new Set(['app']));
      expect(diffLoader.lookupDiff('app/controllers/users_controller.rb')).toEqual(expectedDiff);

      expect(executeCommandSpy).toHaveBeenCalledTimes(2);
    });

    it('reports on a variety of diff information', async () => {
      jest.spyOn(SourceDiff, 'isEligibleFile').mockReturnValue(true);
      const executeCommandSpy = jest.spyOn(executeCommand, 'executeCommand');
      executeCommandSpy.mockResolvedValueOnce(addDeleteChangeRemoveDiff);

      await diffLoader.update(new Set(['just-cant-be-empty']));

      expect(diffLoader.lookupDiff('.nvmrc')).toEqual(`--- .nvmrc
+++ .nvmrc.bak

`);
      expect(diffLoader.lookupDiff('.nvmrc.bak')).toEqual(`--- .nvmrc
+++ .nvmrc.bak

`);
      expect(diffLoader.lookupDiff('.ruby-version')).toEqual(`--- .ruby-version
+++ /dev/null
@@ -1 +0,0 @@
-ruby-3.0.2
`);
      expect(diffLoader.lookupDiff('.ruby-version-2')).toEqual(`--- /dev/null
+++ .ruby-version-2
@@ -0,0 +1 @@
+ruby-3.0.3
\\ No newline at end of file
`);
      expect(diffLoader.lookupDiff('app/controllers/users_controller.rb'))
        .toEqual(`--- app/controllers/users_controller.rb
+++ app/controllers/users_controller.rb
@@ -1,5 +1,5 @@
 class UsersController < ApplicationController
-  before_action :logged_in_user, only: [:index, :edit, :update, :destroy,
+  before_action :logged_in_user, only: [:index, :show, :edit, :update, :destroy,
                                         :following, :followers]
   before_action :correct_user,   only: [:edit, :update]
   before_action :admin_user,     only: :destroy
`);
    });
  });

  describe('Queue', () => {
    let q: SourceDiffQueue;

    beforeEach(() => (q = new SourceDiffQueue(baseRevision, headRevision)));

    it('processes a single diff request', async () => {
      const executeCommandSpy = jest.spyOn(executeCommand, 'executeCommand').mockResolvedValue('');

      const sourcePathRoots = new Set(['root-a']);
      const diff = await q.diff(sourcePathRoots);

      expect(JSON.stringify(diff)).toEqual(
        JSON.stringify({ command: 'git diff the-base..the-head -- root-a', files: [] })
      );
      expect(executeCommandSpy).toHaveBeenCalledTimes(1);
      expect(executeCommandSpy).toHaveBeenCalledWith('git diff the-base..the-head -- root-a', true);
    });

    it('returns an empty diff for empty roots', async () => {
      const diff = await q.diff(new Set<string>());
      expect(diff).toBeUndefined();
    });

    it('parses unified diff', async () => {
      jest.spyOn(executeCommand, 'executeCommand').mockResolvedValue(exampleDiff);

      const sourcePathRoots = new Set(['root-a']);
      const diff = await q.diff(sourcePathRoots);
      expect(JSON.stringify(diff?.files, null, 2)).toEqual(
        JSON.stringify(parsedUnifiedDiff, null, 2)
      );
    });

    it('serializes diff requests', async () => {
      jest.spyOn(executeCommand, 'executeCommand').mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return '';
      });

      const iterationCount = 10;
      const promises = new Array<Promise<SourceDiffItem | undefined>>();
      const startTime = new Date().getTime();
      for (let count = 0; count < iterationCount; count++) {
        const root = `root-${count}`;
        promises.push(q.diff(new Set([root])));
      }
      await Promise.all(promises);
      const endTime = new Date().getTime();
      expect(endTime - startTime).toBeGreaterThanOrEqual(iterationCount);
    });
  });
});
