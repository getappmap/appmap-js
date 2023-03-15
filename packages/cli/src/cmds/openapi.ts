import { join } from 'path';

import { existsSync, promises as fsp, Stats } from 'fs';
import { readFile, stat } from 'fs/promises';
import { queue } from 'async';
import { glob } from 'glob';
import yaml, { load } from 'js-yaml';
import { OpenAPIV3 } from 'openapi-types';
import {
  Model,
  parseHTTPServerRequests,
  rpcRequestForEvent,
  SecuritySchemes,
  verbose,
} from '@appland/openapi';
import { Event } from '@appland/models';
import { Arguments, Argv, number } from 'yargs';
import { inspect } from 'util';

import { locateAppMapDir } from '../lib/locateAppMapDir';
import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { locateAppMapConfigFile } from '../lib/locateAppMapConfigFile';
import Telemetry, { Git, GitState } from '../telemetry';
import { findRepository } from '../lib/git';
import { DefaultMaxAppMapSizeInMB, fileSizeFilter } from '../openapi/fileSizeFilter';
import { OpenAPICommand } from '../openapi/OpenAPICommand';

type FilterFunction = (file: string) => Promise<{ enable: boolean; message?: string }>;

// Skip files that are larger than a specified max size.
export function fileSizeFilter(maxFileSize: number): FilterFunction {
  return async (file: string): Promise<{ enable: boolean; message?: string }> => {
    let fileStat: Stats;
    try {
      fileStat = await stat(file);
    } catch {
      return { enable: false, message: `File ${file} not found` };
    }

    if (fileStat.size <= maxFileSize) return { enable: true };
    else
      return {
        enable: false,
        message: `Skipping ${file} as its file size of ${fileStat.size} bytes is larger than the maximum configured file size of ${maxFileSize} bytes`,
      };
  };
}

class OpenAPICommand {
  private readonly model = new Model();
  private readonly securitySchemes = new SecuritySchemes();

  public errors: string[] = [];
  public filter: FilterFunction = async (file: string) => ({ enable: true });

  constructor(private readonly appmapDir: string) {}

  async execute(): Promise<
    [
      {
        paths: OpenAPIV3.PathsObject;
        securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject>;
      },
      number
    ]
  > {
    const q = queue(this.collectAppMap.bind(this), 5);
    q.pause();

    // Make sure the directory exists -- if it doesn't, the glob below just returns nothing.
    if (!existsSync(this.appmapDir)) {
      throw new Error(`AppMap directory ${this.appmapDir} does not exist`);
    }

    const files = glob.sync(join(this.appmapDir, '**', '*.appmap.json'));
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const filterResult = await this.filter(file);
      if (!filterResult.enable) {
        if (filterResult.message) console.warn(filterResult.message);
        continue;
      }

      q.push(file);
    }

    if (q.length() > 0) {
      await new Promise<void>((resolve, reject) => {
        q.drain(resolve);
        q.error(reject);
        q.resume();
      });
    }

    return [
      {
        paths: this.model.openapi(),
        securitySchemes: this.securitySchemes.openapi(),
      },
      files.length,
    ];
  }

  async collectAppMap(file: string): Promise<void> {
    try {
      const data = await fsp.readFile(file, 'utf-8');
      parseHTTPServerRequests(JSON.parse(data), (e: Event) => {
        const request = rpcRequestForEvent(e);
        if (request) {
          this.model.addRpcRequest(request);
          this.securitySchemes.addRpcRequest(request);
        }
      });
    } catch (e) {
      // Re-throwing this error crashes the whole process.
      // So if there is a malformed AppMap, indicate it here but don't blow everything up.
      // Do not write to stdout!
      let errorString: string;
      try {
        errorString = inspect(e);
      } catch (x) {
        errorString = ((e as any) || '').toString();
      }
      this.errors.push(errorString);
    }
  }
}

async function loadTemplate(fileName: string): Promise<any> {
  if (!fileName) {
    // eslint-disable-next-line no-param-reassign
    fileName = join(__dirname, '../../resources/openapi-template.yaml');
  }
  return yaml.load((await fsp.readFile(fileName)).toString());
}

