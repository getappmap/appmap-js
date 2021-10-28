import { load } from 'js-yaml';
import { URL } from 'url';
import { OpenAPIV3 } from 'openapi-types';
import http, { IncomingMessage } from 'http';
import https from 'https';
import { readFile } from 'fs/promises';

type Loader = (url: URL) => Promise<Buffer>;

const URLLoader = (protocol: any) => {
  return (url: URL): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      protocol
        .get(url)
        .on('response', (response: IncomingMessage) => {
          if (response.statusCode !== 200) {
            return reject(`${response.statusCode} ${response.statusMessage}`);
          }

          const data: Buffer[] = [];
          response
            .on('data', (chunk: Buffer) => {
              data.push(Buffer.from(chunk));
            })
            .on('end', () => {
              resolve(Buffer.concat(data));
            });
        })
        .on('error', reject);
    });
  };
};

const FileLoader = (url: URL): Promise<Buffer> => {
  return readFile(url.pathname);
};

const ProtocolLoader: Record<string, Loader> = {
  'http:': URLLoader(http),
  'https:': URLLoader(https),
  'file:': FileLoader,
};

const fetch = (urlStr: string): Promise<Buffer> => {
  const url = new URL(urlStr);
  const loader = ProtocolLoader[url.protocol];
  if (!loader) {
    throw new Error(`No schema loader for protocol ${url.protocol}`);
  }
  return loader(url);
};

const SchemaCache: Record<string, OpenAPIV3.Document> = {};
const schemaCache = async (key: string, fn: (key: string) => Promise<OpenAPIV3.Document>) => {
  const cachedResult = SchemaCache[key];
  if (cachedResult) {
    return cachedResult;
  }

  const result = await fn(key);
  SchemaCache[key] = result;
  return result;
};

const fetchSchema = async (sourceURL: string): Promise<OpenAPIV3.Document> => {
  return schemaCache(sourceURL, async (sourceURL: string) => {
    const data = await fetch(sourceURL);
    return load(data.toString()) as OpenAPIV3.Document;
  });
};

const lookup = async (
  host: string,
  openapiSchemata: Record<string, string>
): Promise<OpenAPIV3.Document> => {
  const sourceURL = openapiSchemata[host];
  if (!sourceURL) {
    throw new Error(
      `No OpenAPI schema URL configured for host ${host}. Available hosts are: ${Object.keys(
        openapiSchemata
      ).join(', ')}`
    );
  }
  return await fetchSchema(sourceURL);
};

export default lookup;
