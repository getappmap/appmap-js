import { readFile } from 'fs/promises';
import { isAbsolute, relative } from 'path';
import { RevisionName } from '../../diffArchive/RevisionName';
import { AppMapName, TestFailure } from './ChangeReport';
import { exists } from '../../utils';
import { warn } from 'console';
import { AppMapMetadata } from '../../diffArchive/ChangeAnalysis';
import { DEFAULT_SNIPPET_WIDTH } from './reportChanges';

export function buildFailure(
  appMapMetadata: AppMapMetadata,
  snippetWidth = DEFAULT_SNIPPET_WIDTH
): (appmap: AppMapName) => Promise<TestFailure | undefined> {
  return async (appmap: AppMapName) => {
    const metadata = appMapMetadata[RevisionName.Head].get(appmap);
    if (!metadata) {
      warn(`No AppMap metadata available for failed test ${appmap}`);
      return;
    }
    const testFailure = {
      appmap,
      name: metadata.name,
    } as TestFailure;
    if (metadata.source_location) {
      testFailure.testLocation = isAbsolute(metadata.source_location)
        ? relative(process.cwd(), metadata.source_location)
        : metadata.source_location;
    }
    if (metadata.test_failure) {
      testFailure.failureMessage = metadata.test_failure.message;
      const location = metadata.test_failure.location;
      if (location) {
        testFailure.failureLocation = location;
        const [path, linenoStr] = location.split(':');
        if (linenoStr && (await exists(path))) {
          const lineno = parseInt(linenoStr, 10);
          const failureCauseCode = (await readFile(path, 'utf-8')).split('\n');
          const minIndex = Math.max(lineno - snippetWidth, 0);
          const maxIndex = Math.min(lineno + snippetWidth, failureCauseCode.length);
          testFailure.testSnippet = {
            codeFragment: failureCauseCode.slice(minIndex, maxIndex).join('\n'),
            startLine: minIndex + 1,
            language: metadata.language?.name,
          };
        }
      }
    }
    return testFailure;
  };
}
