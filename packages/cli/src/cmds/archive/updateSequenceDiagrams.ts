import { AppMapFilter, buildAppMap } from '@appland/models';
import {
  buildDiagram,
  format,
  FormatType,
  SequenceDiagramOptions,
  Specification,
} from '@appland/sequence-diagram';
import { queue } from 'async';
import { readFile, stat, unlink, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { basename, dirname, join } from 'path';
import { promisify } from 'util';
import { PreflightFilterConfig } from '../../lib/loadAppMapConfig';

/**
 * Default filters for each language - plus a set of default filters that apply to all languages.
 */
export const DefaultFilters: Record<string, string[]> = {
  default: [
    'label:unstable',
    'label:serialize',
    'label:deserialize.safe',
    'label:log',
    /^external-route:.*\bhttp:\/\/127\.0\.0\.1:\d+\/session\/[a-f0-9]{32,}\//.toString(), // Selenium
    /^query:[\s\S]*\bsqlite_master\b/.toString(),
    /^query:[\s\S]*\bpg_attribute\b/.toString(), // PostgreSQL schema tables
  ],
  ruby: [
    'label:mvc.template.resolver',
    'package:ruby',
    'package:logger',
    'package:activesupport',
    'package:openssl',
  ],
  python: [],
  java: [],
  javascript: [],
};

const Concurrency = 5;

export function buildAppMapFilter(
  preflightFilter: PreflightFilterConfig,
  language?: string
): AppMapFilter {
  const filter = new AppMapFilter();
  filter.declutter.hideMediaRequests.on = true;
  filter.declutter.limitRootEvents.on = true;

  const defaultFilterGroups = (): string[] => {
    const result = ['default'];
    if (language) result.push(language);
    return result;
  };

  const configuredFilterGroups = (): string[] | undefined => {
    if (!preflightFilter) return;

    return preflightFilter?.groups;
  };

  const filterGroups = configuredFilterGroups() || defaultFilterGroups();
  const filterGroupNames = filterGroups.map((group) => DefaultFilters[group]).flat();
  const filterNames = preflightFilter?.names || [];

  if (filterGroupNames.length > 0 || filterNames.length > 0) {
    filter.declutter.hideName.on = true;
    filter.declutter.hideName.names = [...new Set([...filterGroupNames, ...filterNames])].sort();
  }

  return filter;
}

export default async function updateSequenceDiagrams(
  dir: string,
  maxAppMapSizeInBytes: number,
  filter: AppMapFilter
): Promise<{ oversizedAppMaps: string[] }> {
  const specOptions = {
    loops: true,
  } as SequenceDiagramOptions;

  const oversizedAppMaps = new Array<string>();
  const sequenceDiagramQueue = queue(async (appmapFileName: string) => {
    // Determine size of file appmapFileName in bytes
    const stats = await stat(appmapFileName);
    if (stats.size > maxAppMapSizeInBytes) {
      console.log(
        `Skipping, and removing, ${appmapFileName} because its size of ${stats.size} exceeds the maximum size of ${maxAppMapSizeInBytes} MB`
      );
      oversizedAppMaps.push(appmapFileName);
      await unlink(appmapFileName);
      return;
    }

    const fullAppMap = buildAppMap()
      .source(await readFile(appmapFileName, 'utf8'))
      .build();
    const filteredAppMap = filter.filter(fullAppMap, []);
    const specification = Specification.build(filteredAppMap, specOptions);
    const diagram = buildDiagram(appmapFileName, filteredAppMap, specification);
    const diagramOutput = format(FormatType.JSON, diagram, appmapFileName);
    const indexDir = join(dirname(appmapFileName), basename(appmapFileName, '.appmap.json'));
    const diagramFileName = join(indexDir, 'sequence.json');
    await writeFile(diagramFileName, diagramOutput.diagram);
  }, Concurrency);
  sequenceDiagramQueue.error(console.warn);

  (await promisify(glob)(join(dir, '**', '*.appmap.json'))).forEach((appmapFileName) =>
    sequenceDiagramQueue.push(appmapFileName)
  );
  if (sequenceDiagramQueue.length()) await sequenceDiagramQueue.drain();

  return { oversizedAppMaps };
}
