import { copyFile, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'fs/promises';
import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { glob } from 'glob';
import { promisify } from 'util';

import { handler as archive } from '../../../src/cmds/archive/archive';
import { handler as compare } from '../../../src/cmds/compare/compare';
import { resolveOutputPath } from '../../../src/cmds/archive/archiveHandler';
import { fixtureDir } from '../util';

const rubyFixturePath = join(fixtureDir, 'ruby');
const appmapNames = ['revoke_api_key', 'user_page_scenario'];
const originalWorkingDir = process.cwd();

type AppMapData = {
  metadata: Record<string, any>;
  events: { id: number; event: string; parent_id?: number; method_id?: string }[];
};

async function loadFixture(name: string): Promise<AppMapData> {
  return JSON.parse(await readFile(join(rubyFixturePath, `${name}.appmap.json`), 'utf-8'));
}

// Writes the Ruby fixture AppMaps into a directory, marked as test recordings.
// The edit function can change an AppMap before it is written.
async function writeRecordings(dir: string, edit?: (name: string, appmap: AppMapData) => void) {
  await mkdir(dir, { recursive: true });
  for (const name of appmapNames) {
    const appmap = await loadFixture(name);
    appmap.metadata.recorder = { name: 'rspec', type: 'tests' };
    if (edit) edit(name, appmap);
    await writeFile(join(dir, `${name}.appmap.json`), JSON.stringify(appmap));
  }
}

// Removes the call to Configuration#attributes that has the given id, and its return.
function removeCall(appmap: AppMapData, callId: number) {
  appmap.events = appmap.events.filter((e) => e.id !== callId && e.parent_id !== callId);
}

describe('archive and compare without an appmap.yml', () => {
  let workDir: string;
  let baseRecordings: string;
  let headRecordings: string;
  let baseArchive: string;
  let headArchive: string;

  beforeAll(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'appmap-compare-archives-'));
    baseRecordings = join(workDir, 'recordings', 'base');
    headRecordings = join(workDir, 'recordings', 'head');
    baseArchive = join(workDir, 'archives', 'base.tar');
    headArchive = join(workDir, 'archives', 'head.tar');

    await writeRecordings(baseRecordings);
    await writeRecordings(headRecordings, (name, appmap) => {
      if (name === 'user_page_scenario') removeCall(appmap, 64);
    });

    for (const [recordings, outputFile, revision] of [
      [baseRecordings, baseArchive, 'rev-base'],
      [headRecordings, 'archives/head.tar', 'rev-head'],
    ]) {
      await archive({
        directory: workDir,
        appmapDir: recordings,
        inPlace: false,
        revision,
        outputFile,
        analyze: true,
        threadCount: 1,
        maxSize: 50,
        type: 'auto',
      });
    }
  }, 120 * 1000);

  afterAll(async () => {
    process.chdir(originalWorkingDir);
    await rm(workDir, { recursive: true, force: true });
  });

  it('writes the archives to the paths given by --output-file', () => {
    expect(existsSync(baseArchive)).toBe(true);
    expect(existsSync(headArchive)).toBe(true);
  });

  it('leaves the recordings directories unchanged with --no-in-place', async () => {
    for (const dir of [baseRecordings, headRecordings]) {
      expect((await readdir(dir)).sort()).toEqual(
        appmapNames.map((name) => `${name}.appmap.json`).sort()
      );
    }
  });

  describe('compare --base-archive --head-archive', () => {
    const outputDir = 'report';

    const runCompare = async (extra: Record<string, unknown> = {}) =>
      compare({
        directory: workDir,
        baseArchive,
        headArchive,
        outputDir,
        sourceDir: '.',
        clobberOutputDir: true,
        deleteUnreferenced: false,
        reportRemoved: true,
        ...extra,
      });

    const diffActorNames = async (): Promise<string[]> => {
      const diffFiles = await promisify(glob)(
        join(workDir, outputDir, 'diff', '**', '*.diff.sequence.json')
      );
      expect(diffFiles).toHaveLength(1);
      const diagram = JSON.parse(await readFile(diffFiles[0], 'utf-8'));
      return diagram.actors.map((actor: { name: string }) => actor.name);
    };

    afterEach(() => process.chdir(originalWorkingDir));

    it(
      'restores both archives and reports the changed AppMap',
      async () => {
        await runCompare();

        const report = JSON.parse(
          await readFile(join(workDir, outputDir, 'change-report.json'), 'utf-8')
        );
        expect(report.changedAppMaps.map((c: { appmap: string }) => c.appmap)).toEqual([
          'user_page_scenario',
        ]);
        for (const revisionName of ['base', 'head'])
          expect(
            existsSync(join(workDir, outputDir, revisionName, 'user_page_scenario.appmap.json'))
          ).toBe(true);

        // Without --expand, the classes in app/models share one lane.
        expect(await diffActorNames()).not.toContain('Configuration');
      },
      60 * 1000
    );

    it(
      'with --expand, gives each class in the package its own lane',
      async () => {
        await runCompare({ expand: ['package:app/models'] });

        expect(await diffActorNames()).toContain('Configuration');
      },
      60 * 1000
    );

    it(
      'names the default output directory after the revisions stored in the archives',
      async () => {
        await runCompare({ outputDir: undefined });

        expect(
          existsSync(
            join(workDir, '.appmap', 'change-report', 'rev_base-rev_head', 'change-report.json')
          )
        ).toBe(true);
      },
      60 * 1000
    );

    it(
      'refuses to replace restored data without --clobber-output-dir',
      async () => {
        await expect(runCompare({ clobberOutputDir: false })).rejects.toThrow(/already exists/);
      },
      60 * 1000
    );

    it(
      'treats archive file names as literal paths',
      async () => {
        const oddName = join(workDir, 'archives', 'head $(touch pwned) ; x.tar');
        await copyFile(headArchive, oddName);

        await runCompare({ headArchive: oddName });

        expect(existsSync(join(workDir, outputDir, 'change-report.json'))).toBe(true);
        expect(existsSync(join(workDir, 'pwned'))).toBe(false);
        expect(existsSync(join(workDir, outputDir, 'pwned'))).toBe(false);
      },
      60 * 1000
    );

    it('refuses an incremental archive before writing anything', async () => {
      const incrementalDir = join(workDir, 'incremental');
      await mkdir(incrementalDir, { recursive: true });
      await writeFile(
        join(incrementalDir, 'appmap_archive.json'),
        JSON.stringify({ revision: 'rev-inc', baseRevision: 'rev-base' })
      );
      execFileSync('tar', ['czf', 'appmaps.tar.gz', 'appmap_archive.json'], {
        cwd: incrementalDir,
      });
      const incrementalArchive = join(workDir, 'archives', 'incremental.tar');
      execFileSync('tar', ['cf', incrementalArchive, 'appmap_archive.json', 'appmaps.tar.gz'], {
        cwd: incrementalDir,
      });

      await expect(
        runCompare({ headArchive: incrementalArchive, outputDir: 'incremental-report' })
      ).rejects.toThrow(/incremental archive/);
      expect(existsSync(join(workDir, 'incremental-report'))).toBe(false);
    });

    it('requires both archives', async () => {
      await expect(runCompare({ headArchive: undefined })).rejects.toThrow(
        /must be given together/
      );
    });
  });
});

