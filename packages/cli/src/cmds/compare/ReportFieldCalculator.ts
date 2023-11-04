import { queue } from 'async';
import {
  DiffOutcomeFailure,
  DiffOutcomeSuccess,
  DiffResult,
  DiffResultType,
  default as openapiDiff,
} from 'openapi-diff';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join, relative } from 'path';

import { FormatType, format } from '@appland/sequence-diagram';

import ChangeAnalysis from '../../diffArchive/ChangeAnalysis';
import { DiffDiagrams } from '../../sequenceDiagramDiff/DiffDiagrams';
import {
  AppMapLink,
  AppMapName,
  ChangedAppMap,
  SQLDiff,
  SQLQueryReference,
  Warning,
} from './ChangeReport';
import { SourceDiff } from './SourceDiff';
import { loadSequenceDiagram } from './loadSequenceDiagram';
import { RevisionName } from '../../diffArchive/RevisionName';
import mapToRecord from './mapToRecord';
import { resolvePath } from '../../lib/resolvePath';
import { buildAppMap, normalizeSQL } from '@appland/models';
import { warn } from 'console';
import { exists } from '../../utils';

export default class ReportFieldCalculator {
  sourceDiff: SourceDiff;
  warnings: Warning[] = [];

  constructor(public changeAnalysis: ChangeAnalysis) {
    this.sourceDiff = new SourceDiff(
      changeAnalysis.baseRevision,
      changeAnalysis.headRevision,
      changeAnalysis.paths
    );
  }

  async sequenceDiagramDiff(changedAppMaps: ChangedAppMap[]): Promise<Record<string, string[]>> {
    const diffDiagrams = new DiffDiagrams();
    const sequenceDiagramDiff = new Map<string, AppMapLink[]>();
    {
      const q = queue(async (changedAppMap: ChangedAppMap) => {
        const { appmap } = changedAppMap;

        const sourceDiff = await this.sourceDiff.get(appmap);
        if (sourceDiff) changedAppMap.sourceDiff = sourceDiff;

        const baseDiagram = await loadSequenceDiagram(
          this.changeAnalysis.paths.sequenceDiagramPath(RevisionName.Base, appmap)
        );
        const headDiagram = await loadSequenceDiagram(
          this.changeAnalysis.paths.sequenceDiagramPath(RevisionName.Head, appmap)
        );
        const diagramDiff = diffDiagrams.diff(baseDiagram, headDiagram);
        if (diagramDiff) {
          const diagramJSON = format(FormatType.JSON, diagramDiff, 'diff');
          const path = this.changeAnalysis.paths.sequenceDiagramDiffPath(appmap);
          await mkdir(dirname(path), { recursive: true });
          await writeFile(path, diagramJSON.diagram);
          changedAppMap.sequenceDiagramDiff = relative(
            join(this.changeAnalysis.paths.workingDir, 'diff'),
            path
          );

          // Build a text snippet for each top level context.
          const allActions = [...diagramDiff.rootActions];
          for (let actionIndex = 0; actionIndex < diagramDiff.rootActions.length; actionIndex++) {
            const action = diagramDiff.rootActions[actionIndex];
            diagramDiff.rootActions = [action];
            const snippet = format(FormatType.Text, diagramDiff, 'diff');
            // TODO: nop if this is the empty string
            if (!sequenceDiagramDiff.has(snippet.diagram))
              sequenceDiagramDiff.set(snippet.diagram, []);
            sequenceDiagramDiff.get(snippet.diagram)?.push(appmap);
          }
          diagramDiff.rootActions = allActions;
        }
      }, 2);
      q.error(console.warn);
      changedAppMaps.forEach((appmap) => q.push(appmap));
      if (!q.idle()) await q.drain();
    }
    const record = mapToRecord(sequenceDiagramDiff);
    for (const key of Object.keys(record)) {
      record[key] = record[key].sort();
    }
    return record;
  }

  async apiDiff(reportRemoved: boolean): Promise<openapiDiff.DiffOutcome | undefined> {
    const baseDefinitions = await this.readOpenAPI(RevisionName.Base);
    const headDefinitions = await this.readOpenAPI(RevisionName.Head);
    if (!baseDefinitions || !headDefinitions) return;

    const handleOpenAPIDiffError = (message: string) => {
      this.warnings.push({
        field: 'apiDiff',
        message: message,
      });
    };

    const diffOpenAPI = async (): Promise<openapiDiff.DiffOutcome | undefined> => {
      try {
        return await openapiDiff.diffSpecs({
          sourceSpec: {
            content: baseDefinitions,
            location: 'base',
            format: 'openapi3',
          },
          destinationSpec: {
            content: headDefinitions,
            location: 'head',
            format: 'openapi3',
          },
        });
      } catch (e) {
        if (e instanceof Error) {
          warn(`OpenAPI diff failed: ${e.message}`);
          handleOpenAPIDiffError(e.message);
        } else {
          warn(`OpenAPI diff failed with an unrecognized error type: ${e}`);
          handleOpenAPIDiffError(`Unknown error`);
        }
      }
    };

    let result: openapiDiff.DiffOutcome | undefined;
    const computedOpenAPIDiff = await diffOpenAPI();
    if (computedOpenAPIDiff) {
      if (!reportRemoved && computedOpenAPIDiff.breakingDifferencesFound) {
        const diffOutcomeFailure = computedOpenAPIDiff as any;
        diffOutcomeFailure.breakingDifferencesFound = false;
        delete diffOutcomeFailure['breakingDifferences'];
      }

      if (computedOpenAPIDiff.breakingDifferencesFound) {
        console.log('Breaking change found!');
      }
      result = computedOpenAPIDiff;
    }
    return result;
  }

