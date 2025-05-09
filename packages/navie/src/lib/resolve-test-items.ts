import { z } from 'zod';
import { TestItem } from '../commands/review2-command';
import checkFileExistence from './check-file-existance';
import LookupContextService from '../services/lookup-context-service';
import { ProjectInfo } from '../project-info';
import { isAbsolute, join } from 'path';

type ResolvedTestItem = z.infer<typeof TestItem>;

/**
 * Resolves a list of suggested test items to select test file names that are valid
 * test files within one of the project directories.
 */
export default async function resolveTestItems(
  lookupContextService: LookupContextService,
  projectInfo: ProjectInfo[],
  suggestedTestItems: ResolvedTestItem[]
): Promise<ResolvedTestItem[]> {
  const testItemByFile = new Map<string, ResolvedTestItem[]>();
  const storeTestItem = (file: string, testItem: ResolvedTestItem) => {
    const testItemsForPath = testItemByFile.get(file);
    if (testItemsForPath) {
      testItemsForPath.push(testItem);
    } else {
      testItemByFile.set(file, [testItem]);
    }
  };

  // For each test item, select the test item path (if it's absolute), or
  // the spread of the test item path with each project directory.
  const suggestedTestFilePaths = suggestedTestItems
    .map((test) => {
      if (isAbsolute(test.file)) {
        storeTestItem(test.file, test);
        return test.file;
      }

      const filePaths = projectInfo.map((info) => join(info.directory, test.file));
      for (const filePath of filePaths) storeTestItem(filePath, test);
      return filePaths;
    })
    .flat();

  // Then lookup the possible test file paths in the context service, to see which ones exist.
  const existingTestFilePaths = await checkFileExistence(
    lookupContextService,
    suggestedTestFilePaths
  );

  // Finally, filter the test items to only include those that exist in the context service.
  const result = new Array<z.infer<typeof TestItem>>();
  for (const testFilePath of existingTestFilePaths) {
    const testItems = testItemByFile.get(testFilePath);
    if (testItems) {
      result.push(...testItems);
    }
  }
  return result;
}
