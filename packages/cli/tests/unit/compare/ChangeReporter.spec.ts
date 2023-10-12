import type { AppMapName } from '../../../src/cmds/compare/ChangeReport';
import ChangeReporter, {
  ChangeReportOptions,
  ReportFieldCalculator,
} from '../../../src/cmds/compare/ChangeReporter';
import { RevisionName } from '../../../src/cmds/compare/RevisionName';

describe('ChangeReporter', () => {
  describe('report', () => {
    it('marks new AppMaps as referenced', async () => {
      jest
        .spyOn(ReportFieldCalculator.prototype, 'findingDiff')
        .mockResolvedValue({ new: [], resolved: [] });
      jest.spyOn(ReportFieldCalculator.prototype, 'apiDiff').mockResolvedValue(undefined);
      jest.spyOn(ReportFieldCalculator.prototype, 'sqlDiff').mockResolvedValue(undefined);
      jest.spyOn(ReportFieldCalculator.prototype, 'sequenceDiagramDiff').mockResolvedValue({});

      const changeReporter = new ChangeReporter(
        'base-revision',
        'head-revision',
        'outputDir',
        'srcDir'
      );
      changeReporter.appMapMetadata = {
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
      changeReporter.baseAppMaps = new Set<AppMapName>();
      changeReporter.headAppMaps = new Set<AppMapName>(['example']);
      changeReporter.failedAppMaps = new Set<AppMapName>();

      const result = await changeReporter.report(new ChangeReportOptions());

      expect(result.newAppMaps).toEqual(['example']);
      expect(changeReporter.referencedAppMaps.test(RevisionName.Head, 'example')).toBeTruthy();
    });
  });
});
