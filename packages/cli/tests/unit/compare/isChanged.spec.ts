import { verbose } from '../../../src/utils';
import { isChanged } from '../../../src/cmds/compare/ChangeReporter';
import { Digests } from '../../../src/cmds/compare/Digests';
import { RevisionName } from '../../../src/cmds/compare/RevisionName';
import { AppMapName } from '../../../src/cmds/compare/ChangeReport';

if (process.env.VERBOSE) verbose(true);

describe('ChangeReporter.isChanged', () => {
  let digests: Digests;

  beforeEach(() => {
    digests = {
      appmapDigest: (_revisionName: RevisionName, _appmap: AppMapName) => 'digest-1',
    } as Digests;
  });
  afterEach(() => jest.restoreAllMocks());

  it('ignores non-test AppMaps', () => {
    expect(isChanged(new Set(['theappmap']), () => false, digests)('theappmap')).toBeFalsy();
  });

  it('ignores test AppMaps with matching digests', () => {
    expect(isChanged(new Set(['theappmap']), () => true, digests)('theappmap')).toBeFalsy();
  });

  it('ignores test AppMaps that are not in the base', () => {
    expect(isChanged(new Set([]), () => true, digests)('theappmap')).toBeFalsy();
  });

  it('reports test AppMaps with different digests', () => {
    jest
      .spyOn(digests, 'appmapDigest')
      .mockReturnValueOnce('digest-1')
      .mockReturnValueOnce('digest-2');
    expect(isChanged(new Set(['theappmap']), () => true, digests)('theappmap')).toBeTruthy();
  });
});
