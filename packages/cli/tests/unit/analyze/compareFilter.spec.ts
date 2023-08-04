import { AppMapFilter } from '@appland/models';
import { CompareFilter } from '../../../src/lib/loadAppMapConfig';
import { verbose } from '../../../src/utils';
import buildFilter, { HIDE_OPTIONS, Language } from '../../../src/cmds/archive/buildFilter';

if (process.env.VERBOSE) verbose(true);

describe('CompareFilter', () => {
  describe('merging with default filter', () => {
    function testFilterMerge(
      description: string,
      language: Language,
      compareFilter: CompareFilter,
      configureFilter: (filter: AppMapFilter) => void
    ) {
      it(description, () => {
        const expectedFilter = new AppMapFilter();
        configureFilter(expectedFilter);
        const filter = buildFilter(language, compareFilter);
        expect(JSON.stringify(filter, null, 2)).toEqual(JSON.stringify(expectedFilter, null, 2));
      });
    }

    describe('for Ruby', () => {
      testFilterMerge(
        'hide_external is on by default',
        'ruby',
        { hide: [] },
        (filter) => (filter.declutter.hideExternalPaths.on = true)
      );
      testFilterMerge(
        'merges dependency_folders',
        'ruby',
        { hide: [], dependency_folders: ['aaa'] },
        (filter) => {
          filter.declutter.hideExternalPaths.on = true;
          filter.declutter.hideExternalPaths.dependencyFolders = ['aaa'];
        }
      );
      testFilterMerge(
        'hide_name can be explicitly specified',
        'ruby',
        { hide: [], hide_name: ['aaa'] },
        (filter) => {
          filter.declutter.hideExternalPaths.on = true;
          filter.declutter.hideName.on = true;
          filter.declutter.hideName.names = ['aaa'].sort();
        }
      );

      testFilterMerge(
        'hide_external can be disabled',
        'ruby',
        { hide: [], hide_external: false },
        (filter) => (filter.declutter.hideExternalPaths.on = false)
      );
    });
    describe('in Java', () => {
      testFilterMerge(
        'hide_external is disabled by default',
        'java',
        { hide: [] },
        (filter) => filter
      );
      testFilterMerge(
        'hide_external can be enabled',
        'java',
        { hide: [], hide_external: true },
        (filter) => (filter.declutter.hideExternalPaths.on = true)
      );
      testFilterMerge(
        'merges dependency_folders',
        'java',
        { hide: [], dependency_folders: ['aaa'] },
        (filter) => {
          filter.declutter.hideExternalPaths.on = false;
          filter.declutter.hideExternalPaths.dependencyFolders = ['aaa'];
        }
      );
      testFilterMerge(
        'merges hide_external with dependency_folders',
        'java',
        { hide: [], hide_external: true, dependency_folders: ['aaa'] },
        (filter) => {
          filter.declutter.hideExternalPaths.on = true;
          filter.declutter.hideExternalPaths.dependencyFolders = ['aaa'];
        }
      );
    });
    describe('hide options', () => {
      const allHideNames = Object.values(HIDE_OPTIONS).flat();

      it('are all on by default', () => {
        const filter = buildFilter('java', {});
        expect(filter.declutter.hideName.on).toEqual(true);
        expect(filter.declutter.hideName.names.sort()).toEqual(
          allHideNames.map((name) => name.toString()).sort()
        );
      });
      testFilterMerge('can be selectively enabled', 'java', { hide: ['selenium'] }, (filter) => {
        filter.declutter.hideName.on = true;
        filter.declutter.hideName.names = HIDE_OPTIONS.selenium
          .map((rexpg) => rexpg.toString())
          .sort();
      });
      testFilterMerge('can be selectively disabled', 'java', { reveal: ['selenium'] }, (filter) => {
        filter.declutter.hideName.on = true;
        filter.declutter.hideName.names = allHideNames
          .filter((name) => !HIDE_OPTIONS.selenium.includes(name))
          .map((rexpg) => rexpg.toString())
          .sort();
      });
    });
  });
});
