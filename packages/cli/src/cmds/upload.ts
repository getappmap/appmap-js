import { CommandModule } from 'yargs';
import { AppMap, loadConfiguration, Mapset } from '@appland/client';
import { listAppMapFiles } from '../utils';
import { readFile } from 'fs/promises';
import assert from 'assert';
import UI from './userInteraction';
import { ValidationError } from './errors';

interface Arguments {
  appmapDir: string;
  app?: string;
}

type Metadata = {
  application?: string;
  branch?: string;
  commit?: string;
};

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

async function collect(appmapDir: string): Promise<[string[], Metadata]> {
  const metadata: Metadata = {};
  const paths: string[] = [];

  await listAppMapFiles(appmapDir, (path) => {
    paths.push(path);
  });

  for (const path of paths)
    checkMetadata(metadata, JSON.parse(await readFile(path, 'utf-8')).metadata);

  return [paths, metadata];
}

export async function handler({ appmapDir, app }: Arguments): Promise<void> {
  UI.progress(`Examining AppMaps...`);
  const [paths, metadata] = await collect(appmapDir);

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
  },
  describe: 'Upload AppMaps and create a mapset',
  handler,
};

export default command;
