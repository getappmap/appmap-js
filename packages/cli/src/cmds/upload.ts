import { CommandModule } from 'yargs';
import { AppMap, loadConfiguration, Mapset } from '@appland/client';
import { listAppMapFiles } from '../utils';
import { readFile, stat } from 'fs/promises';
import assert from 'assert';
import UI from './userInteraction';
import { ValidationError } from './errors';
import { Stats } from 'fs';

interface Arguments {
  appmapDir: string;
  app?: string;
  force?: boolean;
}

type Metadata = {
  application?: string;
  branch?: string;
  commit?: string;
};

const MAX_APPMAP_SIZE = 2 * 1024 * 1024;

function applyOrCheck(data: { [x: string]: string | undefined }, key: string, input?: string) {
  if (!input) return;

  const existing = data[key];
  if (existing) {
    if (existing !== input)
      throw new ValidationError(`"${key}" mismatch ("${existing}" !== "${input}")`);
  } else {
    data[key] = input;
  }
}

function checkMetadata(current: Metadata, input: unknown) {
  if (!input) return; // no metadata in appmap, ie. matches

  assert(typeof input === 'object');

  applyOrCheck(current, 'application', input['app']);

  const git = input['git'];
  if (typeof git !== 'object') return;
  applyOrCheck(current, 'branch', git['branch']);
  applyOrCheck(current, 'commit', git['commit']);
}

async function collect(appmapDir: string, force: boolean): Promise<[string[], Metadata]> {
  const metadata: Metadata = {};
  const paths: string[] = [];

  await listAppMapFiles(appmapDir, (path) => {
    paths.push(path);
  });

  for (const path of paths) {
    checkMetadata(metadata, JSON.parse(await readFile(path, 'utf-8')).metadata);
    if (!force) checkSize(await stat(path));
  }

  return [paths, metadata];
}

export async function handler({ appmapDir, app, force }: Arguments): Promise<void> {
  UI.progress(`Examining AppMaps...`);
  const [paths, metadata] = await collect(appmapDir, !!force);

  if (paths.length === 0) throw new Error(`No AppMaps found in ${appmapDir}`);

  if (!(app ||= metadata.application)) {
    throw new ValidationError(
      [
        'Application name required.',
        'You can provide the application name using --app option.',
      ].join('\n')
    );
  }

  let total = paths.length;
  const { baseURL } = loadConfiguration();
  UI.progress(`Uploading ${total} AppMaps for ${app} to ${baseURL}...`);

  const uuids: string[] = [];
  let processed = 0;
  for (const path of paths) {
    processed += 1;
    UI.status = `[${processed}/${total}] ${path}`;
    const data = await readFile(path); //  TODO: stream this instead of slurping the whole thing?
    const response = await AppMap.create(data, { app });
    uuids.push(response.uuid);
  }

  UI.status = 'Creating mapset...';

  const mapset = await Mapset.create(app, uuids, metadata);

  const url = [baseURL, 'applications', mapset.app_id, 'mapsets', mapset.id].join('/');
  UI.success(`Created mapset ${url} with ${total} AppMaps`);
}

function checkSize({ size }: Stats) {
  if (size > MAX_APPMAP_SIZE)
    throw new ValidationError(
      [
        `File size is ${size / 1024} KiB which is greater than the size limit of ${
          MAX_APPMAP_SIZE / 1024
        } KiB.`,
        'Use --force if you want to upload it anyway.',
      ].join('\n')
    );
}

const command: CommandModule<{}, Arguments> = {
  command: 'upload [appmap-dir]',
  builder: {
    appmapDir: {
      default: '.',
      hidden: true,
    },
    app: {
      alias: 'a',
      description: 'application name override',
      type: 'string',
    },
    force: {
      alias: 'f',
      description: 'force uploading oversized files',
      type: 'boolean',
    },
  },
  describe: 'Upload AppMaps and create a mapset',
  handler,
};

export default command;
