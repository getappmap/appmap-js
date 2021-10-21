import { readFile } from 'fs/promises';
import { load } from 'js-yaml';
import { join, sep } from 'path';
import { verbose } from 'src/scanner/util';
import { URL } from 'url';

interface AppMapConfig {
  openapiSchema: Record<string, string>;
}

const appmapConfig = async (workingDir: string): Promise<AppMapConfig> => {
  const homeDir = process.env.HOME;
  let dir = workingDir;
  let appmapData: Buffer | undefined;

  const upDir = () => {
    const dirTokens = dir.split(sep);
    dirTokens.pop();
    return dirTokens.join(sep);
  };

  while (!appmapData && dir !== homeDir && dir.split(sep).length > 1) {
    try {
      appmapData = await readFile(join(dir, 'appmap.yml'));
    } catch {
      dir = upDir();
    }
  }
  if (!appmapData) {
    throw new Error(`No appmap.yml found in ${workingDir}`);
  }

  return load(appmapData!.toString()) as AppMapConfig;
};

const fetchSchema = async (_sourceURL: string): Promise<any> => {
  return load(
    (
      await readFile(
        `/Users/kgilpin/source/land-of-apps/sample_app_6th_ed/swagger/openapi_stable.yaml`
      )
    ).toString()
  );
};

const lookup = async (urlStr: string, workingDir: string): Promise<any> => {
  const { host } = new URL(urlStr);
  const config = await appmapConfig(workingDir);
  const sourceURL = config.openapiSchema[host];
  const schemaData = await fetchSchema(sourceURL);
  const version = schemaData.openapi;
  if (verbose()) {
    console.warn(`Loading schema for version ${version}`);
  }
  return schemaData;
};

export default lookup;
