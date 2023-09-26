import { verbose } from '../../../src/utils';
import { isAdded } from '../../../src/cmds/compare/ChangeReporter';

if (process.env.VERBOSE) verbose(true);

describe('ChangeReporter.isAdded', () => {
  afterEach(() => jest.restoreAllMocks());

  it('ignores non-test AppMaps', () => {
    expect(isAdded(new Set(['theappmap']), () => false)('theappmap')).toBeFalsy();
  });

  it('reports test AppMaps that are not in the base', () => {
    expect(isAdded(new Set([]), () => true)('theappmap')).toBeTruthy();
  });
});
