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
    console.log(`Indexing AppMaps...`);
    const startTime = new Date().getTime();
    const numIndexed = await indexAppMaps(appMapDir, maxAppMapSizeInBytes);
    const elapsed = new Date().getTime() - startTime;
    console.log(`Indexed ${numIndexed} AppMaps in ${elapsed}ms`);
  }
  {
    console.log('Generating sequence diagrams...');
    const startTime = new Date().getTime();
    const result = await updateSequenceDiagrams(appMapDir, maxAppMapSizeInBytes, compareFilter);
    const elapsed = new Date().getTime() - startTime;
    console.log(`Generated ${result.numGenerated} sequence diagrams in ${elapsed}ms`);
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
