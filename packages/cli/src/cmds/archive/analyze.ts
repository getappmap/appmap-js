import updateSequenceDiagrams from './updateSequenceDiagrams';
import generateOpenAPI from './generateOpenAPI';
import { indexAppMaps } from './indexAppMaps';
import { scan } from './scan';
import { CompareFilter } from '../../lib/loadAppMapConfig';

export default async function analyze(
  maxAppMapSizeInBytes: number,
  compareFilter: CompareFilter,
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
    const result = await updateSequenceDiagrams(appMapDir, maxAppMapSizeInBytes, compareFilter);
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
    const startTime = new Date().getTime();
    console.log('Scanning...');
    const result = await scan(appMapDir);
    const elapsed = new Date().getTime() - startTime;
    console.log(`Scanned ${result} AppMaps in ${elapsed}ms`);
  }

  return { oversizedAppMaps };
}