  async sqlDiff(reportRemoved: boolean): Promise<SQLDiff | undefined> {
    const collectStrings = async (
      revisionName: RevisionName,
      appmapName: string,
      indexFileName: string,
      strings: Set<string>
    ): Promise<void> => {
      const indexFilePath = this.changeAnalysis.paths.indexFilePath(
        revisionName,
        appmapName,
        indexFileName
      );
      if (!(await exists(indexFilePath))) {
        warn(`Index file ${indexFilePath} does not exist!`);
        return Promise.resolve();
      }
      const values: string[] = JSON.parse(await readFile(indexFilePath, 'utf-8'));
      for (const value of values) strings.add(value);
    };

    const loadSQL = async (
      revisionName: RevisionName,
      appmaps?: Iterable<AppMapName>
    ): Promise<{
      queries: Set<string>;
      tables: Set<string>;
    }> => {
      const queryStrings = new Set<string>();
      const tableStrings = new Set<string>();

      if (!appmaps) return { queries: queryStrings, tables: tableStrings };

      for (const appmapName of appmaps) {
        await collectStrings(
          revisionName,
          appmapName,
          'canonical.sqlNormalized.json',
          queryStrings
        );
        await collectStrings(revisionName, appmapName, 'canonical.sqlTables.json', tableStrings);
      }

      console.info(
        `Found ${queryStrings.size} queries and ${tableStrings.size} tables for ${revisionName} revision`
      );
      return { queries: queryStrings, tables: tableStrings };
    };

    const { queries: baseQueries, tables: baseTables } = await loadSQL(
      RevisionName.Base,
      this.changeAnalysis.baseAppMaps
    );
    const { queries: headQueries, tables: headTables } = await loadSQL(
      RevisionName.Head,
      this.changeAnalysis.headAppMaps
    );

    const newQueryStrings = [...headQueries].filter((query) => !baseQueries.has(query)).sort();
    const removedQueries = reportRemoved
      ? [...baseQueries].filter((query) => !headQueries.has(query)).sort()
      : [];
    const newTables = [...headTables].filter((table) => !baseTables.has(table)).sort();
    const removedTables = reportRemoved
      ? [...baseTables].filter((table) => !headTables.has(table)).sort()
      : [];

    const newQuerySourceLinesMap = new Map<string, string[]>();
    const newQueryAppMapsMap = new Map<string, AppMapName[]>();
    for (const appmapName of this.changeAnalysis.headAppMaps || []) {
      const indexFilePath = this.changeAnalysis.paths.indexFilePath(
        RevisionName.Head,
        appmapName,
        'canonical.sqlNormalized.json'
      );
      const values: string[] = JSON.parse(await readFile(indexFilePath, 'utf-8'));
      const newQueriesInAppMap = new Set<string>();
      for (const value of values) {
        if (newQueryStrings.includes(value)) {
          if (!newQueryAppMapsMap.has(value)) {
            newQueryAppMapsMap.set(value, []);
          }
          newQueriesInAppMap.add(value);
          newQueryAppMapsMap.get(value)?.push(appmapName);
        }
      }

      const appmapFileName = this.changeAnalysis.paths.appmapPath(RevisionName.Head, appmapName);
      if (newQueriesInAppMap.size) {
        const appmap = buildAppMap()
          .source(await readFile(appmapFileName, 'utf-8'))
          .build();
        const database = appmap.classMap.sqlObject;
        if (!database) {
          warn(`No Database found in AppMap ${appmapFileName}`);
        } else {
          for (const query of database.children) {
            for (const queryEvent of query.events) {
              if (queryEvent.sqlQuery && queryEvent.sql?.database_type) {
                const sqlNormalized = normalizeSQL(
                  queryEvent.sqlQuery,
                  queryEvent.sql.database_type
                );
                if (newQueriesInAppMap.has(sqlNormalized)) {
                  if (!newQuerySourceLinesMap.has(sqlNormalized))
                    newQuerySourceLinesMap.set(sqlNormalized, []);

                  let sourcePath: string | undefined;
                  let sourceLine: number | undefined;
                  for (const ancestor of queryEvent.ancestors()) {
                    const { path } = ancestor;
                    if (!path) continue;

                    sourcePath = await resolvePath(path, appmap.metadata.language?.name);
                    if (sourcePath) {
                      sourceLine = ancestor.lineno;
                      break;
                    }
                  }
                  if (sourcePath) {
                    const sourceLocation = [sourcePath, sourceLine].filter(Boolean).join(':');
                    newQuerySourceLinesMap.get(sqlNormalized)?.push(sourceLocation);
                  }
                }
              }
            }
          }
        }
      }
    }

    const newQueryAppMaps: SQLQueryReference[] = [...newQueryAppMapsMap.keys()]
      .sort()
      .reduce((memo, key) => {
        memo.push({
          query: key,
          appmaps: newQueryAppMapsMap.get(key) || [],
          sourceLocations: [...new Set(newQuerySourceLinesMap.get(key) || [])].sort(),
        });
        return memo;
      }, new Array<SQLQueryReference>());

    return { newQueries: newQueryAppMaps, removedQueries, newTables, removedTables };
  }

  protected async readOpenAPI(revision: RevisionName): Promise<string | undefined> {
    const openapiPath = this.changeAnalysis.paths.openapiPath(revision);
    try {
      return await readFile(openapiPath, 'utf-8');
    } catch (e) {
      if ((e as any).code === 'ENOENT') return undefined;
      throw e;
    }
  }
}
