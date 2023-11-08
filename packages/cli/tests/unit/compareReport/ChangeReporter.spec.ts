import { warn } from 'console';
import ChangeReporter from '../../../src/cmds/compare-report/ChangeReporter';
import { ChangeReport } from '../../../src/cmds/compare/ChangeReport';

describe('ChangeReporter', () => {
  it('reports warnings which occur during processing', async () => {
    const appmapURL = 'https://appmap.example.com';
    const changeReportData: ChangeReport = {
      testFailures: [],
      newAppMaps: [],
      removedAppMaps: [],
      changedAppMaps: [],
      appMapMetadata: {
        base: {},
        head: {},
      },
      sequenceDiagramDiff: {},
      warnings: {
        apiDiff: [
          `Validation errors in "head": Swagger schema validation failed. \n  Additional properties not allowed: -1 at #/paths///get/responses\n \nJSON_OBJECT_VALIDATION_FAILED`,
        ],
      },
    };
    const changeReporter = new ChangeReporter(appmapURL);
    const report = await changeReporter.generateReport(changeReportData);
    warn(report);
    expect(report).toContain(`**Warnings occurred during analysis:**

\`\`\`
(apiDiff) Validation errors in "head": Swagger schema validation failed.`);
  });
});