export default {
  command: 'openapi',
  OpenAPICommand,
  aliases: ['swagger'],
  describe: 'Generate OpenAPI from AppMaps in a directory',
  builder(args: Argv) {
    args.option('directory', {
      describe: 'program working directory',
      type: 'string',
      alias: 'd',
    });
    args.option('appmap-dir', {
      describe: 'directory to recursively inspect for AppMaps',
    });
    args.option('max-size', {
      describe: 'maximum AppMap size that will be processed, in filesystem-reported MB',
      default: '50',
    });
    args.option('output-file', {
      alias: ['o'],
      describe: 'output file name',
      requiresArg: true,
    });
    args.option('openapi-template', {
      describe:
        'template YAML; generated content will be placed in the paths and components sections',
    });
    args.option('openapi-title', {
      describe: 'info/title field of the OpenAPI document',
    });
    args.option('openapi-version', {
      describe: 'info/version field of the OpenAPI document',
    });
    return args.strict();
  },
  async handler(argv: Arguments | any) {
    verbose(argv.verbose);
    handleWorkingDirectory(argv.directory);
    const appmapDir = await locateAppMapDir(argv.appmapDir);
    const { openapiTitle, openapiVersion, maxSize } = argv;
    const maxAppMapSizeInBytes = Math.round(parseFloat(maxSize) * 1024 * 1024);

    function tryConfigure(path: string, fn: () => void) {
      try {
        fn();
      } catch {
        console.warn(`Warning: unable to configure OpenAPI field ${path}`);
      }
    }

    const appmapConfigFile = await locateAppMapConfigFile(appmapDir);

    const cmd = new OpenAPICommand(appmapDir);
    cmd.filter = fileSizeFilter(maxAppMapSizeInBytes);
    const [openapi, numAppMaps] = await cmd.execute();
    sendTelemetry(openapi.paths, numAppMaps, appmapDir);

    for (const error of cmd.errors) {
      console.warn(error);
    }

    const template = await loadTemplate(argv.openapiTemplate);
    template.paths = openapi.paths;

    if (openapiTitle) {
      tryConfigure('info.title', () => {
        template.info.title = openapiTitle;
      });
    }
    if (openapiVersion) {
      tryConfigure('info.version', () => {
        template.info.version = openapiVersion;
      });
    }

    // TODO: This should be made available, but isn't
    template.components = (openapi as any).components;
    template.components ||= {};

    let appmapConfig: Record<string, any> | undefined;
    if (appmapConfigFile) {
      appmapConfig = (load(await readFile(appmapConfigFile, 'utf-8')) || {}) as any;
    }

    const overrides = appmapConfig?.openapi?.overrides;
    const schemas = appmapConfig?.openapi?.schemas;
    if (schemas) template.components.schemas = schemas;
    if (overrides) applySchemaOverrides(template.paths, overrides);
    if (template.paths) sortProperties(template.paths);

    const fileContents = `# This document can be generated with the following command: 
# npx @appland/appmap@latest openapi
#
# NOTE: You will need Node.js installed on your machine to run the above command
#
# Some helpful options:
#   --output-file        output file name
#   --openapi-title      title field of the OpenAPI document
#   --openapi-version    version field of the OpenAPI document
#
# For more info, run:
# npx @appland/appmap@latest openapi --help
#
# Visit our docs: https://appmap.io/docs/openapi.html
#
${yaml.dump(template)}
`;
    if (argv.outputFile) {
      await fsp.writeFile(argv.outputFile, fileContents);
    } else {
      console.log(fileContents);
    }
  },
};

async function sendTelemetry(paths: OpenAPIV3.PathsObject, numAppMaps: number, appmapDir: string) {
  const gitState = GitState[await Git.state(appmapDir)];
  const contributors = (await Git.contributors(60, appmapDir)).length;
  Telemetry.sendEvent(
    {
      name: 'appmap:openapi',
      properties: {
        git_state: gitState,
        'appmap.version_control.repository': await warnCatch(findRepository(appmapDir)),
      },
      metrics: {
        paths: Object.keys(paths).length,
        contributors,
        numAppMaps,
      },
    },
    { includeEnvironment: true }
  );
}

function sortProperties(values: Record<string, any>): void {
  Object.keys(values).forEach((key) => {
    let value = values[key];
    if (key === 'properties' && typeof value === 'object') {
      values[key] = Object.keys(value)
        .sort()
        .reduce((memo, key) => {
          const v = value[key];
          if (typeof v === 'object' && v !== null && v.constructor !== Array) sortProperties(v);
          memo[key] = v;
          return memo;
        }, {});
    } else if (typeof value === 'object' && value !== null) {
      sortProperties(value);
    }
  });
}

function applySchemaOverrides(paths: Record<string, any>, overrides: Record<string, any>) {
  Object.keys(overrides).forEach((key) => {
    const value = overrides[key];
    if (value === undefined) return;

    if (paths[key] == undefined) return;

    if (key === 'schema') {
      paths.schema = { ...overrides.schema };
    } else if (typeof value === 'object') {
      applySchemaOverrides(paths[key], value);
    }
  });
}

async function warnCatch<T>(fn: Promise<T | undefined>): Promise<T | undefined> {
  try {
    return await fn;
  } catch (err) {
    console.warn(err);
    return;
  }
}
