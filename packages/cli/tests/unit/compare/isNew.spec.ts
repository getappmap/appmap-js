import { verbose } from '../../../src/utils';
import { isNew } from '../../../src/cmds/compare/ChangeReporter';

if (process.env.VERBOSE) verbose(true);

describe('ChangeReporter.isNew', () => {
  afterEach(() => jest.restoreAllMocks());

  it('ignores non-test AppMaps', () => {
    expect(isNew(new Set(['theappmap']), () => false)('theappmap')).toBeFalsy();
  });

  it('reports test AppMaps that are not in the base', () => {
    expect(isNew(new Set([]), () => true)('theappmap')).toBeTruthy();
  });
});