describe('archive --appmap-dir . --no-in-place, run from the recordings directory', () => {
  let recordings: string;
  let outputFile: string;

  beforeAll(async () => {
    const root = await mkdtemp(join(tmpdir(), 'appmap-archive-in-place-'));
    recordings = join(root, 'recordings');
    outputFile = join(root, 'out.tar');

    await writeRecordings(recordings);
    // A hidden directory below a visible one is archived, as 'tar *' would do.
    // A hidden top-level directory is not.
    for (const dir of [join('suite', '.captures'), '.hidden']) {
      await mkdir(join(recordings, dir), { recursive: true });
      await copyFile(
        join(recordings, 'revoke_api_key.appmap.json'),
        join(recordings, dir, 'revoke_api_key.appmap.json')
      );
    }

    await archive({
      directory: recordings,
      appmapDir: '.',
      inPlace: false,
      revision: 'r1',
      outputFile,
      analyze: true,
      threadCount: 1,
      maxSize: 50,
      type: 'auto',
    });
  }, 120 * 1000);

  afterAll(async () => {
    process.chdir(originalWorkingDir);
    await rm(dirname(recordings), { recursive: true, force: true });
  });

  it('writes nothing into the recordings directory', async () => {
    expect((await readdir(recordings)).sort()).toEqual(
      ['.hidden', 'revoke_api_key.appmap.json', 'suite', 'user_page_scenario.appmap.json'].sort()
    );
    expect(await readdir(join(recordings, 'suite', '.captures'))).toEqual([
      'revoke_api_key.appmap.json',
    ]);
  });

  it('archives hidden directories below the top level, but not hidden top-level ones', () => {
    const appmaps = execFileSync('tar', ['-xOf', outputFile, 'appmaps.tar.gz']);
    const entries = execFileSync('tar', ['tzf', '-'], { input: appmaps }).toString().split('\n');

    expect(entries).toContain('suite/.captures/revoke_api_key.appmap.json');
    expect(entries.filter((entry) => entry.startsWith('.hidden'))).toEqual([]);
  });
});

describe('resolveOutputPath', () => {
  const wd = '/work';

  it('puts a bare file name in the default output directory', () => {
    expect(resolveOutputPath(wd, 'full', 'r1', 'x.tar', undefined)).toEqual(
      '/work/.appmap/archive/full/x.tar'
    );
  });

  it('puts a bare file name in --output-dir', () => {
    expect(resolveOutputPath(wd, 'full', 'r1', 'x.tar', 'out')).toEqual('/work/out/x.tar');
  });

  it('uses an absolute path as given', () => {
    expect(resolveOutputPath(wd, 'full', 'r1', '/tmp/out.tar', undefined)).toEqual('/tmp/out.tar');
  });

  it('resolves a path with a directory against the working directory', () => {
    expect(resolveOutputPath(wd, 'full', 'r1', 'a/b.tar', undefined)).toEqual('/work/a/b.tar');
  });

  it('rejects a path with a directory together with --output-dir', () => {
    expect(() => resolveOutputPath(wd, 'full', 'r1', 'a/b.tar', 'out')).toThrow(/--output-dir/);
  });

  it('defaults to <revision>.tar', () => {
    expect(resolveOutputPath(wd, 'incremental', 'r1', undefined, undefined)).toEqual(
      '/work/.appmap/archive/incremental/r1.tar'
    );
  });
});
