import { readFile } from 'fs/promises';
import { isAbsolute, join } from 'path';
import { ClassMap } from '@appland/models';
import assert from 'assert';
import { RevisionName } from '../../diffArchive/RevisionName';
import { AppMapName } from './ChangeReport';
import { default as SourceDiffLoader } from '../../diffArchive/SourceDiff';
import { Paths } from '../../diffArchive/Paths';

export class SourceDiff {
  private diffs = new Map<AppMapName, string>();
  private classMaps = new Map<AppMapName, ClassMap>();
  private diffLoader: SourceDiffLoader;

  constructor(public baseRevision: string, public headRevision: string, public paths: Paths) {
    this.diffLoader = new SourceDiffLoader(baseRevision, headRevision);
  }

  async get(appmap: AppMapName): Promise<string | undefined> {
    [RevisionName.Base, RevisionName.Head].forEach((revisionName) =>
      assert(
        !appmap.startsWith(revisionName),
        `AppMap ${appmap} must not start with a revision name`
      )
    );

    const yieldDiff = (diff: string) => (diff !== '' ? diff : undefined);

    let diff = this.diffs.get(appmap);
    if (diff) return Promise.resolve(yieldDiff(diff));

    diff = await this.loadDiff(appmap);
    this.diffs.set(appmap, diff);
    return yieldDiff(diff);
  }

  async loadDiff(appmap: string): Promise<string> {
    const loadClassMap = async (): Promise<ClassMap> => {
      const classMapData = JSON.parse(
        await readFile(join(this.paths.classMapPath(RevisionName.Head, appmap)), 'utf-8')
      );
      return new ClassMap(classMapData);
    };

    const classMap = this.classMaps.get(appmap) || (await loadClassMap());
    const sourcePaths = new Set<string>();
    const sourcePathRoots = new Set<string>();
    classMap.visit((codeObject) => {
      if (!codeObject.location) return;

      const path = codeObject.location.split(':')[0];
      if (path.indexOf('.') && !path.startsWith('<') && !path.includes('#') && !isAbsolute(path)) {
        sourcePaths.add(path);
        const pathTokens = path.split('/');
        if (pathTokens.length > 0) sourcePathRoots.add(pathTokens[0]);
      }
    });

    await this.diffLoader.update(sourcePathRoots);

    const result = [...sourcePaths]
      .sort()
      .map((path) => this.diffLoader.lookupDiff(path))
      .join('');
    return result;
  }
}
