import { join } from 'path';
import { ContextV2 } from '../context';
import LookupContextService from '../services/lookup-context-service';

/**
 * Checks if a list of file paths exist in the file system by looking them up in the context service.
 * We leverage the context location filter for this purpose. The file paths should be absolute,
 * because the location lookup will return `directory + filePath` pairs.
 */
export default async function checkFileExistence(
  lookupContextService: LookupContextService,
  filePaths: string[]
): Promise<Set<string>> {
  const contextResults = await lookupContextService.lookupContext([], 0, {
    locations: filePaths,
  });

  const locations = new Set(
    contextResults
      .filter(ContextV2.isFileContextItem)
      .filter((context) => context.location)
      .map((context) => join(context.directory, context.location))
  );

  return new Set(filePaths.filter((filePath) => locations.has(filePath)));
}
