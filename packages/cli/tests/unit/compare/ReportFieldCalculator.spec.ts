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

  describe('formatEndpoint', () => {
    it('should format endpoints correctly', async () => {
      const changeReporter = new ChangeReporter('base', 'head', 'outputDir', 'srcDir');
      const reportFieldCalculator = new ReportFieldCalculator(changeReporter);

      const result1 = await reportFieldCalculator.formatEndpoint(
        'paths./microposts.post.responses.302'
      );
      expect(result1).toEqual('302 POST /microposts');

      const result2 = await reportFieldCalculator.formatEndpoint(
        'paths./microposts.post.responses.422'
      );
      expect(result2).toEqual('422 POST /microposts');

      const result3 = await reportFieldCalculator.formatEndpoint('paths./microposts/{id}');
      expect(result3).toEqual('/microposts/{id}');

      const result4 = await reportFieldCalculator.formatEndpoint('randomString');
      expect(result4).toEqual('randomString');
    });
  });
});
