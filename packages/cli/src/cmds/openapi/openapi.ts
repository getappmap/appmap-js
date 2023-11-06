import { join } from 'path';

import { existsSync } from 'fs';
import { promises as fsp } from 'fs';
import { readFile } from 'fs/promises';
import yaml, { load } from 'js-yaml';
import { OpenAPIV3 } from 'openapi-types';
import { verbose } from '@appland/openapi';
import { Arguments, Argv } from 'yargs';

import { locateAppMapDir } from '../../lib/locateAppMapDir';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { locateAppMapConfigFile } from '../../lib/locateAppMapConfigFile';
import { DefaultMaxAppMapSizeInMB, fileSizeFilter } from '../../lib/fileSizeFilter';
import { findFiles } from '../../utils';
import DataStore from './DataStore';
import DefinitionGenerator from './DefinitionGenerator';

export type FilterFunction = (file: string) => Promise<{ enable: boolean; message?: string }>;

class OpenAPICommand {
  public errors: string[] = [];
  public filter: FilterFunction = async (file: string) => ({ enable: true });

  constructor(private readonly appmapDir: string) {}

  async execute(): Promise<
    [
      {
        warnings: Record<string, string[]>;
        paths: OpenAPIV3.PathsObject;
        securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject>;
      },
      number
    ]
  > {
    // Make sure the directory exists -- if it doesn't, the glob below just returns nothing.
    if (!existsSync(this.appmapDir)) {
      throw new Error(`AppMap directory ${this.appmapDir} does not exist`);
    }

    const dataStore = new DataStore();
    await dataStore.initialize();

    const collectAppMap = async (file: string) => {
      try {
        await dataStore.storeAppMap(file);
      } catch (e) {
        let errorString: string;
        try {
          errorString = (e as any).toString();
        } catch (x) {
          errorString = ((e as any) || '').toString();
        }
        this.errors.push(errorString);
      }
    };

    const appMapFiles = await findFiles(this.appmapDir, '.appmap.json');
    for (const file of appMapFiles) {
      const filterResult = await this.filter(file);
      if (!filterResult.enable) {
        if (filterResult.message) console.warn(filterResult.message);
        continue;
      }
      await collectAppMap(file);
    }
    await dataStore.closeAll();

    const definitionGenerator = new DefinitionGenerator(dataStore);
    const { warnings, paths, securitySchemes } = await definitionGenerator.generate();

    // Leave the files in place if an error occurs.
    await dataStore.cleanup();

    return [
      {
        warnings,
        paths,
        securitySchemes,
      },
      appMapFiles.length,
    ];
  }
}

async function loadTemplate(fileName: string): Promise<any> {
  if (!fileName) {
    // eslint-disable-next-line no-param-reassign
    fileName = join(__dirname, '../../../resources/openapi-template.yaml');
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
      type: 'number',
      default: DefaultMaxAppMapSizeInMB,
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
    const { openapiTitle, openapiVersion, maxSize, maxExamples } = argv;
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
    const [openapi] = await cmd.execute();

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

    let warnings = ['#'];
    if (Object.keys(openapi.warnings).length) {
      warnings.push('# OpenAPI generator reported warnings during processing:');
      for (const [path, messages] of Object.entries(openapi.warnings)) {
        for (const message of messages) {
          warnings.push(`#   ${path}: ${message}`);
        }
      }
      warnings.push('#');
    }

    const fileContents = `# This document can be generated with the following command: 
#   appmap openapi
#
# Some helpful options:
#   --output-file        output file name
#   --openapi-title      title field of the OpenAPI document
#   --openapi-version    version field of the OpenAPI document
#
# For more info, run:
#   appmap openapi --help
#
# Visit our docs: https://appmap.io/docs/openapi.html
${warnings.join('\n')}
${yaml.dump(template)}
`;
    if (argv.outputFile) {
      await fsp.writeFile(argv.outputFile, fileContents);
    } else {
      console.log(fileContents);
    }
  },
};

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
