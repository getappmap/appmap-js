import { AppMapFilter } from '@appland/models';
import updateSequenceDiagrams from './updateSequenceDiagrams';
import generateOpenAPI from './generateOpenAPI';
import { indexAppMaps } from './indexAppMaps';
import { scan } from './scan';

export default async function analyze(
  maxAppMapSizeInBytes: number,
  appMapFilter: AppMapFilter,
  appMapDir: string
): Promise<{ oversizedAppMaps: string[] }> {
  let oversizedAppMaps: string[];
  {
    const startTime = new Date().getTime();
    console.log(`Indexing AppMaps...`);
    const numIndexed = await indexAppMaps(appMapDir, maxAppMapSizeInBytes);
    const elapsed = new Date().getTime() - startTime;
    console.log(`Indexed ${numIndexed} AppMaps in ${elapsed}ms`);
  }
  {
    console.log('Generating sequence diagrams...');
    const result = await updateSequenceDiagrams(appMapDir, maxAppMapSizeInBytes, appMapFilter);
    process.stdout.write(`done (${result.numGenerated})\n`);
    oversizedAppMaps = result.oversizedAppMaps;
  }
  {
    const startTime = new Date().getTime();
    console.log('Generating OpenAPI...');
    await generateOpenAPI(appMapDir, maxAppMapSizeInBytes);
    const elapsed = new Date().getTime() - startTime;
    console.log(`Generated OpenAPI in ${elapsed}ms`);
  }
  {
    console.log('Scanning...');
    const result = await scan(appMapDir);
    process.stdout.write(`done (${result})\n`);
  }

  return { oversizedAppMaps };
}
