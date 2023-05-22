import { ClassMap, Metadata } from '@appland/models';
import {
  Diagram as SequenceDiagram,
  format,
  FormatType,
  unparseDiagram,
} from '@appland/sequence-diagram';
import assert from 'assert';
import { queue } from 'async';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'path';
import { default as openapiDiff } from 'openapi-diff';

import { executeCommand } from '../../lib/executeCommand';
import { Finding, ImpactDomain } from '../../lib/findings';
import { DiffDiagrams } from '../../sequenceDiagramDiff/DiffDiagrams';
import { exists, processNamedFiles } from '../../utils';
import { AppMapData } from './AppMapData';
import { AppMapIndex } from './AppMapIndex';
import {
  AppMapLink,
  AppMapName,
  ChangedAppMap,
  ChangeReport,
  FindingUpdate,
  TestFailure,
} from './ChangeReport';
import mapToRecord from './mapToRecord';
import { RevisionName } from './RevisionName';
import { mutedStyle, prominentStyle } from './ui';
import { existsSync } from 'fs';
import { ArchiveMetadata } from '../archive/ArchiveMetadata';
import { SemVer } from 'semver';
import loadFindings from './loadFindings';

export async function loadSequenceDiagram(path: string): Promise<SequenceDiagram> {
  const diagramData = JSON.parse(await readFile(path, 'utf-8'));
  return unparseDiagram(diagramData);
}

