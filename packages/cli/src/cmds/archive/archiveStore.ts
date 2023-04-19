import { glob } from 'glob';
import { join } from 'path';
import { promisify } from 'util';
import { Octokit } from '@octokit/rest';
import { mkdtemp, rm, rmdir, unlink } from 'fs/promises';
import { createWriteStream } from 'fs';
import { tmpdir } from 'os';
import { executeCommand } from '../../lib/executeCommand';
import assert from 'assert';
import { get } from 'https';

export type ArchiveId = string;

export type ArchiveEntry = {
  id: ArchiveId;
  type: string;
  revision: string;
};

export type ArchiveInventory = {
  full: Map<ArchiveId, ArchiveEntry>;
  incremental: Map<ArchiveId, ArchiveEntry>;
};

export interface ArchiveStore {
  // Enumerate archives available for download.
  revisionsAvailable(): Promise<ArchiveInventory>;

  // Download and store an archive to a file.
  fetch(archiveId: string): Promise<string>;
}

export class FileArchiveStore implements ArchiveStore {
  constructor(private readonly directory: string) {}

  async revisionsAvailable(): Promise<ArchiveInventory> {
    const parseArchivePath = (path: string): ArchiveEntry => {
      // Example archive path: .appmap/archive/full/2c51afaae3cc355e4bac499e9b68ea1d3dc1b36a.tar
      // Extract archive type and revision from the path
      const archiveTokens = path.split('/');
      const revision = archiveTokens.pop()?.split('.')[0]!;
      const type = archiveTokens.pop()!;
      return { id: path, type, revision };
    };

    const loadDirectory = async (directory: string): Promise<Map<ArchiveId, ArchiveEntry>> => {
      return (await promisify(glob)(join(directory, '*.tar')))
        .map(parseArchivePath)
        .reduce(
          (memo, entry) => (memo.set(entry.id, parseArchivePath(entry.id)), memo),
          new Map<ArchiveId, ArchiveEntry>()
        );
    };

    const full = await loadDirectory(join(this.directory, 'full'));
    const incremental = await loadDirectory(join(this.directory, 'incremental'));

    return { full, incremental };
  }

  // The archive is already stored in the file system, so just return the path.
  async fetch(archiveId: string): Promise<string> {
    return archiveId;
  }
}

export class GitHubArchiveStore implements ArchiveStore {
  octokit: Octokit;
  public repo: string;
  public owner: string;

  constructor(readonly repository: string, public readonly token: string) {
    const tokens = repository.split('/');
    if (tokens.length < 2) throw new Error(`Invalid repository name: ${repository}`);

    this.repo = tokens.pop()!.split('.')[0]!;
    this.owner = tokens.pop()!;
    this.octokit = new Octokit({
      auth: this.token,
    });
  }

  async revisionsAvailable(): Promise<ArchiveInventory> {
    const { owner, repo } = this;
    const result = {
      full: new Map<ArchiveId, ArchiveEntry>(),
      incremental: new Map<ArchiveId, ArchiveEntry>(),
    };
    for (let page = 1; true; page++) {
      const response = (
        await this.octokit.rest.actions.listArtifactsForRepo({
          owner,
          repo,
          page,
          per_page: 100,
        })
      ).data;
      if (response.artifacts.length === 0) break;

      for (const artifact of response.artifacts) {
        // TODO: Use id or node_id?
        const { id, name } = artifact;

        // Example archive name: appmap-archive-full_2c51afaae3cc355e4bac499e9b68ea1d3dc1b36a.tar
        // Extract archive type and revision from the name
        const matchResult = /appmap-archive-(\w+)_(\w+)\.tar/.exec(name);
        if (!matchResult) continue;

        let archives: Map<ArchiveId, ArchiveEntry> | undefined;
        const archiveType = matchResult[1];
        const revision = matchResult[2];
        if (archiveType === 'full') {
          archives = result.full;
        } else if (archiveType === 'incremental') {
          archives = result.incremental;
        }
        if (archives)
          archives.set(id.toString(), {
            id: id.toString(),
            type: archiveType,
            revision,
          });
        else console.warn(`Unknown archive type '${archiveType}' in artifact '${name}'`);
      }
    }
    return result;
  }

  async fetch(archiveId: string): Promise<string> {
    const { owner, repo } = this;
    const { url: artifactUrl } = await this.octokit.rest.actions.downloadArtifact({
      owner,
      repo,
      artifact_id: parseInt(archiveId, 10),
      archive_format: 'zip',
    });
    assert(artifactUrl, `No location header in response for artifact ${archiveId}`);

    const tempDir = await mkdtemp(join(tmpdir(), 'appmap-'));
    process.on('exit', () => rm(tempDir, { recursive: true, force: true }));

    const tempFile = join(tempDir, 'archive.zip');
    await downloadFile(new URL(artifactUrl), tempFile);
    await executeCommand(`unzip -o -d ${tempDir} ${tempFile}`);
    const filesAvailable = await promisify(glob)([tempDir, '**', '*.tar'].join('/'), {
      dot: true,
    });
    if (filesAvailable.length === 0)
      throw new Error(`No *.tar found in GitHub artifact ${archiveId}`);
    if (filesAvailable.length > 1)
      throw new Error(`Multiple *.tar found in GitHub artifact ${archiveId}`);
    return filesAvailable.pop()!;
  }
}

export async function downloadFile(url: URL, path: string) {
  const file = createWriteStream(path);
  return new Promise<void>((resolve, reject) => {
    get(url, function (response) {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', function (err) {
      unlink(path);
      reject(err);
    });
  });
}
