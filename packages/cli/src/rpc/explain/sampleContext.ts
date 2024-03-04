import { readFile } from 'fs/promises';
import { processNamedFiles } from '../../utils';

type Dependency = {
  caller: string;
  callee: string;
};

export default async function sampleContext(
  appmapDir: string,
  // TODO: Traverse specific AppMaps only
  appmaps: string[] | undefined,
  // TODO: Respect this limit
  charLimit: number
): Promise<{
  sequenceDiagrams: string[];
  codeSnippets: Record<string, string>;
  codeObjects: string[];
}> {
  const httpClientRequests = new Set<string>();
  const packageDependencies = new Set<string>();

  const collectValues = (
    values: Set<string>,
    handler: (value: any) => string
  ): ((file: string) => Promise<void>) => {
    return async (file: string): Promise<void> => {
      for (const value of JSON.parse(await readFile(file, 'utf-8'))) values.add(handler(value));
    };
  };

  await processNamedFiles(
    appmapDir,
    'canonical.httpClientRequest.json',
    collectValues(httpClientRequests, (value: string) => value)
  );
  await processNamedFiles(
    appmapDir,
    'canonical.packageDependencies.json',
    collectValues(packageDependencies, (value: Dependency) =>
      [value.caller, value.callee].join(' -> ')
    )
  );

  return {
    sequenceDiagrams: [],
    codeSnippets: { 'dependencies.txt': [...packageDependencies].sort().join('\n') },
    codeObjects: [...httpClientRequests].sort(),
  };
}
