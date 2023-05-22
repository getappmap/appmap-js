import { AppMapFilter } from '@appland/models';
import updateSequenceDiagrams from './updateSequenceDiagrams';
import generateOpenAPI from './generateOpenAPI';
import { indexAppMaps } from './indexAppMaps';
import { scan } from './scan';

export default async function analyze(
  maxAppMapSizeInBytes: number,
  appMapFilter: AppMapFilter
): Promise<{ oversizedAppMaps: string[] }> {
  let oversizedAppMaps: string[];
  {
    process.stdout.write(`Indexing AppMaps...`);
    const numIndexed = await indexAppMaps('.', maxAppMapSizeInBytes);
    process.stdout.write(`done (${numIndexed})\n`);
  }
  {
    console.log('Generating sequence diagrams...');
    const result = await updateSequenceDiagrams('.', maxAppMapSizeInBytes, appMapFilter);
    process.stdout.write(`done (${result.numGenerated})\n`);
    oversizedAppMaps = result.oversizedAppMaps;
  }
  {
    console.log('Generating OpenAPI...');
    await generateOpenAPI('.', maxAppMapSizeInBytes);
  }
  {
    console.log('Scanning...');
    await scan('.');
    process.stdout.write(`done\n`);
  }

  return { oversizedAppMaps };
}
