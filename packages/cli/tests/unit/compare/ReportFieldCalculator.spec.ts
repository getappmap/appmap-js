import ChangeReporter, { ReportFieldCalculator } from '../../../src/cmds/compare/ChangeReporter';
import { RevisionName } from '../../../src/cmds/compare/RevisionName';
import * as loadFindings from '../../../src/cmds/compare/loadFindings';

describe('ReportFieldCalculator', () => {
  describe('findingDiff', () => {
    it('deduplicates findings by hash_v2', async () => {
      const changeReporter = new ChangeReporter('base', 'head', 'outputDir', 'srcDir');
      changeReporter.baseManifest = {} as any;
      changeReporter.headManifest = {} as any;

      jest.spyOn(loadFindings, 'default').mockImplementation((_, revision) => {
        if (revision === RevisionName.Base) {
          return Promise.resolve([{ hash_v2: 'old' } as any, { hash_v2: 'old' as any }]);
        } else {
          return Promise.resolve([{ hash_v2: 'new' } as any, { hash_v2: 'new' as any }]);
        }
      });

      const reportFieldCalculator = new ReportFieldCalculator(changeReporter);
      const result = await reportFieldCalculator.findingDiff(true);
      expect(result).toEqual({
        new: [{ hash_v2: 'new' }],
        resolved: [{ hash_v2: 'old' }],
      });
    });
  });
});
