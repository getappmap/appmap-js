import { glob } from 'glob';
import { dirname, join } from 'path';
import { promisify } from 'util';
import { Octokit } from '@octokit/rest';
import { mkdtemp, rm, rmdir } from 'fs/promises';
import { createWriteStream } from 'fs';
import fetch from 'node-fetch';
import { tmpdir } from 'os';
import { executeCommand } from '../../lib/executeCommand';

type ArchiveId = string;

type ArchiveEntry = {
  id: ArchiveId;
  type: string;
  revision: string;
};

type ArchiveInventory = {
  full: Map<ArchiveId, ArchiveEntry>;
  incremental: Map<ArchiveId, ArchiveEntry>;
};

export interface ArchiveStore {
  // Enumerate archives available for download.
  revisionsAvailable(): Promise<ArchiveInventory>;

  // Download and store an archive to a file.
  fetch(archiveId: string): Promise<string>;

  // Cleanup a previously downloaded archive.
  cleanup(path: string): Promise<void>;
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

  // Leave the file in place, since it's not a temp file.
  async cleanup(path: string) {
    return;
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
    const result = {
      full: new Map<ArchiveId, ArchiveEntry>(),
      incremental: new Map<ArchiveId, ArchiveEntry>(),
    };
    for (let page = 1; true; page++) {
      const artifacts = (
        await this.octokit.rest.actions.listArtifactsForRepo({
          page,
          per_page: 100,
          repo: this.repository,
        })
      ).data;
      const { total_count } = artifacts;
      if (total_count === 0) break;

      for (const artifact of artifacts) {
        // TODO: Use id or node_id?
        const { id, name } = artifact;

        // Example archive name: appmap-archive-full_2c51afaae3cc355e4bac499e9b68ea1d3dc1b36a.json
        // Extract archive type and revision from the name
        const { 1: archiveType, 2: revision } = name.match(/appmap-archive-(\w+)_(\w+)\.json/);
        if (archiveType && revision) {
          let archives: Map<ArchiveId, ArchiveEntry> | undefined;
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
    }
    return result;
  }

  async fetch(archiveId: string): Promise<string> {
    const { owner, repo } = this;
    const artifactUrl = await this.octokit.rest.actions.downloadArtifact({
      owner,
      repo,
      artifact_id: archiveId,
      archive_format: 'zip',
    });
    const tempDir = await mkdtemp(join(tmpdir(), 'appmap-'));
    const tempFile = join(tempDir, 'archive.zip');
    await downloadFile(new URL(artifactUrl), tempFile);
    await executeCommand(`unzip -o -d ${tempDir} ${tempFile}`);
    const filesAvailable = await promisify(glob)(join(tempDir, '**', '*.json'));
    if (filesAvailable.length === 0) throw new Error(`No JSON files found in archive ${archiveId}`);
    return filesAvailable.join(', ');
  }

  // Remove the enclosing directory of the artifact, because it's been unzipped into a temp dir.
  async cleanup(path: string) {
    await rmdir(dirname(path), { recursive: true });
  }
}

export async function downloadFile(url: URL, path: string) {
  const res = await fetch(url);
  if (!res) throw new Error(`Could not download ${url}`);
  if (!res.body) throw new Error(`Response body for ${url} is empty`);
  if (res.status !== 200) throw new Error(`Could not download ${url}: ${res.statusText}`);

  const readStream = res.body;
  const writeStream = createWriteStream(path);

  await new Promise((resolve, reject) => {
    readStream.on('error', reject).pipe(writeStream).on('error', reject).on('finish', resolve);
  });
}
