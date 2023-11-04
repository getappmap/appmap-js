import { default as openapiDiff } from 'openapi-diff';

import ChangeAnalysis from '../../diffArchive/ChangeAnalysis';
import { AppMapName, ChangeReport, SQLDiff, TestFailure } from './ChangeReport';
import { RevisionName } from '../../diffArchive/RevisionName';
import ReportFieldCalculator from './ReportFieldCalculator';
import { buildFailure } from './buildFailure';
import { exists } from '../../utils';
import mapToRecord from './mapToRecord';
import { warn } from 'console';

export const DEFAULT_SNIPPET_WIDTH = 10;

export class ChangeReportOptions {
  reportRemoved = true;
  snippetWidth = DEFAULT_SNIPPET_WIDTH;
}

export default async function reportChanges(
  changeAnalysis: ChangeAnalysis,
  options: ChangeReportOptions
): Promise<ChangeReport> {
  const { appMapMetadata, failedAppMaps } = changeAnalysis;

  let apiDiff: openapiDiff.DiffOutcome | undefined;

  const generator = new ReportFieldCalculator(changeAnalysis);

  const failureFn = buildFailure(appMapMetadata, options.snippetWidth);
  const testFailures = new Array<TestFailure>();
  for (const appmap of failedAppMaps) {
    const testFailure = await failureFn(appmap);
    if (testFailure) {
      testFailures.push(testFailure);
    }
  }

  let sqlDiff: SQLDiff | undefined;
  if (testFailures.length === 0) {
    apiDiff = await generator.apiDiff(options.reportRemoved);
    sqlDiff = await generator.sqlDiff(options.reportRemoved);
  }

  const sequenceDiagramExists = async (revisionName: RevisionName, appmap: AppMapName) => {
    const path = changeAnalysis.paths.sequenceDiagramPath(revisionName, appmap);
    return await exists(path);
  };

  // Limit AppMap metadata to only those AppMaps that have a sequence diagram.
  for (const revisionName of [RevisionName.Base, RevisionName.Head]) {
    const metadataByPath = appMapMetadata[revisionName];
    for (const appmap of metadataByPath.keys()) {
      if (!(await sequenceDiagramExists(revisionName as RevisionName, appmap))) {
        warn(`No sequence diagram found for ${revisionName} AppMap ${appmap}`);
        metadataByPath.delete(appmap);
      }
    }
  }

  const changedAppMaps = changeAnalysis.changedAppMaps.map((appmap) => ({ appmap }));
  const sequenceDiagramDiff = await generator.sequenceDiagramDiff(changedAppMaps);

  const result: ChangeReport = {
    testFailures,
    newAppMaps: changeAnalysis.newAppMaps,
    removedAppMaps: changeAnalysis.removedAppMaps,
    changedAppMaps,
    sequenceDiagramDiff,
    appMapMetadata: {
      [RevisionName.Base]: mapToRecord(appMapMetadata[RevisionName.Base]),
      [RevisionName.Head]: mapToRecord(appMapMetadata[RevisionName.Head]),
    },
  };

  if (changeAnalysis.findingDiff) result.findingDiff = changeAnalysis.findingDiff;
  if (sqlDiff) result.sqlDiff = sqlDiff;
  if (apiDiff) result.apiDiff = apiDiff;
  if (Object.keys(generator.warnings).length > 0) result.warnings = generator.warnings;

  return result;
}
