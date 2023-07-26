import parseFilterArgs from '../../../src/cmds/archive/parseFilterArgs';
import { CompareFilter } from '../../../src/lib/loadAppMapConfig';
import { verbose } from '../../../src/utils';

if (process.env.VERBOSE) verbose(true);

describe('parseFilterArgs', () => {
  function testFilterArgs(
    description: string,
    filterArgs: string[],
    configureFilter: (filter: CompareFilter) => void
  ) {
    it(description, () => {
      const expectedFilter: CompareFilter = {};
      configureFilter(expectedFilter);
      const filter: CompareFilter = {};
      parseFilterArgs(filter, filterArgs);
      expect(JSON.stringify(filter, null, 2)).toEqual(JSON.stringify(expectedFilter, null, 2));
    });
  }

  testFilterArgs(
    'handles hide_external',
    ['hide_external=true'],
    (filter) => (filter.hide_external = true)
  );

  testFilterArgs(
    'ignores all repeated hide_external options',
    ['hide_external=true', 'hide_external=false', 'hide_external=xxx'],
    (filter) => filter
  );

  testFilterArgs('ignores invalid boolean option', ['hide_external=xxx'], (filter) => filter);

  testFilterArgs(
    'single dependency_folders',
    ['dependency_folders=foo'],
    (filter) => (filter.dependency_folders = ['foo'])
  );

  testFilterArgs(
    'multiple dependency_folders',
    ['dependency_folders=foo', 'dependency_folders=bar'],
    (filter) => (filter.dependency_folders = ['foo', 'bar'])
  );

  testFilterArgs(
    'mixture of hide and reveal, with repeats',
    ['hide=pg_metadata', 'hide=selenium', 'reveal=sqlite_metadata'],
    (filter) => {
      filter.hide = ['pg_metadata', 'selenium'];
      filter.reveal = ['sqlite_metadata'];
    }
  );
});
