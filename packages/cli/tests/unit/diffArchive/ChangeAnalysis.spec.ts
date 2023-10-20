import type { AppMapName } from '../../../src/cmds/compare/ChangeReport';
import { ChangeAnalysisImpl } from '../../../src/diffArchive/ChangeAnalysis';
import { RevisionName } from '../../../src/diffArchive/RevisionName';
import * as loadFindings from '../../../src/diffArchive/loadFindings';

describe('ChangeAnalysis', () => {
  let changeAnalysis: ChangeAnalysisImpl;

  beforeEach(() => {
    changeAnalysis = new ChangeAnalysisImpl(
      'base-revision',
      'head-revision',
      'outputDir',
      'srcDir'
    );
  });

  describe('computeReferencedAppMaps', () => {
    it('marks new AppMaps as referenced', async () => {
      changeAnalysis.appMapMetadata = {
        base: new Map(),
        head: new Map([
          [
            'example',
            {
              recorder: {
                type: 'tests',
              },
            } as any,
          ],
        ]),
      };
      changeAnalysis.baseAppMaps = new Set<AppMapName>();
      changeAnalysis.headAppMaps = new Set<AppMapName>(['example']);
      changeAnalysis.failedAppMaps = new Set<AppMapName>();
      changeAnalysis.findingDiff = { new: [], resolved: [] };

      await changeAnalysis.loadAppMapChanges();
      await changeAnalysis.computeReferencedAppMaps();

      expect(changeAnalysis.referencedAppMaps).toBeDefined();
      expect(changeAnalysis.referencedAppMaps.test(RevisionName.Head, 'example')).toBeTruthy();
    });
  });

  describe('findingDiff', () => {
    it('deduplicates findings by hash_v2', async () => {
      changeAnalysis.baseManifest = { appmap_dir: 'tmp/appmap' } as any;
      changeAnalysis.headManifest = { appmap_dir: 'tmp/appmap' } as any;

      jest.spyOn(loadFindings, 'default').mockImplementation((_, revision) => {
        if (revision === RevisionName.Base) {
          return Promise.resolve([{ hash_v2: 'old' } as any, { hash_v2: 'old' as any }]);
        } else {
          return Promise.resolve([{ hash_v2: 'new' } as any, { hash_v2: 'new' as any }]);
        }
      });

      await changeAnalysis.loadFindingDiff();
      expect(changeAnalysis.findingDiff).toEqual({
        new: [{ hash_v2: 'new' }],
        resolved: [{ hash_v2: 'old' }],
      });
    });
  });
});