export default async function buildChangeReport(
  baseRevision: string,
  headRevision: string,
  workingDir: string,
  srcDir: string,
  deleteUnchanged: boolean
): Promise<ChangeReport> {
  const diffDiagrams = new DiffDiagrams();

  const appmapData = new AppMapData(workingDir);
  const appmapIndex = new AppMapIndex(appmapData);
  await appmapIndex.build();

  const appMapMetadata = {
    base: new Map<AppMapName, Metadata>(),
    head: new Map<AppMapName, Metadata>(),
  };

  {
    const loadMetadataQueue = queue(
      async (appmap: { revisionName: RevisionName.Base | RevisionName.Head; name: string }) => {
        const metadataPath = appmapData.metadataPath(appmap.revisionName, appmap.name);
        if (!(await exists(metadataPath))) {
          console.warn(`Metadata file ${metadataPath} does not exist!`);
          return;
        }

        const metadata = JSON.parse(await readFile(metadataPath, 'utf-8')) as Metadata;
        appMapMetadata[appmap.revisionName].set(appmap.name, metadata);
      },
      5
    );
    loadMetadataQueue.error(console.warn);
    for (const revisionName of [RevisionName.Base, RevisionName.Head]) {
      (await appmapData.appmaps(revisionName)).forEach((appmap) =>
        loadMetadataQueue.push({
          revisionName: revisionName as RevisionName.Base | RevisionName.Head,
          name: appmap,
        })
      );
    }
    if (loadMetadataQueue.length() > 0) await loadMetadataQueue.drain();
  }

  const failedAppMaps = new Set<AppMapName>();
  {
    for (const appmap of await appmapData.appmaps(RevisionName.Head)) {
      const metadata = appMapMetadata[RevisionName.Head].get(appmap);
      if (!metadata) {
        console.log(prominentStyle(`Metadata for ${appmap} not found!`));
        continue;
      }
      if (metadata.test_status === 'failed') {
        failedAppMaps.add(appmap);
      }
    }
  }

  async function deleteUnchangedAppMaps() {
    const deleteAppMap = async (revisionName: RevisionName, appmap: AppMapName) => {
      if (failedAppMaps.has(appmap)) {
        console.log(
          mutedStyle(
            `AppMap ${revisionName}/${appmap} is unchanged, but it failed. base and head will be left on the filesystem.`
          )
        );
        return;
      }

      console.log(
        mutedStyle(`AppMap ${revisionName}/${appmap} is unchanged so it will be deleted.`)
      );
      const path = appmapData.appmapPath(revisionName, appmap);
      const fileName = [path, 'appmap.json'].join('.');
      assert(await exists(fileName));
      await rm(fileName);
      await rm(path, { recursive: true });
    };

    for (const appmap of await appmapData.appmaps(RevisionName.Base)) {
      const baseDigest = appmapIndex.appmapDigest(RevisionName.Base, appmap);
      const headDigest = appmapIndex.appmapDigest(RevisionName.Head, appmap);
      if (baseDigest === headDigest) {
        deleteAppMap(RevisionName.Base, appmap);
        deleteAppMap(RevisionName.Head, appmap);
      }
    }
  }

  if (deleteUnchanged) {
    await deleteUnchangedAppMaps();
  }

  const baseAppMaps = new Set(await appmapData.appmaps(RevisionName.Base));
  const headAppMaps = new Set(await appmapData.appmaps(RevisionName.Head));
  const newAppMaps = [...headAppMaps].filter((appmap) => !baseAppMaps.has(appmap));
  const changedAppMaps = [...headAppMaps]
    .filter((appmap) => baseAppMaps.has(appmap))
    .map((appmap) => ({ appmap }));

  const sequenceDiagramDiffSnippets = new Map<string, AppMapLink[]>();
  {
    const changedQueue = queue(async (changedAppMap: ChangedAppMap) => {
      const { appmap } = changedAppMap;
      const classMapData = JSON.parse(
        await readFile(join(appmapData.classMapPath(RevisionName.Head, appmap)), 'utf-8')
      );
      const classMap = new ClassMap(classMapData);

      const sourcePaths = new Set<string>();
      classMap.visit((codeObject) => {
        if (!codeObject.location) return;

        const path = codeObject.location.split(':')[0];
        if (path.indexOf('.') && !path.startsWith('<') && !isAbsolute(path)) sourcePaths.add(path);
      });

      if (sourcePaths.size > 0) {
        const paths = [...sourcePaths]
          .sort()
          .map((p) => [srcDir, p].join('/'))
          .join(' ');
        const sourceDiff = await executeCommand(
          `git diff ${baseRevision}..${headRevision} -- ${paths}`,
          false,
          false,
          false
        );
        if (sourceDiff) changedAppMap.sourceDiff = sourceDiff;
      }

      const baseDiagram = await loadSequenceDiagram(
        appmapData.sequenceDiagramPath(RevisionName.Base, appmap)
      );
      const headDiagram = await loadSequenceDiagram(
        appmapData.sequenceDiagramPath(RevisionName.Head, appmap)
      );
      const diagramDiff = diffDiagrams.diff(baseDiagram, headDiagram);
      if (diagramDiff) {
        const diagramJSON = format(FormatType.JSON, diagramDiff, 'diff');
        const path = appmapData.sequenceDiagramDiffPath(appmap);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, diagramJSON.diagram);
        changedAppMap.sequenceDiagramDiff = relative(join(workingDir, 'diff'), path);

        // Build a text snippet for each top level context.
        const allActions = [...diagramDiff.rootActions];
        for (let actionIndex = 0; actionIndex < diagramDiff.rootActions.length; actionIndex++) {
          const action = diagramDiff.rootActions[actionIndex];
          diagramDiff.rootActions = [action];
          const snippet = format(FormatType.Text, diagramDiff, 'diff');
          // TODO: nop if this is the empty string

          if (!sequenceDiagramDiffSnippets.has(snippet.diagram))
            sequenceDiagramDiffSnippets.set(snippet.diagram, []);
          sequenceDiagramDiffSnippets.get(snippet.diagram)?.push(appmap);
        }
        diagramDiff.rootActions = allActions;
      }
    }, 5);
    changedQueue.error(console.warn);
    changedAppMaps.forEach((appmap) => changedQueue.push(appmap));
    if (changedQueue.length()) await changedQueue.drain();
  }

  const testFailures = (
    await Promise.all(
      [...failedAppMaps].map(async (appmap) => {
        const metadata = appMapMetadata[RevisionName.Head].get(appmap);
        if (!metadata) {
          console.log(`No Appmap metadata available for failed test ${appmap}`);
          return;
        }
        const testFailure = {
          appmap,
          name: metadata.name,
        } as TestFailure;
        if (metadata.source_location)
          testFailure.testLocation = relative(process.cwd(), metadata.source_location);
        if (metadata.test_failure) {
          testFailure.failureMessage = metadata.test_failure.message;
          const location = metadata.test_failure.location;
          if (location) {
            testFailure.failureLocation = location;
            const [path, linenoStr] = location.split(':');
            if (linenoStr && (await exists(path))) {
              const lineno = parseInt(linenoStr, 10);
              const testCode = (await readFile(path, 'utf-8')).split('\n');
              const minIndex = Math.max(lineno - 10, 0);
              const maxIndex = Math.min(lineno + 10, testCode.length);
              testFailure.testSnippet = {
                codeFragment: testCode.slice(minIndex, maxIndex).join('\n'),
                startLine: minIndex + 1,
                language: metadata.language?.name,
              };
            }
          }
        }
        return testFailure;
      })
    )
  ).filter(Boolean) as TestFailure[];

  const baseFindings = await loadFindings(appmapData, RevisionName.Base);
  const headFindings = await loadFindings(appmapData, RevisionName.Head);

  let newFindings: Finding[];
  let resolvedFindings: Finding[];
  const impactDomains = new Set<ImpactDomain>();
  {
    const baseFindingHashes = baseFindings.reduce(
      (memo, finding: Finding) => (memo.add(finding.hash_v2), memo),
      new Set<string>()
    );
    const headFindingHashes = headFindings.reduce(
      (memo, finding: Finding) => (memo.add(finding.hash_v2), memo),
      new Set<string>()
    );
    const newFindingHashes = [...headFindingHashes].filter((hash) => !baseFindingHashes.has(hash));
    const resolvedFindingHashes = [...baseFindingHashes].filter(
      (hash) => !headFindingHashes.has(hash)
    );
    newFindings = baseFindings.filter((finding) => newFindingHashes.includes(finding.hash_v2));
    resolvedFindings = headFindings.filter((finding) =>
      resolvedFindingHashes.includes(finding.hash_v2)
    );
    [...newFindings, ...resolvedFindings].forEach((finding) => {
      if (finding.impactDomain) impactDomains.add(finding.impactDomain);
    });
  }

  const findingChanges = { new: newFindings, resolved: resolvedFindings };
  const findingDiff = {} as Record<ImpactDomain, FindingUpdate>;
  for (const impactDomain of impactDomains) {
    const entry: FindingUpdate = { new: [] as Finding[], resolved: [] as Finding[] };
    for (const findingType of Object.keys(findingChanges)) {
      findingChanges[findingType as keyof typeof findingChanges]
        .filter((finding) => finding.impactDomain === impactDomain)
        .forEach((finding) => entry[findingType].push(finding));
    }
    findingDiff[impactDomain] = entry as FindingUpdate;
  }

  let apiDiff: any;
  {
    const baseDefinitions = await readFile(appmapData.openapiPath(RevisionName.Base), 'utf-8');
    const headDefinitions = await readFile(appmapData.openapiPath(RevisionName.Head), 'utf-8');

    const result = await openapiDiff.diffSpecs({
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

    if (result.breakingDifferencesFound) {
      console.log('Breaking change found!');
    }
    apiDiff = result;
  }

  return {
    testFailures,
    newAppMaps,
    changedAppMaps,
    apiDiff,
    findingDiff,
    sequenceDiagramDiffSnippets: mapToRecord(sequenceDiagramDiffSnippets),
    appMapMetadata: {
      [RevisionName.Base]: mapToRecord(appMapMetadata[RevisionName.Base]),
      [RevisionName.Head]: mapToRecord(appMapMetadata[RevisionName.Head]),
    },
  };
}
