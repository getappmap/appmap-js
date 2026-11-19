import { copyFile, mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'fs/promises';
import { createHash } from 'crypto';
import { execFileSync } from 'child_process';
import { existsSync, realpathSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';

import { handler as archive } from '../../../src/cmds/archive/archive';
import { handler as compare } from '../../../src/cmds/compare/compare';
import { archiveOutputPath } from '../../../src/cmds/archive/archiveHandler';
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

// Contents, inode and modification time of every file in a directory tree, so a test
// can tell whether anything was written, replaced or added.
async function snapshot(dir: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const walk = async (path: string) => {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const full = join(path, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      const info = await stat(full);
      const hash = createHash('sha256')
        .update(await readFile(full))
        .digest('hex');
      result[full.slice(dir.length + 1)] = `${hash} ${info.ino} ${info.mtimeMs}`;
    }
  };
  await walk(dir);
  return result;
}

function readManifest(archiveFile: string): Record<string, any> {
  return JSON.parse(execFileSync('tar', ['-xOf', archiveFile, 'appmap_archive.json']).toString());
}

function archivedFiles(archiveFile: string): string[] {
  const appmaps = execFileSync('tar', ['-xOf', archiveFile, 'appmaps.tar.gz']);
  return execFileSync('tar', ['tzf', '-'], { input: appmaps })
    .toString()
    .split('\n')
    .filter((entry) => entry !== '')
    .sort();
}

describe('archive and compare without an appmap.yml', () => {
  let workDir: string;
  let baseRecordings: string;
  let headRecordings: string;
  let baseArchive: string;
  let headArchive: string;
  let recordingsBefore: Record<string, string>;

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
    recordingsBefore = await snapshot(join(workDir, 'recordings'));

    // The base archive goes to an absolute --output-file. The head archive goes to
    // a file name in --output-dir, as archives always have.
    for (const [recordings, output, revision] of [
      [baseRecordings, { outputFile: baseArchive }, 'rev-base'],
      [headRecordings, { outputDir: 'archives', outputFile: 'head.tar' }, 'rev-head'],
    ] as const) {
      await archive({
        directory: workDir,
        appmapDir: recordings,
        inPlace: false,
        revision,
        ...output,
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

  it('writes the archives to the paths given by --output-file and --output-dir', () => {
    expect(existsSync(baseArchive)).toBe(true);
    expect(existsSync(headArchive)).toBe(true);
  });

  it('leaves the recordings exactly as they were with --no-in-place', async () => {
    expect(await snapshot(join(workDir, 'recordings'))).toEqual(recordingsBefore);
  });

  it('records an AppMap directory given as an absolute path by its base name', () => {
    expect(readManifest(baseArchive).appMapDir).toEqual('base');
    expect(archivedFiles(baseArchive)).toContain('revoke_api_key.appmap.json');
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

    it('refuses an archive with no revision before writing anything', async () => {
      const noRevisionDir = join(workDir, 'no-revision');
      await mkdir(noRevisionDir, { recursive: true });
      await writeFile(join(noRevisionDir, 'appmap_archive.json'), JSON.stringify({}));
      execFileSync('tar', ['czf', 'appmaps.tar.gz', 'appmap_archive.json'], { cwd: noRevisionDir });
      const noRevisionArchive = join(workDir, 'archives', 'no-revision.tar');
      execFileSync('tar', ['cf', noRevisionArchive, 'appmap_archive.json', 'appmaps.tar.gz'], {
        cwd: noRevisionDir,
      });

      await expect(
        runCompare({ headArchive: noRevisionArchive, outputDir: 'no-revision-report' })
      ).rejects.toThrow(/has no revision/);
      expect(existsSync(join(workDir, 'no-revision-report'))).toBe(false);
    });

    it('requires both archives', async () => {
      await expect(runCompare({ headArchive: undefined })).rejects.toThrow(
        /must be given together/
      );
    });
  });
});

describe('archive --no-in-place records the same paths as an in-place archive', () => {
  let root: string;
  const manifests: Record<'inPlace' | 'scratch', Record<string, any>> = {
    inPlace: {},
    scratch: {},
  };
  const files: Record<'inPlace' | 'scratch', string[]> = { inPlace: [], scratch: [] };

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'appmap-archive-same-paths-'));
    for (const mode of ['inPlace', 'scratch'] as const) {
      const project = join(root, mode);
      await writeRecordings(join(project, 'tmp', 'appmap', 'suite'), (name, appmap) => {
        if (name === 'revoke_api_key') appmap.metadata.test_status = 'failed';
      });
      await writeFile(join(project, 'appmap.yml'), 'name: same-paths\nappmap_dir: tmp/appmap\n');

      const outputFile = join(root, `${mode}.tar`);
      await archive({
        directory: project,
        inPlace: mode === 'inPlace',
        revision: 'r1',
        outputFile,
        analyze: true,
        threadCount: 1,
        // Small enough that user_page_scenario is too big to index.
        maxSize: 0.03,
        type: 'auto',
      });
      process.chdir(originalWorkingDir);
      manifests[mode] = readManifest(outputFile);
      files[mode] = archivedFiles(outputFile).filter((file) => !file.endsWith('/'));
    }
  }, 120 * 1000);

  afterAll(async () => {
    process.chdir(originalWorkingDir);
    await rm(root, { recursive: true, force: true });
  });

  it('records failedTests and oversizedAppMaps in the same form', () => {
    expect(manifests.inPlace.failedTests).toEqual(['tmp/appmap/suite/revoke_api_key.appmap.json']);
    expect(manifests.inPlace.oversizedAppMaps).toEqual([
      'tmp/appmap/suite/user_page_scenario.appmap.json',
    ]);
    expect(manifests.scratch.failedTests).toEqual(manifests.inPlace.failedTests);
    expect(manifests.scratch.oversizedAppMaps).toEqual(manifests.inPlace.oversizedAppMaps);
  });

  it('records the same appMapDir and the real working directory', () => {
    expect(manifests.scratch.appMapDir).toEqual('tmp/appmap');
    expect(manifests.scratch.appMapDir).toEqual(manifests.inPlace.appMapDir);
    expect(manifests.scratch.workingDirectory).toEqual(realpathSync(join(root, 'scratch')));
  });

  it('packs the same files', () => {
    expect(files.scratch.length).toBeGreaterThan(0);
    expect(files.scratch).toEqual(files.inPlace);
  });
});

describe('archive --appmap-dir . --no-in-place, run from the recordings directory', () => {
  let recordings: string;
  let outputFile: string;
  let recordingsBefore: Record<string, string>;

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
    // appmap_archive.json marks the AppMaps as incremental. archive rewrites it, so it
    // must be copied, not linked, into the scratch directory.
    await writeFile(join(recordings, 'appmap_archive.json'), JSON.stringify({ revision: 'r0' }));
    recordingsBefore = await snapshot(recordings);

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

  it('writes nothing into the recordings directory, and changes nothing in it', async () => {
    expect(await snapshot(recordings)).toEqual(recordingsBefore);
  });

  it('still builds an incremental archive on top of the marked revision', () => {
    expect(readManifest(outputFile).baseRevision).toEqual('r0');
  });

  it('archives hidden directories below the top level, but not hidden top-level ones', () => {
    const entries = archivedFiles(outputFile);
    expect(entries).toContain('suite/.captures/revoke_api_key.appmap.json');
    expect(entries.filter((entry) => entry.startsWith('.hidden'))).toEqual([]);
  });
});

describe('archiveOutputPath', () => {
  const wd = '/work';

  it('puts a file name in the output directory', () => {
    expect(archiveOutputPath(wd, '.appmap/archive/full', 'x.tar')).toEqual(
      '/work/.appmap/archive/full/x.tar'
    );
  });

  it('puts a relative path with a directory under the output directory, as before', () => {
    expect(archiveOutputPath(wd, 'out', 'a/b.tar')).toEqual('/work/out/a/b.tar');
  });

  it('uses an absolute path as given', () => {
    expect(archiveOutputPath(wd, '.appmap/archive/full', '/tmp/out.tar')).toEqual('/tmp/out.tar');
  });

  it('accepts an absolute output directory', () => {
    expect(archiveOutputPath(wd, '/archives', 'r1.tar')).toEqual('/archives/r1.tar');
  });
});
